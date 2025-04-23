use anchor_lang::prelude::*;

use crate::common::constants::*;

#[account]
#[derive(InitSpace, Debug)]
pub struct Charity {
    pub authority: Pubkey, // Wallet controlling the charity
    #[max_len(CHARITY_NAME_MAX_LEN)]
    pub name: String, // Charity name
    #[max_len(CHARITY_DESCRIPTION_MAX_LEN)]
    pub description: String, // Description of charity
    pub sol_donations_in_lamports: u64, // Running total of SOL donated (in lamports)
    pub usdc_donations: u64, // Running total of USDC donated
    pub donation_count: u64, // Number of donations received
    pub paused: bool,      // Reject donations in paused
    pub created_at: i64,   // When charity was created
    pub updated_at: i64,   // When charity was updated
    pub deleted_at: Option<i64>, // When charity was deleted
    pub withdrawn_at: Option<i64>, // When donations were withdrawn
    pub vault_bump: u8,    // Reference to associated vault PDA
    pub usdc_mint: Pubkey, // USDC mint address
}
