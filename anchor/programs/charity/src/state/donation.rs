use anchor_lang::prelude::*;

use crate::common::constants::CHARITY_NAME_MAX_LEN;

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
