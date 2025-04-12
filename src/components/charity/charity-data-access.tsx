"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cluster, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProvider } from "../solana/solana-provider";
import { useCluster } from "../cluster/cluster-data-access";
import toast from "react-hot-toast";
import { useMemo } from "react";
import { useTransactionToast } from "../ui/ui-layout";

import {
  ANCHOR_DISCRIMINATOR_SIZE,
  getCharityProgram,
  getCharityProgramId,
} from "../../../anchor/src/charity-exports";

export interface CreateCharityArgs {
  name: string;
  description: string;
}

export interface UpdateCharityArgs {
  charity: string;
  description: string;
}

export interface DonateArgs {
  charity: string;
  amount: number;
}

export interface PauseDonationsArgs {
  charity: string;
  paused: boolean;
}

export interface WithdrawDonationsArgs {
  charity: string;
  recipient: string;
  amount: number;
}

export interface DeleteCharityArgs {
  charity: string;
  recipient: string;
}

export const findCharityPda = (
  name: string,
  authority: PublicKey,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("charity"), authority.toBuffer(), Buffer.from(name)],
    programId
  );
};

export const findVaultPda = (charityPda: PublicKey, programId: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), charityPda.toBuffer()],
    programId
  );
};

export const findDonationPda = (
  donor: PublicKey,
  charity: PublicKey,
  donationCount: number,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("donation"),
      donor.toBuffer(),
      charity.toBuffer(),
      new BN(donationCount).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
};

export function useCharityProgram() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { cluster } = useCluster();

  const provider = useAnchorProvider();
  const queryClient = useQueryClient();

  const transactionToast = useTransactionToast();

  const programId = useMemo(
    () => getCharityProgramId(cluster.network as Cluster),
    [cluster]
  );

  const program = useMemo(
    () => getCharityProgram(provider, programId),
    [provider, programId]
  );

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  // Query to fetch all charity accounts
  const getAllCharities = useQuery({
    queryKey: ["charity", "all", { cluster }],
    queryFn: () => program.account.charity.all(),
  });

  // Query to fetch all charity accounts created by the connected wallet
  const getMyCharities = useQuery({
    queryKey: ["charity", "my", { cluster, publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!publicKey) return [];

      try {
        // Fetch all charity accounts where authority = publicKey
        const accounts = await program.account.charity.all([
          {
            memcmp: {
              offset: ANCHOR_DISCRIMINATOR_SIZE,
              bytes: publicKey.toBase58(),
            },
          },
        ]);

        return accounts.map((account) => ({
          publicKey: account.publicKey,
          ...account.account,
        }));
      } catch (error) {
        console.error("Error fetching my charities:", error);
        return [];
      }
    },
    enabled: !!publicKey && !!provider,
  });

  // Query to fetch all donations made by the connected wallet
  const getMyDonations = useQuery({
    queryKey: ["donation", "my", { cluster, publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!publicKey) return [];

      try {
        // Fetch all donation accounts where donorKey = publicKey
        const accounts = await program.account.donation.all([
          {
            memcmp: {
              offset: ANCHOR_DISCRIMINATOR_SIZE,
              bytes: publicKey.toBase58(),
            },
          },
        ]);

        return accounts.map((account) => ({
          publicKey: account.publicKey,
          ...account.account,
        }));
      } catch (error) {
        console.error("Error fetching my donations:", error);
        return [];
      }
    },
    enabled: !!publicKey && !!provider,
  });

  const createCharity = useMutation<string, Error, CreateCharityArgs>({
    mutationKey: ["charity", "create", { cluster }],
    mutationFn: async ({ name, description }) => {
      if (!publicKey) throw new Error("Wallet not connected");

      try {
        return program.methods
          .createCharity(name, description)
          .accounts({
            authority: publicKey,
          })
          .rpc();
      } catch (error) {
        console.error("Error creating charity:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Charity created successfully!");
      return queryClient.invalidateQueries({ queryKey: ["charity"] });
    },
    onError: (error) => toast.error(`Failed to create charity: ${error}`),
  });

  const updateCharity = useMutation<string, Error, UpdateCharityArgs>({
    mutationKey: ["charity", "update", { cluster }],
    mutationFn: async ({ charity, description }) => {
      try {
        return program.methods
          .updateCharity(description)
          .accounts({
            authority: publicKey,
            charity: new PublicKey(charity),
          })
          .rpc();
      } catch (error) {
        console.error("Error updating charity:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Charity updated successfully!");
      return queryClient.invalidateQueries({ queryKey: ["charity"] });
    },
    onError: (error) => toast.error(`Failed to update charity: ${error}`),
  });

  const donate = useMutation<string, Error, DonateArgs>({
    mutationKey: ["donation", "create", { cluster }],
    mutationFn: async ({ charity, amount }) => {
      if (!publicKey) throw new Error("Wallet not connected");

      try {
        return program.methods
          .donateSol(new BN(amount))
          .accounts({
            donor: publicKey,
            charity: new PublicKey(charity),
          })
          .rpc();
      } catch (error) {
        console.error("Error donating to charity:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Donation made successfully!");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["charity"] }),
        queryClient.invalidateQueries({ queryKey: ["donation"] }),
      ]);
    },
    onError: (error) => toast.error(`Failed to donate: ${error}`),
  });

  const pauseDonations = useMutation<string, Error, PauseDonationsArgs>({
    mutationKey: ["charity", "pause", { cluster }],
    mutationFn: async ({ charity, paused }) => {
      try {
        return program.methods
          .pauseDonations(paused)
          .accounts({
            authority: publicKey,
            charity: new PublicKey(charity),
          })
          .rpc();
      } catch (error) {
        console.error("Error pausing donations:", error);
        throw error;
      }
    },
    onSuccess: (signature, { paused }) => {
      transactionToast(signature);
      toast.success(
        `Donations ${paused ? "paused" : "unpaused"} successfully!`
      );
      return queryClient.invalidateQueries({ queryKey: ["charity"] });
    },
    onError: (error) => toast.error(`Failed to update pause status: ${error}`),
  });

  const withdrawDonations = useMutation<string, Error, WithdrawDonationsArgs>({
    mutationKey: ["charity", "withdraw", { cluster }],
    mutationFn: async ({ charity, recipient, amount }) => {
      try {
        return program.methods
          .withdrawDonations(new BN(amount))
          .accounts({
            charity: new PublicKey(charity),
            recipient: new PublicKey(recipient),
          })
          .rpc();
      } catch (error) {
        console.error("Error withdrawing donations:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Funds withdrawn successfully!");
      return queryClient.invalidateQueries({ queryKey: ["charity"] });
    },
    onError: (error) => toast.error(`Failed to withdraw funds: ${error}`),
  });

  const deleteCharity = useMutation<string, Error, DeleteCharityArgs>({
    mutationKey: ["charity", "delete", { cluster }],
    mutationFn: async ({ charity, recipient }) => {
      if (!publicKey) throw new Error("Wallet not connected");
      
      try {
        return program.methods
          .deleteCharity()
          .accounts({
            charity: new PublicKey(charity),
            recipient: new PublicKey(recipient),
          })
          .rpc();
      } catch (error) {
        console.error("Error deleting charity:", error);
        throw error;
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Charity deleted successfully!");
      return queryClient.invalidateQueries({ queryKey: ["charity"] });
    },
    onError: (error) => toast.error(`Failed to delete charity: ${error}`),
  });

  return {
    program,
    programId,
    getProgramAccount,
    getAllCharities,
    getMyCharities,
    getMyDonations,
    createCharity,
    updateCharity,
    donate,
    pauseDonations,
    withdrawDonations,
    deleteCharity,
  };
}

export function useCharityAccount(charityKey: PublicKey | undefined) {
  const { cluster } = useCluster();
  const { program } = useCharityProgram();
  const provider = useAnchorProvider();

  // Query to fetch a specific charity account
  const charityQuery = useQuery({
    queryKey: [
      "charity",
      "fetch",
      { cluster, charityKey: charityKey?.toString() },
    ],
    queryFn: async () => {
      if (!charityKey) return null;

      try {
        const account = await program.account.charity.fetch(charityKey);
        return {
          publicKey: charityKey,
          ...account,
        };
      } catch (error) {
        console.error("Error fetching charity account:", error);
        return null;
      }
    },
    enabled: !!charityKey && !!provider,
  });

  // Query to fetch all donations for this charity
  const donationsQuery = useQuery({
    queryKey: [
      "donations",
      "charity",
      { cluster, charityKey: charityKey?.toString() },
    ],
    queryFn: async () => {
      if (!charityKey) return [];

      try {
        // Find all donation accounts where charityKey matches
        const accounts = await program.account.donation.all([
          {
            memcmp: {
              offset: ANCHOR_DISCRIMINATOR_SIZE + 32, // Skip discriminator + donorKey
              bytes: charityKey.toBase58(),
            },
          },
        ]);

        return accounts.map((account) => ({
          publicKey: account.publicKey,
          ...account.account,
        }));
      } catch (error) {
        console.error("Error fetching charity donations:", error);
        return [];
      }
    },
    enabled: !!charityKey && !!provider && !!charityQuery.data,
  });

  // Get vault balance
  const vaultBalanceQuery = useQuery({
    queryKey: [
      "vault",
      "balance",
      { cluster, charityKey: charityKey?.toString() },
    ],
    queryFn: async () => {
      if (!charityKey || !program) return null;

      try {
        // Find the vault PDA for this charity
        const [vaultPda] = findVaultPda(charityKey, program.programId);

        // Get the SOL balance of the vault
        const balance = await provider.connection.getBalance(vaultPda);
        return balance;
      } catch (error) {
        console.error("Error fetching vault balance:", error);
        return null;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!charityKey && !!provider && !!program,
  });

  return {
    charityQuery,
    donationsQuery,
    vaultBalanceQuery,
  };
}

export function useDonationAccount(donationKey: PublicKey | undefined) {
  const { cluster } = useCluster();
  const { program } = useCharityProgram();
  const provider = useAnchorProvider();

  // Query to fetch a specific donation account
  const donationQuery = useQuery({
    queryKey: [
      "donation",
      "fetch",
      { cluster, donationKey: donationKey?.toString() },
    ],
    queryFn: async () => {
      if (!donationKey) return null;

      try {
        const account = await program.account.donation.fetch(donationKey);
        return {
          publicKey: donationKey,
          ...account,
        };
      } catch (error) {
        console.error("Error fetching donation account:", error);
        return null;
      }
    },
    enabled: !!donationKey && !!provider,
  });

  return {
    donationQuery,
  };
}

// Helper hook to get total donations and donation count for a charity
export function useCharityStats(charityKey: PublicKey | undefined) {
  const { donationsQuery } = useCharityAccount(charityKey);

  const stats = useMemo(() => {
    if (!donationsQuery.data || donationsQuery.data.length === 0) {
      return {
        totalDonations: 0,
        donationCount: 0,
        averageDonation: 0,
      };
    }

    const totalDonations = donationsQuery.data.reduce(
      (sum, donation) => sum + Number(donation.amountInLamports || 0),
      0
    );

    return {
      totalDonations,
      donationCount: donationsQuery.data.length,
      averageDonation: totalDonations / donationsQuery.data.length,
    };
  }, [donationsQuery.data]);

  return stats;
}
