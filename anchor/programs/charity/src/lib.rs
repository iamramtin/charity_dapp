#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

pub mod constants;
pub use constants::*;

declare_id!("9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am");

#[program]
pub mod charity {
    use super::*;

    pub fn create_charity(
        ctx: Context<CreateCharity>,
        name: String,
        description: String,
    ) -> Result<()> {
        // Validate input lengths
        require!(
            name.len() <= CHARITY_NAME_MAX_LEN,
            ErrorCode::InvalidNameLength
        );
        require!(
            description.len() <= CHARITY_DESCRIPTION_MAX_LEN,
            ErrorCode::InvalidDescriptionLength
        );

        let current_time = Clock::get()?.unix_timestamp;

        *ctx.accounts.charity = Charity {
            authority: ctx.accounts.authority.key(),
            name,
            description,
            donations_in_lamports: 0,
            donation_count: 0,
            paused: false,
            created_at: current_time,
            updated_at: current_time,
            deleted_at: None,
            withdrawn_at: None,
            vault_bump: ctx.bumps.vault,
        };

        // Ensure the vault PDA is owned by the program
        require!(
            ctx.accounts.vault.owner == ctx.program_id,
            ErrorCode::Unauthorized
        );

        emit!(CreateCharityEvent {
            charity_key: ctx.accounts.charity.key(),
            charity_name: ctx.accounts.charity.name.clone(),
            description: ctx.accounts.charity.description.clone(),
            created_at: current_time,
        });

        Ok(())
    }

    pub fn update_charity(ctx: Context<UpdateCharity>, description: String) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            !description.eq(&charity.description),
            ErrorCode::InvalidDescription
        );

        require!(
            description.len() <= CHARITY_DESCRIPTION_MAX_LEN,
            ErrorCode::InvalidDescriptionLength
        );

        charity.description = description;
        charity.updated_at = current_time;

        emit!(UpdateCharityEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            description: charity.description.clone(),
            updated_at: current_time,
        });

        Ok(())
    }

    pub fn delete_charity(ctx: Context<DeleteCharity>) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let authority = &mut ctx.accounts.authority;
        let recipient = &mut ctx.accounts.recipient;
        let current_time = Clock::get()?.unix_timestamp;

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(vault.key(), expected_vault, ErrorCode::InvalidVaultAccount);

        let vault_balance = **vault.lamports.borrow();
        let mut withdrawn_to_recipient = false;

        if vault_balance > 0 {
            if recipient.lamports() > 0 {
                // Transfer to recipient
                **vault.lamports.borrow_mut() = vault_balance.checked_sub(vault_balance).unwrap();
                **recipient.lamports.borrow_mut() = recipient
                    .lamports()
                    .checked_add(vault_balance)
                    .ok_or(error!(ErrorCode::Overflow))?;
                withdrawn_to_recipient = true;
            } else {
                // Transfer to authority
                **vault.lamports.borrow_mut() = vault_balance.checked_sub(vault_balance).unwrap();
                **authority.lamports.borrow_mut() = authority
                    .lamports()
                    .checked_add(vault_balance)
                    .ok_or(error!(ErrorCode::Overflow))?;
            }
        }

        msg!("Charity Deleted: {}", charity.name);

        emit!(DeleteCharityEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            deleted_at: current_time,
            withdrawn_to_recipient, // Emit the withdrawal destination
        });

        Ok(())
    }

    pub fn pause_donations(ctx: Context<PauseDonations>, paused: bool) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let current_time = Clock::get()?.unix_timestamp;

        charity.paused = paused;
        charity.updated_at = current_time;

        emit!(PauseDonationsEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            paused,
            updated_at: current_time,
        });

        Ok(())
    }

    pub fn donate_sol(ctx: Context<DonateSol>, amount: u64) -> Result<()> {
        let donor = &mut ctx.accounts.donor;
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let donation = &mut ctx.accounts.donation;
        let current_time = Clock::get()?.unix_timestamp;

        // Check that donations are not paused
        require!(!charity.paused, ErrorCode::DonationsPaused);

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(vault.key(), expected_vault, ErrorCode::InvalidVaultAccount);

        // Create the transfer instruction from donor to vault PDA
        let transfer_instruction = system_instruction::transfer(donor.key, vault.key, amount);

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                donor.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update charity state
        charity.donation_count = charity
            .donation_count
            .checked_add(1)
            .ok_or(error!(ErrorCode::Overflow))?;

        charity.donations_in_lamports = charity
            .donations_in_lamports
            .checked_add(amount)
            .ok_or(error!(ErrorCode::Overflow))?;

        // Record donation history
        donation.donor_key = donor.key();
        donation.charity_key = charity.key();
        donation.charity_name = charity.name.clone();
        donation.amount_in_lamports = amount;
        donation.created_at = current_time;

        emit!(MakeDonationEvent {
            donor_key: donor.key(),
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            amount,
            created_at: current_time,
        });

        Ok(())
    }

    pub fn withdraw_donations(ctx: Context<WithdrawDonations>, amount: u64) -> Result<()> {
        let recipient = &mut ctx.accounts.recipient;
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let current_time = Clock::get()?.unix_timestamp;

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(vault.key(), expected_vault, ErrorCode::InvalidVaultAccount);

        // Ensure there are enough lamports to withdraw
        let vault_balance = **vault.lamports.borrow();
        require!(
            amount > 0 && vault_balance >= amount,
            ErrorCode::InsufficientFunds
        );

        let rent = Rent::get()?;
        let min_rent = rent.minimum_balance(0);

        // Ensure we maintain rent-exemption threshold
        require!(
            vault_balance.checked_sub(amount).unwrap_or(0) >= min_rent,
            ErrorCode::InsufficientFundsForRent
        );

        // Transfer lamports from vault to recipient via direct lamport manipulation
        // - Program-owned accounts cannot use the System Program's transfer instruction directly to send lamports.
        // - Instead, we modify the lamport balances directly.
        // - The program has authority to modify the lamport balances of accounts it owns.
        // - Total sum of lamports must remain the same before and after a transaction.
        **vault.lamports.borrow_mut() = vault_balance.checked_sub(amount).unwrap();
        **recipient.lamports.borrow_mut() = recipient
            .lamports()
            .checked_add(amount)
            .ok_or(error!(ErrorCode::Overflow))?;

        // Update charity state
        charity.donations_in_lamports = charity
            .donations_in_lamports
            .checked_sub(amount)
            .ok_or(error!(ErrorCode::Overflow))?;
        charity.withdrawn_at = Some(current_time);

        // We could also use CPI to transfer lamports:

        // use anchor_lang::solana_program::{program::invoke_signed, system_instruction};
        // let from_vault_pubkey = ctx.accounts.vault.to_account_info();
        // let to_recipient_pubkey = ctx.accounts.recipient.to_account_info();
        // let program_id = ctx.accounts.system_program.to_account_info();
        // let seed = ctx.accounts.charity.key();
        // let ix = &system_instruction::transfer(&from_vault_pubkey.key(), &to_recipient_pubkey.key(),amount);
        // let vault_seeds: &[&[&[u8]]] = &[&[b"vault", seed.as_ref(), &[ctx.bumps.vault]]];
        // invoke_signed(ix, &[from_vault_pubkey, to_recipient_pubkey, program_id], vault_seeds)?;

        emit!(WithdrawCharitySolEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            donations_in_lamports: charity.donations_in_lamports,
            donation_count: charity.donation_count,
            withdrawn_at: current_time,
        });

        Ok(())
    }
}

/**
 * PROGRAM INSTRUCTIONS
 */
#[derive(Accounts)]
#[instruction(name: String, description: String)]
pub struct CreateCharity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ANCHOR_DISCRIMINATOR_SIZE + Charity::INIT_SPACE,
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

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(description: String)]
pub struct UpdateCharity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"charity", authority.key().as_ref(), charity.name.as_bytes()],
        bump,
        has_one = authority,
    )]
    pub charity: Account<'info, Charity>,
}

#[derive(Accounts)]
pub struct DeleteCharity<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        seeds = [b"charity", authority.key().as_ref(), charity.name.as_bytes()],
        bump,
        has_one = authority,
    )]
    pub charity: Account<'info, Charity>,

    #[account(
        mut,
        seeds = [b"vault", charity.key().as_ref()],
        bump
    )]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub vault: UncheckedAccount<'info>,

    /// Destination account that will receive the withdrawn SOL
    /// Allows the charity authority to send funds to a different address than their own
    /// Why `UncheckedAccount`:
    /// - We're only transferring SOL (no deserialization required)
    /// - We're not enforcing any constraints on it through Anchor's account validation
    #[account(mut)]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(paused: bool)]
pub struct PauseDonations<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"charity", authority.key().as_ref(), charity.name.as_bytes()],
        bump,
        has_one = authority,
    )]
    pub charity: Account<'info, Charity>,
}

#[derive(Accounts)]
pub struct DonateSol<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(mut)]
    pub charity: Account<'info, Charity>,

    #[account(
        mut,
        seeds = [b"vault", charity.key().as_ref()],
        bump
    )]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub vault: UncheckedAccount<'info>,

    /// Donation account to keep track of history
    #[account(
        init,
        payer = donor,
        space = ANCHOR_DISCRIMINATOR_SIZE + Donation::INIT_SPACE,
        seeds = [b"donation", donor.key().as_ref(), charity.key().as_ref(), &charity.donation_count.to_le_bytes()],
        bump
    )]
    pub donation: Account<'info, Donation>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawDonations<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority
    )]
    pub charity: Account<'info, Charity>,

    #[account(
        mut,
        seeds = [b"vault", charity.key().as_ref()],
        bump
    )]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub vault: UncheckedAccount<'info>,

    /// Destination account that will receive the withdrawn SOL
    /// Allows the charity authority to send funds to a different address than their own
    /// Why `UncheckedAccount`:
    /// - We're only transferring SOL (no deserialization required)
    /// - We're not enforcing any constraints on it through Anchor's account validation
    #[account(mut)]
    /// CHECK: Safe because it's a PDA with known seeds and only receives SOL via system program
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/**
 * ACCOUNTS
 */
#[account]
#[derive(InitSpace, Debug)]
pub struct Charity {
    pub authority: Pubkey, // Wallet controlling the charity
    #[max_len(CHARITY_NAME_MAX_LEN)]
    pub name: String, // Charity name
    #[max_len(CHARITY_DESCRIPTION_MAX_LEN)]
    pub description: String, // Description of charity
    pub donations_in_lamports: u64, // Running total of SOL donated (in lamports)
    pub donation_count: u64, // Number of donations received
    pub paused: bool,      // Reject donations in paused
    pub created_at: i64,   // When charity was created
    pub updated_at: i64,   // When charity was updated
    pub deleted_at: Option<i64>, // When charity was deleted
    pub withdrawn_at: Option<i64>, // When donations were withdrawn
    pub vault_bump: u8,    // Reference to associated vault PDA
}

#[account]
#[derive(InitSpace, Debug)]
pub struct Donation {
    pub donor_key: Pubkey,   // Key of wallet that made the donation
    pub charity_key: Pubkey, // Key of charity that received the donation
    #[max_len(CHARITY_NAME_MAX_LEN)]
    pub charity_name: String, // Name of charity that received the donation
    pub amount_in_lamports: u64, // Amount of SOL donated amount (in lamports)
    pub created_at: i64,     // When donation was made
}

/**
 * ERROR_CODES
 */
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Math overflow occurred")]
    Overflow,

    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,

    #[msg("Cannot withdraw below rent-exemption threshold")]
    InsufficientFundsForRent,

    #[msg("Invalid description")]
    InvalidDescription,

    #[msg("Invalid description length")]
    InvalidDescriptionLength,

    #[msg("Invalid name length")]
    InvalidNameLength,

    #[msg("Invalid vault account")]
    InvalidVaultAccount,

    #[msg("Donations for this charity are paused")]
    DonationsPaused,
}

/**
 * EVENTS
 */
#[event]
pub struct CreateCharityEvent {
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub description: String,
    pub created_at: i64,
}

#[event]
pub struct UpdateCharityEvent {
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub description: String,
    pub updated_at: i64,
}

#[event]
pub struct DeleteCharityEvent {
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub deleted_at: i64,
    pub withdrawn_to_recipient: bool,
}

#[event]
pub struct WithdrawCharitySolEvent {
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub donations_in_lamports: u64,
    pub donation_count: u64,
    pub withdrawn_at: i64,
}

#[event]
pub struct PauseDonationsEvent {
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub paused: bool,
    pub updated_at: i64,
}

#[event]
pub struct MakeDonationEvent {
    pub donor_key: Pubkey,
    pub charity_key: Pubkey,
    pub charity_name: String,
    pub amount: u64,
    pub created_at: i64,
}
