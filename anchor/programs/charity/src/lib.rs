#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am");

#[program]
pub mod charity {
    use super::*;

    pub fn close(_ctx: Context<CloseCharity>) -> Result<()> {
        Ok(())
    }

    pub fn initialize(_ctx: Context<InitializeCharity>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCharity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  init,
  space = 8 + Charity::INIT_SPACE,
  payer = payer
  )]
    pub charity: Account<'info, Charity>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseCharity<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
    pub charity: Account<'info, Charity>,
}

#[account]
#[derive(InitSpace)]
pub struct Charity {
    count: u8,
}
