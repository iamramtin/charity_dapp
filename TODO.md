# Team To-Do List

---

## On-Chain (Solana Program / Anchor)

### Core Features (Completed)

### `set_withdrawal_recipient` Instruction (Optional)

1. Add `pub withdrawal_recipient: Option<Pubkey>` to the `Charity` account.
2. Implement the `set_withdrawal_recipient()` instruction:
   - Allow the charity to set or update the withdrawal recipient address.
   - Require authority signature for updates.
3. Update `withdraw_donations()`:
   - Use `withdrawal_recipient` if set; fallback to the original authority otherwise.

### `pause_donations` Instruction (Optional)

1. Add `pub paused: bool` to the `Charity` account.
2. Implement the following instructions:
   - `pause_donations()`: Set `paused` to `true`.
   - `unpause_donations()`: Set `paused` to `false`.
3. Update `donate()`:
   - Reject donations if the charity is paused.

### USDC Support (Optional)

1. Enable USDC donations alongside SOL:
   - Update `donate()` to support token transfers using `token::transfer` CPI.
   - Update `withdraw_donations()` to handle USDC withdrawals.
2. Add a method to distinguish between SOL and USDC donations (e.g., enum or boolean flag in `Donation`).

---

## Tests (Solana-Bankrun / Mocha / Anchor)

1. Write and maintain test coverage for all instructions:
   - `set_withdrawal_recipient`
   - `pause_donations` / `unpause_donations`
   - SOL and USDC donation flows
   - Withdrawals with and without recipient override
2. Include edge cases and error scenarios.

---

## Off-Chain Handlers (Anchor + TypeScript)

### Implement Anchor Instructions (Stub + Client Fetch)

1. Create stub instructions in the program for consistency:
   - `get_charities`: Return a list of all `Charity` accounts.
   - `get_charity_donations`: Return donations for a given charity.
   - `get_donor_donations`: Return donations made by a specific donor.
2. Implement client-side logic to fetch and resolve these accounts.

---

## Frontend (React)

### Charity Detail Page

1. Display charity information:
   - `name`, `authority`, `paused` status, donation stats
   - Recipient wallet (if set)
2. Add action buttons:
   - Pause / Unpause donations
   - Set withdrawal recipient

### Donation Flow

1. Allow toggling between SOL and USDC.
2. Validate input amount and token type.
3. Display paused state and disable donation if applicable.

### Withdraw Flow (For Authority)

1. Create a form to withdraw to either self or the custom recipient.
2. Show available balances for both SOL and USDC.

---

## DevOps / Infrastructure

### Devnet Deployment

1. Deploy the smart contract to Devnet.
2. Create a deployment script:
   - Use `anchor deploy` and upload the IDL.
3. Store the program ID and IDL in the GitHub repository.

---

## Bonus Enhancements

### Solana Blinks

1. Integrate with [Dialect Blinks](https://docs.dialect.to).

### Program Constraints Cleanup

1. Use `has_one`, `constraint`, and `seeds` consistently.
2. Enforce authority and PDA ownership checks throughout the program.
