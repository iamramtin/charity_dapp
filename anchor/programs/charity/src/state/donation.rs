use anchor_lang::prelude::*;

use crate::common::constants::CHARITY_NAME_MAX_LEN;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub enum TokenType {
    Sol,
    Usdc,
}

#[account]
#[derive(InitSpace, Debug)]
pub struct Donation {
    pub donor_key: Pubkey,   // Key of wallet that made the donation
    pub charity_key: Pubkey, // Key of charity that received the donation
    #[max_len(CHARITY_NAME_MAX_LEN)]
    pub charity_name: String, // Name of charity that received the donation
    pub amount: u64,         // Amount donated
    pub token_type: TokenType, // Type of token donated (SOL or USDC)
    pub created_at: i64,     // When donation was made
}

impl Donation {
    pub const INIT_SPACE: usize = 32 + 32 + CHARITY_NAME_MAX_LEN + 8 + 1 + 8;
}
