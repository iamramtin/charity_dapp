#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

pub mod common;
pub mod instructions;
pub mod state;

use crate::common::*;
use crate::instructions::*;
use crate::state::Charity;

declare_id!("9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am");

#[program]
pub mod charity {

    use super::*;

    pub fn create_charity(
        ctx: Context<CreateCharity>,
        name: String,
        description: String,
    ) -> Result<()> {
        // Validate input lengths
        require!(
            name.len() <= CHARITY_NAME_MAX_LEN,
            CustomError::InvalidNameLength
        );
        require!(
            description.len() <= CHARITY_DESCRIPTION_MAX_LEN,
            CustomError::InvalidDescriptionLength
        );

        let current_time = Clock::get()?.unix_timestamp;

        *ctx.accounts.charity = Charity {
            authority: ctx.accounts.authority.key(),
            name,
            description,
            donations_in_lamports: 0,
            donation_count: 0,
            paused: false,
            created_at: current_time,
            updated_at: current_time,
            deleted_at: None,
            withdrawn_at: None,
            vault_bump: ctx.bumps.vault,
        };

        // Ensure the vault PDA is owned by the program
        require!(
            ctx.accounts.vault.owner == ctx.program_id,
            CustomError::Unauthorized
        );

        emit!(CreateCharityEvent {
            charity_key: ctx.accounts.charity.key(),
            charity_name: ctx.accounts.charity.name.clone(),
            description: ctx.accounts.charity.description.clone(),
            created_at: current_time,
        });

        Ok(())
    }

    pub fn update_charity(ctx: Context<UpdateCharity>, description: String) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            !description.eq(&charity.description),
            CustomError::InvalidDescription
        );

        require!(
            description.len() <= CHARITY_DESCRIPTION_MAX_LEN,
            CustomError::InvalidDescriptionLength
        );

        charity.description = description;
        charity.updated_at = current_time;

        emit!(UpdateCharityEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            description: charity.description.clone(),
            updated_at: current_time,
        });

        Ok(())
    }

    pub fn delete_charity(ctx: Context<DeleteCharity>) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let authority = &mut ctx.accounts.authority;
        let recipient = &mut ctx.accounts.recipient;
        let current_time = Clock::get()?.unix_timestamp;

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(
            vault.key(),
            expected_vault,
            CustomError::InvalidVaultAccount
        );

        let vault_balance = **vault.lamports.borrow();
        let mut withdrawn_to_recipient = false;

        if vault_balance > 0 {
            if recipient.lamports() > 0 {
                // Transfer to recipient
                **vault.lamports.borrow_mut() = vault_balance.checked_sub(vault_balance).unwrap();
                **recipient.lamports.borrow_mut() = recipient
                    .lamports()
                    .checked_add(vault_balance)
                    .ok_or(error!(CustomError::Overflow))?;
                withdrawn_to_recipient = true;
            } else {
                // Transfer to authority
                **vault.lamports.borrow_mut() = vault_balance.checked_sub(vault_balance).unwrap();
                **authority.lamports.borrow_mut() = authority
                    .lamports()
                    .checked_add(vault_balance)
                    .ok_or(error!(CustomError::Overflow))?;
            }
        }

        msg!("Charity Deleted: {}", charity.name);

        emit!(DeleteCharityEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            deleted_at: current_time,
            withdrawn_to_recipient, // Emit the withdrawal destination
        });

        Ok(())
    }

    pub fn pause_donations(ctx: Context<PauseDonations>, paused: bool) -> Result<()> {
        let charity = &mut ctx.accounts.charity;
        let current_time = Clock::get()?.unix_timestamp;

        charity.paused = paused;
        charity.updated_at = current_time;

        emit!(PauseDonationsEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            paused,
            updated_at: current_time,
        });

        Ok(())
    }

    pub fn donate_sol(ctx: Context<DonateSol>, amount: u64) -> Result<()> {
        let donor = &mut ctx.accounts.donor;
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let donation = &mut ctx.accounts.donation;
        let current_time = Clock::get()?.unix_timestamp;

        // Check that donations are not paused
        require!(!charity.paused, CustomError::DonationsPaused);

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(
            vault.key(),
            expected_vault,
            CustomError::InvalidVaultAccount
        );

        // Create the transfer instruction from donor to vault PDA
        let transfer_instruction = system_instruction::transfer(donor.key, vault.key, amount);

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                donor.to_account_info(),
                vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Update charity state
        charity.donation_count = charity
            .donation_count
            .checked_add(1)
            .ok_or(error!(CustomError::Overflow))?;

        charity.donations_in_lamports = charity
            .donations_in_lamports
            .checked_add(amount)
            .ok_or(error!(CustomError::Overflow))?;

        // Record donation history
        donation.donor_key = donor.key();
        donation.charity_key = charity.key();
        donation.charity_name = charity.name.clone();
        donation.amount_in_lamports = amount;
        donation.created_at = current_time;

        emit!(MakeDonationEvent {
            donor_key: donor.key(),
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            amount,
            created_at: current_time,
        });

        Ok(())
    }

    pub fn withdraw_donations(ctx: Context<WithdrawDonations>, amount: u64) -> Result<()> {
        let recipient = &mut ctx.accounts.recipient;
        let charity = &mut ctx.accounts.charity;
        let vault = &mut ctx.accounts.vault;
        let current_time = Clock::get()?.unix_timestamp;

        let (expected_vault, _vault_bump) =
            Pubkey::find_program_address(&[b"vault", charity.key().as_ref()], ctx.program_id);
        require_keys_eq!(
            vault.key(),
            expected_vault,
            CustomError::InvalidVaultAccount
        );

        // Ensure there are enough lamports to withdraw
        let vault_balance = **vault.lamports.borrow();
        require!(
            amount > 0 && vault_balance >= amount,
            CustomError::InsufficientFunds
        );

        let rent = Rent::get()?;
        let min_rent = rent.minimum_balance(0);

        // Ensure we maintain rent-exemption threshold
        require!(
            vault_balance.checked_sub(amount).unwrap_or(0) >= min_rent,
            CustomError::InsufficientFundsForRent
        );

        // Transfer lamports from vault to recipient via direct lamport manipulation
        // - Program-owned accounts cannot use the System Program's transfer instruction directly to send lamports.
        // - Instead, we modify the lamport balances directly.
        // - The program has authority to modify the lamport balances of accounts it owns.
        // - Total sum of lamports must remain the same before and after a transaction.
        **vault.lamports.borrow_mut() = vault_balance.checked_sub(amount).unwrap();
        **recipient.lamports.borrow_mut() = recipient
            .lamports()
            .checked_add(amount)
            .ok_or(error!(CustomError::Overflow))?;

        // Update charity state
        charity.donations_in_lamports = charity
            .donations_in_lamports
            .checked_sub(amount)
            .ok_or(error!(CustomError::Overflow))?;
        charity.withdrawn_at = Some(current_time);

        // We could also use CPI to transfer lamports:

        // use anchor_lang::solana_program::{program::invoke_signed, system_instruction};
        // let from_vault_pubkey = ctx.accounts.vault.to_account_info();
        // let to_recipient_pubkey = ctx.accounts.recipient.to_account_info();
        // let program_id = ctx.accounts.system_program.to_account_info();
        // let seed = ctx.accounts.charity.key();
        // let ix = &system_instruction::transfer(&from_vault_pubkey.key(), &to_recipient_pubkey.key(),amount);
        // let vault_seeds: &[&[&[u8]]] = &[&[b"vault", seed.as_ref(), &[ctx.bumps.vault]]];
        // invoke_signed(ix, &[from_vault_pubkey, to_recipient_pubkey, program_id], vault_seeds)?;



        emit!(WithdrawCharitySolEvent {
            charity_key: charity.key(),
            charity_name: charity.name.clone(),
            donations_in_lamports: charity.donations_in_lamports,
            donation_count: charity.donation_count,
            withdrawn_at: current_time,
        });

        Ok(())
    }
}
