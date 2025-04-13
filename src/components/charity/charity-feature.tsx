"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  useCharityProgram,
  useCharityAccount,
  useDonationAccount,
  findCharityPda,
  findVaultPda,
  CreateCharityArgs,
} from "./charity-data-access";
import {
  CharityCard,
  CharitySummary,
  CharityDetails,
  CreateCharityForm,
  DonateForm,
  UpdateCharityForm,
  DonationSummary,
  EmptyState,
  LoadingSpinner,
  formatSol,
  formatTime,
  truncateAddress,
} from "./charity-ui";

// Main page with charity list and create form
export function CharityListFeature() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "my" | "donated">("all");

  const { getAllCharities, getMyCharities, getMyDonations, createCharity } =
    useCharityProgram();

  // Filter donations to group by charity and get unique charities
  const donatedCharities = useMemo(() => {
    if (!getMyDonations.data) return [];

    // Group donations by charity
    const charityMap = new Map();
    getMyDonations.data.forEach((donation) => {
      const charityKey = donation.charityKey.toString();
      if (!charityMap.has(charityKey)) {
        charityMap.set(charityKey, {
          publicKey: donation.charityKey,
          name: donation.charityName,
          totalDonated: 0,
          count: 0,
        });
      }
      const charity = charityMap.get(charityKey);
      charity.totalDonated += Number(donation.amountInLamports || 0);
      charity.count += 1;
    });

    return Array.from(charityMap.values());
  }, [getMyDonations.data]);

  const handleCreateCharity = async (data: CreateCharityArgs) => {
    await createCharity.mutateAsync(data);
    setShowCreateForm(false);
  };

  const navigateToCharity = (publicKey: PublicKey): void => {
    router.push(`/charity/${publicKey.toString()}`);
  };

  // Determine which data to show based on active tab
  const isLoading =
    (activeTab === "all" && getAllCharities.isLoading) ||
    (activeTab === "my" && getMyCharities.isLoading) ||
    (activeTab === "donated" && getMyDonations.isLoading);

  const charities = useMemo(() => {
    if (activeTab === "all") return getAllCharities.data || [];
    if (activeTab === "my") return getMyCharities.data || [];
    if (activeTab === "donated") return donatedCharities;
    return [];
  }, [activeTab, getAllCharities.data, getMyCharities.data, donatedCharities]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Solana Charity Platform
          </h1>
          <p className="text-gray-300 mb-4">
            Fundraise and donate securely on the Solana blockchain
          </p>
        </div>

        {publicKey && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {showCreateForm ? (
              <>
                <Icons.X className="mr-2 h-5 w-5" />
                Cancel
              </>
            ) : (
              <>
                <Icons.Plus className="mr-2 h-5 w-5" />
                Create Charity
              </>
            )}
          </button>
        )}
      </div>

      {/* Create Charity Form */}
      {showCreateForm && (
        <CharityCard className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Charity</h2>
          <CreateCharityForm onSubmit={handleCreateCharity} />
        </CharityCard>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "all"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Charities
          </button>

          {publicKey && (
            <>
              <button
                onClick={() => setActiveTab("my")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "my"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Charities
              </button>

              <button
                onClick={() => setActiveTab("donated")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "donated"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Donated To
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Content based on selected tab */}
      {isLoading ? (
        <LoadingSpinner />
      ) : charities.length === 0 ? (
        <EmptyState
          message={
            activeTab === "all"
              ? "No charities created yet. Be the first to create one!"
              : activeTab === "my"
              ? "You haven't created any charities yet."
              : "You haven't donated to any charities yet."
          }
          icon={activeTab === "donated" ? Icons.Heart : Icons.HandHeart}
        />
      ) : (
        <div>
          {charities.map((charity) => (
            <CharitySummary
              key={charity.publicKey.toString()}
              charity={charity}
              isAuthority={activeTab === "my"}
              onClick={() => navigateToCharity(charity.publicKey)}
            />
          ))}
        </div>
      )}

      {/* Donate prompt if user not connected */}
      {!publicKey && (
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100 text-center">
          <Icons.Wallet className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 mb-4">
            Connect your wallet to create charities or make donations.
          </p>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

// Single charity detail page
export function CharityDetailFeature() {
  const { charityId } = useParams();
  const router = useRouter();
  const { publicKey } = useWallet();
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const charityPubkey = useMemo(() => {
    try {
      return new PublicKey(charityId as string);
    } catch (error) {
      return undefined;
    }
  }, [charityId]);

  const {
    program,
    programId,
    donate,
    updateCharity,
    pauseDonations,
    withdrawDonations,
    deleteCharity,
  } = useCharityProgram();

  const { charityQuery, donationsQuery, vaultBalanceQuery } =
    useCharityAccount(charityPubkey);

  // Check if the user is the authority of this charity
  const isAuthority = useMemo(() => {
    if (!publicKey || !charityQuery.data) return false;
    return charityQuery.data.authority.toString() === publicKey.toString();
  }, [publicKey, charityQuery.data]);

  // Handle actions
  const handleDonate = async (data: { amount: number }) => {
    await donate.mutateAsync({
      charity: charityId as string,
      amount: data.amount,
    });
  };

  const handleUpdateCharity = async (data: { description: string }) => {
    await updateCharity.mutateAsync({
      charity: charityId as string,
      description: data.description,
    });
    setShowUpdateForm(false);
  };

  const handlePauseToggle = async (paused: boolean) => {
    await pauseDonations.mutateAsync({
      charity: charityId as string,
      paused,
    });
  };

  const handleWithdraw = async (data: {
    recipient: string;
    amount: number;
  }) => {
    await withdrawDonations.mutateAsync({
      charity: charityId as string,
      recipient: data.recipient,
      amount: data.amount,
    });
  };

  const handleDelete = async () => {
    await deleteCharity.mutateAsync({
      charity: charityId as string,
      recipient: publicKey?.toString() || "",
    });
    router.push("/charity");
  };

  // Loading and error states
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

  if (!charityQuery.data) {
    return <EmptyState message="Charity not found" icon={Icons.Search} />;
  }

  const charity = charityQuery.data;
  const donations = donationsQuery.data || [];
  const vaultBalance = vaultBalanceQuery.data || 0;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/charity"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <Icons.ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Charities
        </Link>
      </div>

      {/* Charity detail section */}
      <CharityDetails
        charity={charity}
        donations={donations}
        vaultBalance={vaultBalance}
        isAuthority={isAuthority}
        onPauseToggle={handlePauseToggle}
        onWithdraw={handleWithdraw}
        onDelete={handleDelete}
      />

      {/* Update charity form for authority */}
      {isAuthority && showUpdateForm && (
        <CharityCard className="mt-6">
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

      {/* Update button for authority */}
      {isAuthority && !showUpdateForm && (
        <button
          onClick={() => setShowUpdateForm(true)}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          <Icons.Edit className="mr-2 h-4 w-4" />
          Update Description
        </button>
      )}

      {/* Donation form for non-paused charities */}
      {publicKey && !charity.paused && !isAuthority && (
        <CharityCard className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Make a Donation</h3>
          <DonateForm charity={charityId as string} onSubmit={handleDonate} />
        </CharityCard>
      )}

      {/* Donation paused notification */}
      {charity.paused && (
        <div className="mt-6 p-6 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
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

      {/* Wallet connect prompt */}
      {!publicKey && !charity.paused && (
        <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-100 text-center">
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

// My Donations History Feature
export function MyDonationsFeature() {
  const { publicKey } = useWallet();
  const { getMyDonations } = useCharityProgram();
  const router = useRouter();

  // If user not connected, redirect or show message
  if (!publicKey) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 text-center">
        <Icons.Wallet className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to view your donation history.
        </p>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (getMyDonations.isLoading) {
    return <LoadingSpinner />;
  }

  const donations = getMyDonations.data || [];

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <Link
          href="/charity"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <Icons.ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Charities
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        My Donation History
      </h1>

      {donations.length === 0 ? (
        <EmptyState
          message="You haven't made any donations yet."
          icon={Icons.Heart}
        />
      ) : (
        <CharityCard>
          <div className="overflow-hidden border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Charity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations
                  .slice()
                  .reverse()
                  .map((donation) => (
                    <tr key={donation.publicKey.toString()}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donation.charityName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                        {formatSol(donation.amountInLamports)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(donation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() =>
                            router.push(
                              `/charity/${donation.charityKey.toString()}`
                            )
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Charity
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Donation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-md border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {formatSol(
                    donations.reduce(
                      (sum, d) => sum + Number(d.amountInLamports || 0),
                      0
                    )
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Donated</div>
              </div>
              <div className="p-4 bg-white rounded-md border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {donations.length}
                </div>
                <div className="text-sm text-gray-500">Total Donations</div>
              </div>
            </div>
          </div>
        </CharityCard>
      )}
    </div>
  );
}
