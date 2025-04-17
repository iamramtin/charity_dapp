use anchor_lang::prelude::*;

use crate::state::Charity;

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
