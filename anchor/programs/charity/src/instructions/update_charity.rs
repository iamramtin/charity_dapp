use anchor_lang::prelude::*;

use crate::state::Charity;

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
