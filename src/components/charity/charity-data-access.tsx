"use client";

import { getCharityProgram, getCharityProgramId } from "@project/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

interface CreateCharityArgs {
  name: string,
  description: string,
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
    mutationFn: async ({ name, description }) => {

      return program.methods
        .createCharity(name, description)
        .rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
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

  const accountQuery = useQuery({
    queryKey: ["charity", "fetch", { cluster, account }],
    queryFn: () => program.account.charity.fetch(account),
  });

  return {
    accountQuery,

  };
}
