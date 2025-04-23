use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::Charity;

#[derive(Accounts)]
pub struct WithdrawUsdc<'info> {
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
    pub vault: Account<'info, TokenAccount>,

    /// Destination account that will receive the withdrawn USDC
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawUsdc>, amount: u64) -> Result<()> {
    let recipient = &mut ctx.accounts.recipient;
    let charity = &mut ctx.accounts.charity;
    let vault = &mut ctx.accounts.vault;
    let current_time = Clock::get()?.unix_timestamp;

    // Ensure there are enough USDC to withdraw
    let vault_balance = vault.amount;
    require!(
        amount > 0 && vault_balance >= amount,
        CustomError::InsufficientFunds
    );

    // Transfer USDC from vault to recipient
    let cpi_accounts = Transfer {
        from: vault.to_account_info(),
        to: recipient.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );

    token::transfer(cpi_ctx, amount)?;

    // Update charity state
    charity.usdc_donations = charity
        .usdc_donations
        .checked_sub(amount)
        .ok_or(error!(CustomError::Overflow))?;
    charity.withdrawn_at = Some(current_time);

    emit!(WithdrawCharityUsdcEvent {
        charity_key: charity.key(),
        charity_name: charity.name.clone(),
        usdc_donations: charity.usdc_donations,
        donation_count: charity.donation_count,
        withdrawn_at: current_time,
    });

    Ok(())
} 