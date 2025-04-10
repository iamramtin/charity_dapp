"use client";

import { getCharityProgram, getCharityProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

export function useCharityProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
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

  const initialize = useMutation({
    mutationKey: ["charity", "initialize", { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .initialize()
        .accounts({ charity: keypair.publicKey })
        .signers([keypair])
        .rpc(),
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
    initialize,
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

  const closeMutation = useMutation({
    mutationKey: ["charity", "close", { cluster, account }],
    mutationFn: () =>
      program.methods.close().accounts({ charity: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  return {
    accountQuery,
    closeMutation,
  };
}
