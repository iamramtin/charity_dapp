use anchor_lang::{prelude::*, Discriminator};

use crate::state::*;

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
        space = Donation::DISCRIMINATOR.len() + Donation::INIT_SPACE,
        seeds = [b"donation", donor.key().as_ref(), charity.key().as_ref(), &charity.donation_count.to_le_bytes()],
        bump
    )]
    pub donation: Account<'info, Donation>,

    pub system_program: Program<'info, System>,
}
