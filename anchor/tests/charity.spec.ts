import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Charity } from "../target/types/charity";

describe("charity", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Charity as Program<Charity>;

  const charityKeypair = Keypair.generate();

  it("Initialize Charity", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          charity: charityKeypair.publicKey,
          payer: payer.publicKey,
        })
        .signers([charityKeypair])
        .rpc();

      const currentCount = await program.account.charity.fetch(
        charityKeypair.publicKey
      );

      expect(currentCount.count).toEqual(0);
    } catch (error: any) {
      console.error("Initialize charity failed:", error);
      throw new Error("Initialize charity failed");
    }
  });

  it("Set close the charity account", async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        charity: charityKeypair.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const userAccount = await program.account.charity.fetchNullable(
      charityKeypair.publicKey
    );
    expect(userAccount).toBeNull();
  });
});
