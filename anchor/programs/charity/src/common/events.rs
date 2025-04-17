use anchor_lang::prelude::*;

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
