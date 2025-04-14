"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { useCharityProgram } from "../data-access/charity-data-access";
import { CharityCard, LoadingSpinner, EmptyState } from "../ui/shared";
import { formatSol, formatTime } from "../utils/format";

// My Donations History Feature
export function DonationsHistoryFeature() {
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
      {donations.length === 0 ? (
        <EmptyState
          message="You haven't made any donations yet."
          icon={Icons.Heart}
        />
      ) : (
        <CharityCard>
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Donation Summary
            </h3>
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

          <div className="mt-6 overflow-hidden border border-gray-200 rounded-md">
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
        </CharityCard>
      )}
    </div>
  );
}
