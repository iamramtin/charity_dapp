# Team To-Do List

## On-Chain (Solana Program / Anchor)

### ✅ `create_charity` Instruction

1. Implement an instruction to create a new `Charity` account.
2. Require the authority's signature for initialization.
3. Set initial fields such as `name`, `authority`, and default values for optional fields.

### ✅ `update_charity` Instruction

1. Allow the authority to update charity details (e.g., `description`, `tags`, `withdrawal_recipient`).
2. Enforce proper constraints to ensure only the authority can make updates.

### ✅ `delete_charity` Instruction

1. Implement an instruction to delete a `Charity` account.
2. Ensure all funds are withdrawn before deletion.
3. Require the authority's signature for deletion.

### ✅ `donate_sol` Instruction

1. Implement an instruction to allow users to donate SOL to a charity.
2. Update the charity's donation stats and store donor information.

### ✅ `withdraw_donations` Instruction

1. Allow the authority to withdraw donations from the charity account.

### `set_withdrawal_recipient` Instruction (Optional)

1. Add `pub withdrawal_recipient: Option<Pubkey>` to the `Charity` account.
2. Implement the `set_withdrawal_recipient()` instruction:
   - Allow the charity to set or update the withdrawal recipient address.
   - Require authority signature for updates.
3. Update `withdraw_donations()`:
   - Use `withdrawal_recipient` if set; fallback to the original authority otherwise.

### ✅ `pause_donations` Instruction (Optional) - Completed

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

### Charity Tags/Categories (Optional)

1. Add a `tags` or `categories` field to the `Charity` account.
2. Allow charities to set or update their tags.
3. Use tags for better discoverability in the frontend.

### Charity Verification (Optional)

1. Implement a mechanism for verifying charities:
   - Use DAO votes or trusted verifiers to approve charities.
2. Add a `verified` field to the `Charity` account.
3. Display verification status in the frontend.

### Recurring Donations (Optional)

1. Add support for recurring donations:
   - Allow users to schedule periodic donations.
   - Use a cron-like mechanism or external service to trigger donations.
2. Store recurring donation metadata in a new account or existing structure.

---

## ✅ Tests (Solana-Bankrun / Mocha / Anchor) - Completed

1. ✅ Write and maintain test coverage for instructions:
   - ✅ `pause_donations` / `unpause_donations`
   - ✅ Charity creation flows
   - ✅ SOL donation flows
   - ✅ Withdrawals with and without recipient override
2. ✅ Include edge cases and error scenarios.

---

## Off-Chain Handlers (Anchor + TypeScript) - Completed

### ✅ Add Hooks for Core Functionality (Data Access Layer)

✅ 1. Implemented functions in the data access layer:

- ✅ `getAllCharities`: Fetch all `Charity` accounts.
- ✅ `getMyCharities`: Fetch charities owned by the current user.
- ✅ `getMyDonations`: Fetch donations made by the current user.
- ✅ `createCharity`: Create a new charity account.
- ✅ `updateCharity`: Update details of an existing charity.
- ✅ `donate`: Donate to a charity.
- ✅ `pauseDonations`: Pause donations for a charity.
- ✅ `withdrawDonations`: Withdraw donations from a charity.
- ✅ `deleteCharity`: Delete a charity account.
- ✅ `useAccount`: Hook to fetch and manage a specific charity account.

✅ 2. Ensure all functions and hooks handle loading, error states, and caching efficiently.

---

## Frontend (React) - In Progress

### ✅ Charity Management

1. ✅ Use `useAccount` to display charity details:
   - `name`, `authority`, `paused` status, donation stats, recipient wallet (if set).
2. ✅ Add action buttons for:
   - Pause / Unpause donations (`pauseDonations`).
   - Set withdrawal recipient (`updateCharity`).

### ✅ Donation Flow

1. ✅ Use `donate` to handle SOL.
2. ✅ Validate input amount and token type.
3. ✅ Display paused state and disable donation if applicable.

### Withdraw Flow (For Authority)

1. Use `withdrawDonations` to withdraw funds to self or a custom recipient.
2. Display available balances for both SOL.

### ✅ Charity Listings

1. ✅ Use `getAllCharities` to fetch and display all charities.
2. ✅ Use `getMyCharities` to fetch and display charities owned by the current user.

### ✅ Donation History

1. ✅ Use `getMyDonations` to display the user's donation history.
2. ✅ Use `useDonationAccount` to fetch and manage donation-specific data.

---

## DevOps / Infrastructure

### Devnet Deployment

1. ✅ Add pipeline scripts to build and test frontend and Anchor program.
2. Deploy the smart contract to Devnet.
3. ✅ Create a deployment script:
   - Use `anchor deploy` and upload the IDL.
4. Store the program ID and IDL in the GitHub repository.

---

## Bonus Enhancements

### Solana Blinks

1. Integrate with [Dialect Blinks](https://docs.dialect.to).

### Program Constraints Cleanup

1. ✅ Use `has_one`, `constraint`, and `seeds` consistently.
2. ✅ Enforce authority and PDA ownership checks throughout the program.
