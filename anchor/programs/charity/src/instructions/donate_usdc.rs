use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::common::errors::CustomError;
use crate::common::events::MakeDonationEvent;

#[derive(Accounts)]
pub struct DonateUsdc<'info> {
    #[account(mut)]
    pub donor: Signer<'info>,

    #[account(mut)]
    pub charity: Account<'info, Charity>,

    #[account(
        mut,
        seeds = [b"vault", charity.key().as_ref()],
        bump
    )]
    /// CHECK: Safe because it's a PDA with known seeds and only receives USDC via token program
    pub vault: Account<'info, TokenAccount>,

    /// Donation account to keep track of history
    #[account(
        init,
        payer = donor,
        space = Donation::INIT_SPACE,
        seeds = [b"donation", donor.key().as_ref(), charity.key().as_ref(), &charity.donation_count.to_le_bytes()],
        bump
    )]
    pub donation: Account<'info, Donation>,

    #[account(mut)]
    pub donor_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn donate_usdc(ctx: Context<DonateUsdc>, amount: u64) -> Result<()> {
    let donor = &mut ctx.accounts.donor;
    let charity = &mut ctx.accounts.charity;
    let vault = &mut ctx.accounts.vault;
    let donation = &mut ctx.accounts.donation;
    let donor_token_account = &mut ctx.accounts.donor_token_account;
    let current_time = Clock::get()?.unix_timestamp;

    // Check that donations are not paused
    require!(!charity.paused, CustomError::DonationsPaused);

    // Transfer USDC from donor to vault
    let cpi_accounts = Transfer {
        from: donor_token_account.to_account_info(),
        to: vault.to_account_info(),
        authority: donor.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );

    token::transfer(cpi_ctx, amount)?;

    // Update charity state
    charity.donation_count = charity
        .donation_count
        .checked_add(1)
        .ok_or(error!(CustomError::Overflow))?;

    // Record donation history
    donation.donor_key = donor.key();
    donation.charity_key = charity.key();
    donation.charity_name = charity.name.clone();
    donation.amount = amount;
    donation.token_type = TokenType::Usdc;
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