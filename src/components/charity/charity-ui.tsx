"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useForm } from "react-hook-form";
import * as Icons from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  CreateCharityArgs,
  UpdateCharityArgs,
  DonateArgs,
} from "./charity-data-access";

// Reusable card component for consistent styling
export function CharityCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}

// Empty state component
export function EmptyState({
  message,
  icon: Icon = Icons.AlertCircle,
}: {
  message: string;
  icon?: any;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
      <Icon className="w-12 h-12 mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

// Loading spinner
export function LoadingSpinner() {
  return (
    <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Format lamports as SOL with specified decimal places
export function formatSol(lamports: number | string | BN, decimals = 2) {
  const value =
    typeof lamports === "string"
      ? parseFloat(lamports)
      : lamports instanceof BN
      ? lamports.toNumber()
      : lamports;

  return (value / 1_000_000_000).toFixed(decimals) + " SOL";
}

// Format timestamp to relative time
export function formatTime(timestamp: number | BN) {
  const time =
    timestamp instanceof BN ? timestamp.toNumber() * 1000 : timestamp * 1000;
  return formatDistanceToNow(new Date(time), { addSuffix: true });
}

// Truncate address for display
export function truncateAddress(address?: string | PublicKey, length = 4) {
  if (!address) return "";
  const base58 = typeof address === "string" ? address : address.toString();
  return `${base58.slice(0, length)}...${base58.slice(-length)}`;
}

// Create Charity Form
export function CreateCharityForm({
  onSubmit,
}: {
  onSubmit: (data: CreateCharityArgs) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateCharityArgs>();

  const onFormSubmit = (data: CreateCharityArgs) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Charity Name
        </label>
        <input
          id="name"
          type="text"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter charity name"
          {...register("name", { required: "Charity name is required" })}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Describe your charity (max 100 characters)"
          {...register("description", {
            required: "Description is required",
            maxLength: {
              value: 100,
              message: "Description cannot exceed 100 characters",
            },
          })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="mr-2">Creating...</span>
            <Icons.Loader2 className="animate-spin h-4 w-4" />
          </span>
        ) : (
          "Create Charity"
        )}
      </button>
    </form>
  );
}

// Update Charity Form
export function UpdateCharityForm({
  charity,
  currentDescription,
  onSubmit,
}: {
  charity: string;
  currentDescription: string;
  onSubmit: (data: UpdateCharityArgs) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateCharityArgs>({
    defaultValues: {
      charity,
      description: currentDescription,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Describe your charity (max 100 characters)"
          {...register("description", {
            required: "Description is required",
            maxLength: {
              value: 100,
              message: "Description cannot exceed 100 characters",
            },
          })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="mr-2">Updating...</span>
            <Icons.Loader2 className="animate-spin h-4 w-4" />
          </span>
        ) : (
          "Update Description"
        )}
      </button>
    </form>
  );
}

// Donate Form
export function DonateForm({
  charity,
  onSubmit,
}: {
  charity: string;
  onSubmit: (data: DonateArgs) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<DonateArgs>({
    defaultValues: {
      charity,
      amount: 0.1,
    },
  });

  const amount = watch("amount");
  const lamports = amount ? Math.floor(amount * 1_000_000_000) : 0;

  const onFormSubmit = (data: DonateArgs) => {
    // Convert SOL to lamports for the API
    const updatedData = {
      ...data,
      amount: lamports,
    };
    onSubmit(updatedData);
    reset({ charity, amount: 0.1 });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Donation Amount (SOL)
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.001"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter amount in SOL"
            {...register("amount", {
              required: "Amount is required",
              min: { value: 0.001, message: "Minimum donation is 0.001 SOL" },
            })}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm">SOL</span>
          </div>
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
        )}

        <p className="mt-2 text-sm text-gray-500">
          <Icons.Info className="inline-block h-4 w-4 mr-1" />
          This equals approximately {formatSol(lamports)} ({lamports} lamports)
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="mr-2">Donating...</span>
            <Icons.Loader2 className="animate-spin h-4 w-4" />
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Icons.Heart className="mr-2 h-4 w-4" />
            Donate Now
          </span>
        )}
      </button>
    </form>
  );
}

// Withdraw Form
export function WithdrawForm({
  charity,
  vaultBalance,
  onSubmit,
}: {
  charity: string;
  vaultBalance: number;
  onSubmit: (data: {
    charity: string;
    recipient: string;
    amount: number;
  }) => void;
}) {
  const { publicKey } = useWallet();
  const [recipient, setRecipient] = useState(publicKey?.toString() || "");
  const [amount, setAmount] = useState(0.01);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = Math.max(0, vaultBalance - 1_000_000); // Keeping min rent exemption
  const maxWithdrawSol = availableBalance / 1_000_000_000;
  const lamportsAmount = Math.floor(amount * 1_000_000_000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || lamportsAmount <= 0 || lamportsAmount > availableBalance)
      return;

    setIsSubmitting(true);
    onSubmit({
      charity,
      recipient,
      amount: lamportsAmount,
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="recipient"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Recipient Address
        </label>
        <input
          id="recipient"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Solana address to receive funds"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Amount to Withdraw (SOL)
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.001"
            max={maxWithdrawSol}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount in SOL"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm">SOL</span>
          </div>
        </div>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-gray-500">
            Available: {formatSol(availableBalance)}
          </span>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800"
            onClick={() => setAmount(maxWithdrawSol)}
          >
            Max
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting ||
          !recipient ||
          lamportsAmount <= 0 ||
          lamportsAmount > availableBalance
        }
        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="mr-2">Withdrawing...</span>
            <Icons.Loader2 className="animate-spin h-4 w-4" />
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Icons.ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw Funds
          </span>
        )}
      </button>
    </form>
  );
}

// Charity Summary component for list items
export function CharitySummary({
  charity,
  isAuthority = false,
  onClick,
}: {
  charity: any;
  isAuthority?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {charity.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{charity.description}</p>
        </div>
        {charity.paused && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Icons.Pause className="mr-1 h-3 w-3" />
            Paused
          </span>
        )}
        {isAuthority && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Icons.Shield className="mr-1 h-3 w-3" />
            Owner
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <div className="flex items-center text-gray-700">
          <Icons.Users className="h-4 w-4 mr-1" />
          <span>{charity.donationCount.toString()} donors</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Icons.Coins className="h-4 w-4 mr-1" />
          <span>{formatSol(charity.donationsInLamports)}</span>
        </div>
        <div className="flex items-center text-gray-700">
          <Icons.Calendar className="h-4 w-4 mr-1" />
          <span>Created {formatTime(charity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// Detailed charity view component
export function CharityDetails({
  charity,
  donations,
  vaultBalance,
  isAuthority,
  onPauseToggle,
  onWithdraw,
  onDelete,
}: {
  charity: any;
  donations: any[];
  vaultBalance: number;
  isAuthority: boolean;
  onPauseToggle: (paused: boolean) => void;
  onWithdraw: (data: any) => void;
  onDelete: () => void;
}) {
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with status and actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{charity.name}</h2>

        {isAuthority && (
          <div className="flex space-x-2">
            <button
              onClick={() => onPauseToggle(!charity.paused)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                charity.paused
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
              }`}
            >
              {charity.paused ? (
                <>
                  <Icons.Play className="mr-1.5 h-4 w-4" />
                  Resume Donations
                </>
              ) : (
                <>
                  <Icons.Pause className="mr-1.5 h-4 w-4" />
                  Pause Donations
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CharityCard className="flex flex-col items-center justify-center p-4">
          <Icons.Users className="h-8 w-8 text-blue-500 mb-2" />
          <h3 className="text-lg font-semibold">Total Donors</h3>
          <p className="text-3xl font-bold text-gray-900">
            {charity.donationCount.toString()}
          </p>
        </CharityCard>

        <CharityCard className="flex flex-col items-center justify-center p-4">
          <Icons.Coins className="h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-lg font-semibold">Total Donated</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatSol(charity.donationsInLamports)}
          </p>
        </CharityCard>

        <CharityCard className="flex flex-col items-center justify-center p-4">
          <Icons.Wallet className="h-8 w-8 text-purple-500 mb-2" />
          <h3 className="text-lg font-semibold">Vault Balance</h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatSol(vaultBalance || 0)}
          </p>
        </CharityCard>
      </div>

      {/* Description */}
      <CharityCard>
        <h3 className="text-lg font-semibold mb-2">About this Charity</h3>
        <p className="text-gray-700">{charity.description}</p>

        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="flex items-center">
              <Icons.User className="h-4 w-4 mr-2" />
              <span className="font-medium mr-1">Authority:</span>
              <span>{truncateAddress(charity.authority)}</span>
            </p>
            <p className="flex items-center mt-2">
              <Icons.Calendar className="h-4 w-4 mr-2" />
              <span className="font-medium mr-1">Created:</span>
              <span>{formatTime(charity.createdAt)}</span>
            </p>
          </div>
          <div>
            <p className="flex items-center">
              <Icons.RefreshCw className="h-4 w-4 mr-2" />
              <span className="font-medium mr-1">Last Updated:</span>
              <span>{formatTime(charity.updatedAt)}</span>
            </p>
            {charity.withdrawnAt && (
              <p className="flex items-center mt-2">
                <Icons.ArrowDownToLine className="h-4 w-4 mr-2" />
                <span className="font-medium mr-1">Last Withdrawal:</span>
                <span>{formatTime(charity.withdrawnAt)}</span>
              </p>
            )}
          </div>
        </div>
      </CharityCard>

      {/* Authority Actions */}
      {isAuthority && (
        <CharityCard>
          <h3 className="text-lg font-semibold mb-4">Charity Management</h3>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="text-md font-medium mb-2">Withdraw Funds</h4>
              <p className="text-sm text-gray-600 mb-2">
                Transfer funds from the charity vault to another account.
              </p>
              {showWithdrawForm ? (
                <div className="mt-2">
                  <WithdrawForm
                    charity={charity.publicKey.toString()}
                    vaultBalance={vaultBalance || 0}
                    onSubmit={onWithdraw}
                  />
                  <button
                    onClick={() => setShowWithdrawForm(false)}
                    className="w-full mt-2 text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWithdrawForm(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200"
                  disabled={!vaultBalance || vaultBalance <= 1_000_000}
                >
                  <Icons.ArrowDownToLine className="mr-1.5 h-4 w-4" />
                  Withdraw Funds
                </button>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="text-md font-medium mb-2">Danger Zone</h4>
              <p className="text-sm text-gray-600 mb-2">
                Permanently delete this charity. This action cannot be undone.
              </p>

              {showDeleteConfirm ? (
                <div className="p-4 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700 mb-4">
                    Are you sure you want to delete this charity? Any remaining
                    funds will be returned to your wallet.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={onDelete}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-red-500 text-white hover:bg-red-600"
                    >
                      <Icons.Trash2 className="mr-1.5 h-4 w-4" />
                      Yes, Delete Charity
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                >
                  <Icons.Trash2 className="mr-1.5 h-4 w-4" />
                  Delete Charity
                </button>
              )}
            </div>
          </div>
        </CharityCard>
      )}

      {/* Donation History */}
      <CharityCard>
        <h3 className="text-lg font-semibold mb-4">Donation History</h3>

        {donations.length === 0 ? (
          <EmptyState
            message="No donations yet. Be the first to donate!"
            icon={Icons.HeartOff}
          />
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Donor
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {donations
                  .slice()
                  .reverse()
                  .map((donation) => (
                    <tr key={donation.publicKey.toString()}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {truncateAddress(donation.donorKey)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-green-600">
                        {formatSol(donation.amountInLamports)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(donation.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </CharityCard>
    </div>
  );
}

// Donation summary component for user's donations list
export function DonationSummary({ donation }: { donation: any }) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between">
        <div>
          <h3 className="text-md font-semibold text-gray-900">
            {donation.charityName}
          </h3>
          <p className="text-sm text-gray-600">
            {formatSol(donation.amountInLamports)}
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {formatTime(donation.createdAt)}
        </span>
      </div>
    </div>
  );
}
