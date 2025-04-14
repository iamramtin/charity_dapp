"use client";

import { useState, useMemo, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import {
  useCharityProgram,
  useCharityAccount,
} from "../data-access/charity-data-access";
import { CharityDetails, UpdateCharityForm } from "../ui/charity";
import { DonateForm } from "../ui/donation";
import { CharityCard, LoadingSpinner, EmptyState } from "../ui/shared";

// Single charity detail page
export function CharityDetailFeature() {
  const { charityId } = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();

  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const charityPubkey = useMemo(() => {
    try {
      return new PublicKey(charityId as string);
    } catch {
      return undefined;
    }
  }, [charityId]);

  const {
    donate,
    updateCharity,
    pauseDonations,
    withdrawDonations,
    deleteCharity,
  } = useCharityProgram();

  const { charityQuery, donationsQuery, vaultBalanceQuery } =
    useCharityAccount(charityPubkey);

  const charity = charityQuery.data;
  const donations = donationsQuery.data ?? [];
  const vaultBalance = vaultBalanceQuery.data ?? 0;

  // Check if the user is the authority of this charity
  const isAuthority = useMemo(() => {
    if (!publicKey || !charity) return false;
    return charity.authority.toString() === publicKey.toString();
  }, [publicKey, charity]);

  // Handle actions
  const handleDonate = useCallback(
    async (data: { amount: number }) => {
      await donate.mutateAsync({
        charity: charityId as string,
        amount: data.amount,
      });
    },
    [charityId, donate]
  );

  const handleUpdateCharity = useCallback(
    async (data: { description: string }) => {
      await updateCharity.mutateAsync({
        charity: charityId as string,
        description: data.description,
      });
      setShowUpdateForm(false);
    },
    [charityId, updateCharity]
  );

  const handlePauseToggle = useCallback(
    async (paused: boolean) => {
      await pauseDonations.mutateAsync({
        charity: charityId as string,
        paused,
      });
    },
    [charityId, pauseDonations]
  );

  const handleWithdraw = useCallback(
    async (data: { recipient: string; amount: number }) => {
      await withdrawDonations.mutateAsync({
        charity: charityId as string,
        recipient: data.recipient,
        amount: data.amount,
      });
    },
    [charityId, withdrawDonations]
  );

  const handleDelete = useCallback(async () => {
    await deleteCharity.mutateAsync({
      charity: charityId as string,
      recipient: publicKey?.toString() ?? "",
    });
    router.push("/charity");
  }, [charityId, publicKey, deleteCharity, router]);

  // Conditional UI states
  if (charityQuery.isLoading || donationsQuery.isLoading) {
    return <LoadingSpinner />;
  }

  if (charityQuery.error) {
    return (
      <EmptyState
        message="Error loading charity. The charity may not exist or has been deleted."
        icon={Icons.AlertCircle}
      />
    );
  }

  if (!charity) {
    return <EmptyState message="Charity not found." icon={Icons.Search} />;
  }

  // --- Render Section ---
  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/charity"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <Icons.ArrowLeft className="mr-2 h-4 w-4" />
          All charities
        </Link>
      </div>

      {/* Charity Details */}
      <CharityDetails
        charity={charity}
        donations={donations}
        vaultBalance={vaultBalance}
        isAuthority={isAuthority}
        onPauseToggle={handlePauseToggle}
        onWithdraw={handleWithdraw}
        onDelete={handleDelete}
      />

      {/* Update Form */}
      {isAuthority && showUpdateForm && (
        <CharityCard className="mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Update Charity Description
          </h3>
          <UpdateCharityForm
            charity={charityId as string}
            currentDescription={charity.description}
            onSubmit={handleUpdateCharity}
          />
          <button
            onClick={() => setShowUpdateForm(false)}
            className="w-full mt-2 text-gray-600 text-sm"
          >
            Cancel
          </button>
        </CharityCard>
      )}

      {/* Toggle Update Button */}
      {isAuthority && !showUpdateForm && (
        <button
          onClick={() => setShowUpdateForm(true)}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <Icons.Edit className="mr-2 h-4 w-4" />
          Update Description
        </button>
      )}

      {/* Donation Section */}
      {publicKey && !charity.paused && !isAuthority && (
        <CharityCard className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Make a Donation</h3>
          <DonateForm charity={charityId as string} onSubmit={handleDonate} />
        </CharityCard>
      )}

      {/* Donation Paused Notice */}
      {charity.paused && (
        <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
          <Icons.Pause className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Donations are Paused
          </h3>
          <p className="text-gray-600">
            The charity organizer has temporarily paused donations. Check back
            later.
          </p>
        </div>
      )}

      {/* Wallet Not Connected */}
      {!publicKey && !charity.paused && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100 text-center">
          <Icons.Wallet className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your Wallet to Donate
          </h3>
          <p className="text-gray-600 mb-4">
            You need to connect your wallet to make donations to this charity.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
