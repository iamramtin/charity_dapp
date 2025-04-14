# Solana Charity Platform dApp

A decentralized charity donation platform built on the Solana blockchain. This application enables transparent fundraising, seamless donations, and complete accountability through blockchain technology.

## 🔥 Features

- **Create Charities:** Set up charity fundraisers with custom names and descriptions
- **Donate SOL:** Make donations directly to charities of your choice
- **Track Donations:** View complete donation history and statistics
- **Withdraw Funds:** Charity owners can withdraw donations for their causes
- **Pause/Resume:** Temporarily pause donations when needed
- **Transparent History:** All donations are permanently recorded on the blockchain

## 🏛️ Technical Architecture

This dApp consists of three main components:

- **Solana Smart Contract**: Written in Rust using the Anchor framework
- **Data Access Layer**: TypeScript hooks that interface with the Solana blockchain
- **React UI**: Modern, responsive interface for interacting with the contract

## 🚀 Getting Started

### Prerequisites

- [Rust & Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- [Node.js & npm](https://nodejs.org/en/download/)
- A Solana wallet (Phantom, Solflare, etc.)

### 🔧 Setup & Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/iamramtin/charity-dapp.git
   cd solana-charity-dapp
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   anchor build
   cd frontend
   ```

3. **Building the Project:**

   ```sh
   npm run anchor::build
   npm run build
   ```

4. **Running the Tests:**

   ```sh
   npm run anchor::test
   ```

5. **Running the App:**

   ```sh
   npm run dev
   ```

## Smart Contract

The charity program implements these key instructions:

- **createCharity**: Create a new charity with specified name and description
- **updateCharity**: Update a charity's description
- **donateSol**: Make a donation to a specific charity
- **pauseDonations**: Toggle donation status
- **withdrawDonations**: Withdraw funds to a recipient account
- **deleteCharity**: Remove a charity and recover rent

## Security Considerations

- Only the charity authority can manage, update, withdraw from, or delete their charity
- Donations are stored in a vault account owned by the program
- Withdrawals preserve minimum rent-exempt balance
- All actions are recorded with timestamps for transparency

## 📄 License

This project is licensed under the MIT License.
