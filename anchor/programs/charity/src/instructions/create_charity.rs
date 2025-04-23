use anchor_lang::prelude::*;

use crate::state::Charity;
use crate::common::constants::*;
use crate::common::errors::CustomError;
use crate::common::events::CreateCharityEvent;

#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct CreateCharity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Charity::INIT_SPACE,
        seeds = [b"charity", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub charity: Account<'info, Charity>,

    /// The vault that will hold donated SOL for the charity.
    ///
    /// Why we use a separate vault:
    /// - Solana accounts must remain **rent-exempt** to persist.
    /// - If we store lamports directly in the `Charity` account and its balance drops below
    ///   the rent-exempt threshold (e.g., after a withdrawal), the account could be purged.
    /// - `Charity` is a data account, so mixing lamports and state increases fragility.
    /// - This vault PDA has **no custom data layout** — it's just a secure lamport holder.
    ///
    /// Design Pattern:
    /// - Keep **data and funds separate**
    /// - Store metadata in `Charity`
    /// - Store SOL in a **dedicated PDA vault**
    ///
    /// Why `UncheckedAccount`:
    /// - We're only transferring SOL (no deserialization required)
    /// - The vault is a PDA we derive deterministically with known seeds
    /// - Ownership checks aren't enforced because it's program-derived and safe
    /// - Minimal overhead — we just need the public key and `mut` access
    ///
    /// Safety:
    /// - This vault must be verified by seeds in the program logic
    #[account(
        init,
        payer = authority,
        space = 0, // No data, just holds lamports
        seeds = [b"vault", charity.key().as_ref()],
        bump
    )]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub vault: UncheckedAccount<'info>,

    /// The USDC mint address
    /// CHECK: Safe because we only use it to store the mint address
    pub usdc_mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn create_charity(ctx: Context<CreateCharity>, name: String, description: String) -> Result<()> {
    // Validate input lengths
    require!(
        name.len() <= CHARITY_NAME_MAX_LEN,
        CustomError::InvalidNameLength
    );
    require!(
        description.len() <= CHARITY_DESCRIPTION_MAX_LEN,
        CustomError::InvalidDescriptionLength
    );

    let current_time = Clock::get()?.unix_timestamp;

    *ctx.accounts.charity = Charity {
        authority: ctx.accounts.authority.key(),
        name,
        description,
        sol_donations_in_lamports: 0,
        usdc_donations: 0,
        donation_count: 0,
        paused: false,
        created_at: current_time,
        updated_at: current_time,
        deleted_at: None,
        withdrawn_at: None,
        vault_bump: ctx.bumps.vault,
        usdc_mint: ctx.accounts.usdc_mint.key(),
    };

    // Ensure the vault PDA is owned by the program
    require!(
        ctx.accounts.vault.owner == ctx.program_id,
        CustomError::Unauthorized
    );

    emit!(CreateCharityEvent {
        charity_key: ctx.accounts.charity.key(),
        charity_name: ctx.accounts.charity.name.clone(),
        description: ctx.accounts.charity.description.clone(),
        created_at: current_time,
    });

    Ok(())
}
