"use client";
// Since this charity program has five instructions,
// we will need components in the UI that will be able to call each of these instructions

import { getCharityProgram, getCharityProgramId } from "@project/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Cluster, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery} from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { BN } from "@coral-xyz/anchor";
import { publicDecrypt } from "crypto";

interface CreateCharityArgs {
  name: string,
  description: string,
}
interface UpdateCharityArgs {
  charity: string,
  description: string,
}

interface DonateSolArgs {
  amount: number,
}

interface DeleteCharityArgs {
  recipient: string,
}

interface WithdrawSolArgs {
  recipient: string,
  amount: number,
}

export function useCharityProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const { publicKey } = useWallet();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();

  const programId = useMemo(
    () => getCharityProgramId(cluster.network as Cluster),
    [cluster]
  );

  const program = useMemo(
    () => getCharityProgram(provider, programId),
    [provider, programId]
  );

  const accounts = useQuery({
    queryKey: ["charity", "all", { cluster }],
    queryFn: () => program.account.charity.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createCharity = useMutation<string, Error, CreateCharityArgs>({
    mutationKey: ["charity", "create", { cluster }],
    mutationFn: async ({ name, description}) => {
      if (!publicKey) throw new Error("Wallet not connected");

      const [charityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("charity"), publicKey.toBuffer(), Buffer.from(name)],
        program.programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), charityPda.toBuffer()],
        program.programId
      );


      return program.methods
        .createCharity(name, description)
        .accounts({
          authority: publicKey,
          charity: charityPda,
          vault: vaultPda,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      toast.success("Charity account created successfully!");
      accounts.refetch();
    },
    onError: (error) => toast.error(`Failed to create charity account: ${error}`),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createCharity,
  };
}

export function useCharityProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useCharityProgram();
  const { publicKey } = useWallet();

  const accountQuery = useQuery({
    queryKey: ["charity", "fetch", { cluster, account }],
    queryFn: () => program.account.charity.fetch(account),
  });

  const updateCharity = useMutation<string, Error, UpdateCharityArgs>({
    mutationKey: ["charity", "update", { cluster }],
    mutationFn: async ({ charity, description }) => {
      return program.methods
        .updateCharity(description)
        .accounts({
          authority: publicKey,
          charity: new PublicKey(charity),
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update charity account: ${error.message}`);
    },
  });

  const deleteCharity = useMutation<string, Error, DeleteCharityArgs>({
    mutationKey: ["charity", "delete", { cluster, account}],
    mutationFn: async ({recipient}) => {
      return program.methods
        .deleteCharity()
        .accounts({
          recipient: new PublicKey(recipient),
          charity: account,
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete charity account: ${error.message}`);
    },
  });

  const donateSol = useMutation<string, Error, DonateSolArgs>({
    mutationKey: ["charity", "update", { cluster }],
    mutationFn: async ({amount}) => {
      if (!publicKey) throw new Error("Wallet not connected");

      return program.methods
      .donateSol(new BN(amount))
      .accounts({
        donor: publicKey,
        charity: account
      })
      .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to donate sol: ${error.message}`);
    },
  });

  const withdrawDonations = useMutation<string, Error, WithdrawSolArgs>({
    mutationKey: ["charity", "update", { cluster }],
    mutationFn: async ({ recipient, amount }) => {
      return program.methods
        .withdrawDonations(new BN(amount))
        .accounts({
          charity: account,
          recipient: new PublicKey(recipient)
        })
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update charity account: ${error.message}`);
    },
  });

  return {
    accountQuery,
    updateCharity,
    deleteCharity,
    donateSol,
    withdrawDonations
  };
}
