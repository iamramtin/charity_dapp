"use client";

import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { useCharityProgram } from "../data-access/charity-data-access";
import { CreateCharityArgs } from "../types/charity-types";
import { CreateCharityForm, CharitySummary } from "../ui/charity";
import { CharityCard, LoadingSpinner, EmptyState } from "../ui/shared";

// Main page with charity list and create form
export function CharityListFeature() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "allCharities" | "myCharities" | "donated"
  >("allCharities");

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
    (activeTab === "allCharities" && getAllCharities.isLoading) ||
    (activeTab === "myCharities" && getMyCharities.isLoading) ||
    (activeTab === "donated" && getMyDonations.isLoading);

  const charities = useMemo(() => {
    if (activeTab === "allCharities") return getAllCharities.data || [];
    if (activeTab === "myCharities") return getMyCharities.data || [];
    if (activeTab === "donated") return donatedCharities;
    return [];
  }, [activeTab, getAllCharities.data, getMyCharities.data, donatedCharities]);

  return (
    <div className="container mx-auto min-w-[700px] py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2 mr-0">
            Solana Charity Platform
          </h1>
          <p className="text-gray-300 mb-4">
            Fundraise and donate securely on the Solana blockchain
          </p>
        </div>

        {publicKey && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center ml-12 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
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
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Create New Charity
          </h2>
          <CreateCharityForm onSubmit={handleCreateCharity} />
        </CharityCard>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px space-x-8">
          <button
            onClick={() => setActiveTab("allCharities")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "allCharities"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Charities
          </button>

          {publicKey && (
            <>
              <button
                onClick={() => setActiveTab("myCharities")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "myCharities"
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
            activeTab === "allCharities"
              ? "No charities created yet. Be the first to create one!"
              : activeTab === "myCharities"
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
              isAuthority={activeTab === "myCharities"}
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
