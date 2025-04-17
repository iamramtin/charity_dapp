use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Math overflow occurred")]
    Overflow,

    #[msg("Insufficient funds for withdrawal")]
    InsufficientFunds,

    #[msg("Cannot withdraw below rent-exemption threshold")]
    InsufficientFundsForRent,

    #[msg("Invalid description")]
    InvalidDescription,

    #[msg("Invalid description length")]
    InvalidDescriptionLength,

    #[msg("Invalid name length")]
    InvalidNameLength,

    #[msg("Invalid vault account")]
    InvalidVaultAccount,

    #[msg("Donations for this charity are paused")]
    DonationsPaused,
}
