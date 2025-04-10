# Solana Charity DApp

## 🌍 About the Project

Solana Charity DApp is a decentralized donation platform that allows users to donate SOL or USDC to verified charities. Built using **Solana**, **Anchor**, **React**, and **Dialect Blinks**, this project provides a seamless on-chain experience for users looking to support charitable causes.

## 🔥 Features

- **Donate SOL & USDC** to registered charities on Solana.
- **Anchor Smart Contract** to manage and track donations.
- **React Frontend** with Solana Wallet Adapter for user interaction.
- **Dialect Blinks Integration** for an enhanced donation experience.
- **Devnet Deployment** for testing and showcasing the project.
- **Potential API/Web Scraping** to pull charity data.

## 📂 Project Structure

```
sol-charity-dapp/
├── programs/              # Solana smart contracts (Anchor)
│   ├── sol_charity/       # Main Anchor program
│   ├── Cargo.toml         # Rust dependencies
│   ├── src/lib.rs         # Entry point of the Solana program
│
├── frontend/              # React-based frontend
│   ├── src/               # UI & web3 integrations
│   ├── package.json       # Dependencies
│   ├── wallet-adapter.ts  # Solana wallet connection
│
├── migrations/            # Anchor deployment scripts
├── tests/                 # Smart contract tests
├── Anchor.toml            # Anchor config
├── README.md              # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- [Rust & Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- [Node.js & npm](https://nodejs.org/en/download/)

### 🔧 Setup & Installation

1. **Install Dependencies:**

   ```sh
   anchor build
   cd frontend
   npm install
   ```

2. **Run Solana Localnet for Testing:**

   ```sh
   solana-test-validator --reset
   ```

3. **Deploy Smart Contract on Devnet:**

   ```sh
   anchor deploy
   ```

4. **Start Frontend Development Server:**

   ```sh
   cd frontend
   npm start
   ```

## 📜 Smart Contract Overview

### **Data Structures**

#### `CharityAccount`

```rust
#[account]
pub struct CharityAccount {
    pub wallet: Pubkey,       // Charity's wallet address
    pub total_donated: u64,   // Total SOL received
    pub bump: u8,             // PDA bump seed
}
```

#### `Donation`

```rust
#[account]
pub struct Donation {
    pub donor: Pubkey,        // Address of the donor
    pub charity: Pubkey,      // Address of the charity
    pub amount: u64,          // Amount donated
    pub timestamp: i64,       // Donation timestamp
}
```

### **Create a Charity Account**

- Stores charity wallet & total donations.
- PDA is derived using:
  ```rust
  let (charity_pda, _bump) = Pubkey::find_program_address(
      &[b"charity", charity_wallet.key().as_ref()],
      program_id
  );
  ```

### **Donate SOL to a Charity**

```rust
pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
    let charity = &mut ctx.accounts.charity;
    let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.donor.key(),
        &charity.wallet,
        amount,
    );
    anchor_lang::solana_program::program::invoke(
        &transfer_instruction,
        &[
            ctx.accounts.donor.to_account_info(),
            ctx.accounts.charity.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    charity.total_donated += amount;
    Ok(())
}
```

### **Frontend Integration**

- **Wallet Connection** via `@solana/wallet-adapter-react`
- **Anchor Provider Setup**

```typescript
import { AnchorProvider, Program } from "@project-serum/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

const provider = new AnchorProvider(
    new Connection("https://api.devnet.solana.com"),
    wallet, // User's wallet
    {} // Default options
);
const program = new Program(idl, programID, provider);
```

## 📡 Future Enhancements

- **SPL Token Support** (USDC Donations)
- **Leaderboard of Top Donors**
- **AI Agents Recommendations**

## 📄 License

This project is licensed under the MIT License.
