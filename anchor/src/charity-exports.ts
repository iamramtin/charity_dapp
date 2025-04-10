// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import CharityIDL from "../target/idl/charity.json";
import type { Charity } from "../target/types/charity";

// Re-export the generated IDL and type
export { Charity, CharityIDL };

// The programId is imported from the program IDL.
export const CHARITY_PROGRAM_ID = new PublicKey(CharityIDL.address);

// This is a helper function to get the Charity Anchor program.
export function getCharityProgram(
  provider: AnchorProvider,
  address?: PublicKey
) {
  return new Program(
    {
      ...CharityIDL,
      address: address ? address.toBase58() : CharityIDL.address,
    } as Charity,
    provider
  );
}

// This is a helper function to get the program ID for the Charity program depending on the cluster.
export function getCharityProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Charity program on devnet and testnet.
      return new PublicKey("9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am");
    case "mainnet-beta":
    default:
      return CHARITY_PROGRAM_ID;
  }
}
