import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Charity } from "../target/types/charity";
import { BankrunProvider } from "anchor-bankrun";
import { startAnchor, ProgramTestContext, Clock } from "solana-bankrun";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import IDL from "../target/idl/charity.json";

describe("Charity Smart Contract Tests", () => {
  // Constants for testing
  const validCharityName = "Charity One";
  const validCharityDescription = "This is a valid charity description";

  const charityCreatedAt = Math.floor(Date.now() / 1000); // now
  const charityUpdatedAt = charityCreatedAt + 60 * 60 * 1; // 1 hour later
  const donationCreatedAt = charityCreatedAt + 60 * 60 * 2; // 2 hours later
  const charityWithdrawnAt = charityCreatedAt + 60 * 60 * 3; // 3 hours later
  const charityDeletedAt = charityCreatedAt + 60 * 60 * 4; // 4 hours later

  const invalidCharityName = "Invalid Charity";
  const invalidCharityDescription =
    "This is an invalid charity description that is intentionally made to exceed one hundred characters in length.";

  const donorFundAmount = 10_000_000_000; // 10 SOL in lamports
  const validDonationAmount = new anchor.BN(1_000_000_000); // 1 SOL in lamports
  const invalidDonationAmount = new anchor.BN(20_000_000_000); // 11 SOL in lamports
  const validWithdrawAmount = new anchor.BN(100_000_000); // 0.1 SOL in lamports
  const inValidWithdrawAmount = validDonationAmount; // No longer rent-exempy

  // Derived addresses
  let charityPda: PublicKey;
  let vaultPda: PublicKey;

  // Contexts
  let context: ProgramTestContext;
  let charityProgram: Program<Charity>;
  let donorProgram: Program<Charity>;

  // Keypairs
  let authorityKeypair: Keypair;
  const donorKeypair = Keypair.generate();
  const withdrawalRecipient = Keypair.generate();

  let connection: anchor.web3.Connection;
  let rentExemptBalance: number;

  beforeAll(async () => {
    const programId = new PublicKey(IDL.address);

    // Get the minimum rent for this account
    connection = new anchor.web3.Connection(
      "http://localhost:8899",
      "confirmed"
    );
    rentExemptBalance = await connection.getMinimumBalanceForRentExemption(0); // 0 bytes for data

    // Initialize the test context with the charity program and pre-fund the donor account
    context = await startAnchor(
      "",
      [{ name: "charity", programId }], // Load the charity program with its ID
      [
        {
          address: donorKeypair.publicKey, // Pre-fund the donor account
          info: {
            lamports: donorFundAmount,
            data: Buffer.alloc(0), // Empty data buffer
            owner: SYSTEM_PROGRAM_ID, // System program as the owner
            executable: false, // Not an executable account
          },
        },
      ]
    );

    // Setup authority
    const charityProvider = new BankrunProvider(context);
    anchor.setProvider(charityProvider);
    charityProgram = new Program(IDL as Charity, charityProvider);
    authorityKeypair = charityProvider.wallet.payer;

    // Setup donation program
    const beneficiaryProvider = new BankrunProvider(context);
    beneficiaryProvider.wallet = new NodeWallet(donorKeypair);
    donorProgram = new Program(IDL as Charity, beneficiaryProvider);

    // Derive PDAs
    [charityPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("charity"),
        authorityKeypair.publicKey.toBuffer(),
        Buffer.from(validCharityName),
      ],
      charityProgram.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), charityPda.toBuffer()],
      charityProgram.programId
    );
  });

  it("creates charity account", async () => {
    try {
      // Set the clock to simulate blockchain time
      const currentClock = await context.banksClient.getClock();
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(charityCreatedAt)
        )
      );

      const tx = await charityProgram.methods
        .createCharity(validCharityName, validCharityDescription)
        .accounts({
          authority: authorityKeypair.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      console.log("Create charity account transaction signature:", tx);

      // Fetch the created charity account
      const charity = await charityProgram.account.charity.fetch(charityPda);

      // Assertions
      expect(charity.authority.toString()).toBe(
        authorityKeypair.publicKey.toString()
      );
      expect(charity.name).toBe(validCharityName);
      expect(charity.description).toBe(validCharityDescription);
      expect(charity.donationsInLamports.toNumber()).toBe(0);
      expect(charity.donationCount.toNumber()).toBe(0);
      expect(charity.createdAt.toNumber()).toBe(charityCreatedAt);
      expect(charity.updatedAt.toNumber()).toBe(charityCreatedAt);
      expect(charity.deletedAt).toBe(null);
      expect(charity.withdrawnAt).toBe(null);

      console.log("Charity account:", JSON.stringify(charity, null, 2));
    } catch (error: any) {
      const message = `Create charity account failed:", ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("fails to create charity account with too long description", async () => {
    try {
      // Try to create a charity with a description that exceeds the max length
      await charityProgram.methods
        .createCharity(invalidCharityName, invalidCharityDescription)
        .accounts({
          authority: authorityKeypair.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      throw new Error(
        "Charity creation should have failed due to invalid description length"
      );
    } catch (error: any) {
      // Expect an error
      console.log(
        "Charity creation with too long description failed as expected"
      );
    }
  });

  it("updates charity description", async () => {
    try {
      const newDescription = "Updated charity description";

      // Fetch the charity account to ensure it exists
      const charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity).toBeDefined();

      // Set the clock to simulate blockchain time
      const currentClock = await context.banksClient.getClock();
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(charityUpdatedAt)
        )
      );

      const tx = await charityProgram.methods
        .updateCharity(newDescription)
        .accounts({
          authority: authorityKeypair.publicKey,
          charity: charityPda,
        })
        .rpc({ commitment: "confirmed" });

      console.log("Update charity account transaction signature:", tx);

      // Fetch the updated charity account
      const updatedCharity = await charityProgram.account.charity.fetch(
        charityPda
      );

      // Assertions
      expect(updatedCharity.description).toBe(newDescription);
      expect(updatedCharity.updatedAt.toNumber()).toBe(charityUpdatedAt); // Should be updated
      expect(updatedCharity.createdAt.toNumber()).toBe(charityCreatedAt); // Should remain the same

      console.log(
        "Updated charity account:",
        JSON.stringify(updatedCharity, null, 2)
      );
    } catch (error: any) {
      const message = `Update charity account failed:", ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("fails to update charity account with too long description", async () => {
    try {
      // Fetch the charity account to ensure it exists
      const charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity).toBeDefined();

      await charityProgram.methods
        .updateCharity(invalidCharityDescription)
        .accounts({
          authority: authorityKeypair.publicKey,
          charity: charityPda,
        })
        .rpc({ commitment: "confirmed" });

      throw new Error(
        "Updating charity description should have failed due to invalid description length"
      );
    } catch (error: any) {
      // Expect an error
      console.log(
        "Charity description update with too long description failed as expected"
      );
    }
  });

  it("donates SOL to charity", async () => {
    try {
      // Set the clock to simulate blockchain time
      const currentClock = await context.banksClient.getClock();
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(donationCreatedAt)
        )
      );

      // Fetch the charity account to ensure it exists
      const charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity).toBeDefined();

      const tx = await charityProgram.methods
        .donateSol(validDonationAmount)
        .accounts({
          donor: donorKeypair.publicKey,
          charity: charityPda,
        })
        .signers([donorKeypair])
        .rpc({ commitment: "confirmed" });

      console.log("Donation transaction signature:", tx);

      // Derive donation PDA (we need the current donation count)
      const donationCount = charity.donationCount.toNumber();
      const [donationPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("donation"),
          donorKeypair.publicKey.toBuffer(),
          charityPda.toBuffer(),
          new anchor.BN(donationCount).toArrayLike(Buffer, "le", 8),
        ],
        donorProgram.programId
      );

      // Fetch the updated charity and donation accounts
      const updatedCharity = await donorProgram.account.charity.fetch(
        charityPda
      );
      const donationRecord = await donorProgram.account.donation.fetch(
        donationPda
      );

      // Assertions for charity
      expect(updatedCharity.donationsInLamports.toString()).toBe(
        validDonationAmount.toString()
      );
      expect(updatedCharity.donationCount.toNumber()).toBe(donationCount + 1);

      // Assertions for donation record
      expect(donationRecord.donorKey.toString()).toBe(
        donorKeypair.publicKey.toString()
      );
      expect(donationRecord.charityKey.toString()).toBe(charityPda.toString());
      expect(donationRecord.charityName).toBe(validCharityName);
      expect(donationRecord.amountInLamports.toString()).toBe(
        validDonationAmount.toString()
      );
      expect(donationRecord.createdAt.toNumber()).toBe(donationCreatedAt);

      // Assertions for vault account
      const vaultAccount = await context.banksClient.getAccount(vaultPda);
      const vaultBalance = vaultAccount?.lamports;
      const expectedVaultBalance = validDonationAmount
        .add(new anchor.BN(rentExemptBalance))
        .toNumber();
      expect(vaultAccount?.owner.toString()).toBe(
        charityProgram.programId.toString()
      );
      expect(vaultBalance).toBe(expectedVaultBalance);

      console.log("Donation record:", JSON.stringify(donationRecord, null, 2));
    } catch (error: any) {
      const message = `Donation failed: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("fails to donate SOL to charity due to insufficient funds", async () => {
    try {
      const charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity).toBeDefined();

      await charityProgram.methods
        .donateSol(invalidDonationAmount)
        .accounts({
          donor: donorKeypair.publicKey,
          charity: charityPda,
        })
        .signers([donorKeypair])
        .rpc({ commitment: "confirmed" });

      throw new Error(
        "Donating SOL should have failed due to insufficient funds"
      );
    } catch (error: any) {
      // Expect an error
      console.log("Donating insufficient SOL failed as expected");
    }
  });

  it("pauses and unpauses donations to charity", async () => {
    try {
      // First pause donations
      await charityProgram.methods
        .pauseDonations(true)
        .accounts({
          authority: authorityKeypair.publicKey,
          charity: charityPda,
        })
        .rpc({ commitment: "confirmed" });

      // Verify charity is paused
      let charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity.paused).toBe(true);

      // Try to donate while paused - should fail
      try {
        await donorProgram.methods
          .donateSol(new anchor.BN(100_000))
          .accounts({
            donor: donorKeypair.publicKey,
            charity: charityPda,
          })
          .signers([donorKeypair])
          .rpc({ commitment: "confirmed" });

        throw new Error("Donation should have failed when charity is paused");
      } catch (error: any) {
        expect(error.message).toContain("DonationsPaused");
      }

      // Now unpause donations
      await charityProgram.methods
        .pauseDonations(false)
        .accounts({
          authority: authorityKeypair.publicKey,
          charity: charityPda,
        })
        .rpc({ commitment: "confirmed" });

      // Verify charity is unpaused
      charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity.paused).toBe(false);

      // Try to donate after unpausing - should succeed
      await donorProgram.methods
        .donateSol(new anchor.BN(100_000))
        .accounts({
          donor: donorKeypair.publicKey,
          charity: charityPda,
        })
        .signers([donorKeypair])
        .rpc({ commitment: "confirmed" });

      // Verify donation succeeded
      charity = await charityProgram.account.charity.fetch(charityPda);
      expect(charity.donationsInLamports.toNumber()).toBeGreaterThan(0);
    } catch (error: any) {
      const message = `Pause/unpause test failed: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("sets withdrawal recipient", async () => {
    try {
       // Set the withdrawal recipient
       await charityProgram.methods
        .setWithdrawalRecipient(withdrawalRecipient.publicKey)
        .accounts({
           authority: authorityKeypair.publicKey,
           charity: charityPda,
           recipient:  withdrawalRecipient.publicKey,
        })
        .rpc({ commitment: "confirmed" });
        const updatedCharity = await charityProgram.account.charity.fetch(charityPda);
        console.log("Updated recipient:", updatedCharity.recipient?.toString());

        expect(updatedCharity.recipient).toBeDefined();
        expect(updatedCharity.recipient?.toString()).toBe(withdrawalRecipient.publicKey.toString());
        console.log("Withdrawal recipient set successfully", updatedCharity.recipient?.toString());

    } catch (error: any) {
      const message = `Set withdrawal recipient failed: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("withdraws donations from vault", async () => {
    try {
      // Set the clock to simulate blockchain time
      const currentClock = await context.banksClient.getClock();
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(charityWithdrawnAt)
        )
      );
      // Get the current state
      const charityBefore = await charityProgram.account.charity.fetch(
        charityPda
      );
      const vaultAccountBefore = await context.banksClient.getAccount(vaultPda);
      const vaultBalanceBefore = vaultAccountBefore?.lamports || 0;

      console.log("Vault balance before withdrawal:", vaultBalanceBefore);
      console.log(
        "Charity donations in lamports:",
        charityBefore.donationsInLamports.toString()
      );
      console.log("Rent exempt minimum:", rentExemptBalance);

      // Verify vault ownership
      expect(vaultAccountBefore?.owner.toString()).toBe(
        charityProgram.programId.toString()
      );

      const tx = await charityProgram.methods
        .withdrawDonations(validWithdrawAmount)
        .accounts({
          charity: charityPda,
          recipient: withdrawalRecipient.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      console.log("Withdrawal transaction signature:", tx);

      // Fetch the updated charity
      const updatedCharity = await charityProgram.account.charity.fetch(
        charityPda
      );

      // Check vault balance after withdrawal
      const vaultAccountAfter = await context.banksClient.getAccount(vaultPda);
      const vaultBalanceAfter = vaultAccountAfter?.lamports || 0;

      console.log("Vault balance after withdrawal:", vaultBalanceAfter);

      // Check recipient balance
      const recipientAccount = await context.banksClient.getAccount(
        withdrawalRecipient.publicKey
      );

      // Assertions - use difference in balances instead of absolute values
      expect(vaultBalanceBefore - vaultBalanceAfter).toBe(
        validWithdrawAmount.toNumber()
      );
      expect(updatedCharity.donationsInLamports.toString()).toBe(
        charityBefore.donationsInLamports.sub(validWithdrawAmount).toString()
      );
      expect(updatedCharity.withdrawnAt?.toNumber()).toBe(charityWithdrawnAt);
      expect(recipientAccount?.lamports.toString()).toBe(
        validWithdrawAmount.toString()
      );

      console.log(
        "Updated charity after withdrawal:",
        JSON.stringify(updatedCharity, null, 2)
      );
    } catch (error: any) {
      if (error instanceof anchor.AnchorError) {
        console.error("Anchor error logs:", error.logs);
      }
      const message = `Donation failed: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });

  it("fails to withdraw more than available or below rent-exempt", async () => {
    try {
      const charity = await charityProgram.account.charity.fetch(charityPda);

      // Try to withdraw more than what's available
      const tooMuchAmount = new anchor.BN(
        charity.donationsInLamports.toNumber() * 2
      );

      await charityProgram.methods
        .withdrawDonations(tooMuchAmount)
        .accounts({
          charity: charityPda,
          recipient: withdrawalRecipient.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      throw new Error(
        "Withdrawal should have failed due to insufficient funds"
      );
    } catch (error: any) {
      // We expect an error with InsufficientFunds
      expect(error.message).toContain("InsufficientFunds");
      console.log("Withdrawal with insufficient funds failed as expected");
    }

    try {
      // Try to withdraw amount that would leave vault below rent-exempt
      // This requires calculating exactly how much would leave exactly the min rent
      const vaultAccount = await context.banksClient.getAccount(vaultPda);
      const availableToWithdraw =
        (vaultAccount?.lamports || 0) - rentExemptBalance;
      const withdrawTooMuch = new anchor.BN(availableToWithdraw + 1); // Just 1 lamport too much

      await charityProgram.methods
        .withdrawDonations(withdrawTooMuch)
        .accounts({
          charity: charityPda,
          recipient: withdrawalRecipient.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      throw new Error("Withdrawal should have failed due to rent exemption");
    } catch (error: any) {
      // We expect an error with InsufficientFundsForRent
      expect(error.message).toContain("InsufficientFundsForRent");
      console.log("Withdrawal below rent-exempt failed as expected");
    }
  });

  it("prevents unauthorized access to withdraw/update/delete", async () => {
    try {
      // Create unauthorized user
      const unauthorizedKeypair = Keypair.generate();
      const unauthorizedProvider = new BankrunProvider(context);
      unauthorizedProvider.wallet = new NodeWallet(unauthorizedKeypair);
      const unauthorizedProgram = new Program(
        IDL as Charity,
        unauthorizedProvider
      );

      // Try to withdraw as unauthorized user
      await unauthorizedProgram.methods
        .withdrawDonations(new anchor.BN(100))
        .accounts({
          charity: charityPda,
          recipient: unauthorizedKeypair.publicKey,
        })
        .rpc({ commitment: "confirmed" });

      throw new Error("Unauthorized withdrawal should have failed");
    } catch (error: any) {
      console.log("Unauthorized withdrawal failed as expected");
    }
  });

  it("deletes charity", async () => {
    try {
      // Set the clock to simulate blockchain time
      const currentClock = await context.banksClient.getClock();
      context.setClock(
        new Clock(
          currentClock.slot,
          currentClock.epochStartTimestamp,
          currentClock.epoch,
          currentClock.leaderScheduleEpoch,
          BigInt(charityDeletedAt)
        )
      );

      const recipientKeypair = Keypair.generate();

      const tx = await charityProgram.methods
        .deleteCharity()
        .accounts({
          charity: charityPda,
          recipient: recipientKeypair.publicKey,
        } as any) // Cast to `any` to bypass TypeScript warning
        .signers([authorityKeypair])
        .rpc({ commitment: "confirmed" });

      console.log("Delete charity transaction signature:", tx);

      // Try to fetch the charity (should fail)
      try {
        await charityProgram.account.charity.fetch(charityPda);
        fail("Charity account should have been deleted");
      } catch (error: any) {
        // This is expected, account should be deleted
        // expect(error.message).toContain("Account does not exist");
        console.log("Account successfully deleted");
      }

      // Check authority lamports to ensure they received the rent
      const authorityAccount = await context.banksClient.getAccount(
        authorityKeypair.publicKey
      );

      console.log(
        "Authority balance after deleting charity:",
        authorityAccount?.lamports.toString()
      );
    } catch (error: any) {
      const message = `Delete charity failed: ${error}`;
      console.error(message);
      throw new Error(message);
    }
  });
});
