"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useForm } from "react-hook-form";
import * as Icons from "lucide-react";
import { CreateCharityArgs, UpdateCharityArgs } from "../types/charity-types";
import { formatSol, formatTime, truncateAddress } from "../utils/format";
import {
  CancelButton,
  CharityCard,
  ConfirmButton,
  DonationTable,
  EmptyState,
  InfoRow,
  SectionTitle,
  StatCard,
} from "./shared";

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
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          Charity Name
        </label>
        <input
          id="name"
          type="text"
          className={`w-full px-3 py-2 border bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          className={`w-full px-3 py-2 border bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
      className={`border rounded-md ml-4 mr-4 p-5 mb-5 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 ${
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
        <div className="flex items-center space-x-2">
          {charity.paused && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <Icons.Pause className="mr-1 h-4 w-4" />
              Paused
            </span>
          )}
          {isAuthority && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <Icons.Shield className="mr-1 h-4 w-4" />
              Owner
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-800">
        <div className="flex items-center gap-1">
          <Icons.Users className="h-4 w-4 text-gray-600" />
          <span>{charity?.donationCount?.toString() ?? "0"} donors</span>
        </div>
        <div className="flex items-center gap-1">
          <Icons.Coins className="h-4 w-4 text-gray-600" />
          <span>{formatSol(charity.donationsInLamports)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icons.Calendar className="h-4 w-4 text-gray-600" />
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

  const vaultHasFunds = (vaultBalance || 0) > 1_000_000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-200">
          {charity?.name || "Unnamed Charity"}
        </h2>
        {isAuthority && (
          <button
            onClick={() => onPauseToggle(!charity.paused)}
            className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${
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
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Icons.Users className="h-8 w-8 text-blue-500" />}
          label="Total Donors"
          value={charity?.donationCount.toString() || 0}
          isZero={charity?.donationCount == 0}
        />
        <StatCard
          icon={<Icons.Coins className="h-8 w-8 text-green-500" />}
          label="Total Donated"
          value={formatSol(charity?.donationsInLamports || 0)}
          isZero={charity?.donationsInLamports == 0}
        />
        <StatCard
          icon={<Icons.Wallet className="h-8 w-8 text-purple-500" />}
          label="Vault Balance"
          value={formatSol(vaultBalance || 0)}
          isZero={!vaultHasFunds}
        />
      </div>

      {/* Description */}
      <CharityCard>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Charity Details
        </h3>
        <p className="text-gray-600">
          {charity?.description || "No description available."}
        </p>
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm text-gray-600">
          <InfoRow
            label="Authority"
            icon={<Icons.User />}
            value={truncateAddress(charity?.authority)}
          />
          <InfoRow
            label="Created"
            icon={<Icons.Calendar />}
            value={formatTime(charity?.createdAt)}
          />
          <InfoRow
            label="Last Updated"
            icon={<Icons.RefreshCw />}
            value={formatTime(charity?.updatedAt)}
          />
          {charity?.withdrawnAt && (
            <InfoRow
              label="Last Withdrawal"
              icon={<Icons.ArrowDownToLine />}
              value={formatTime(charity?.withdrawnAt)}
            />
          )}
        </div>
      </CharityCard>

      {/* Authority Section */}
      {isAuthority && (
        <CharityCard>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Charity Management
          </h3>

          {/* Withdraw */}
          <div className="mb-6">
            <SectionTitle>Withdraw Funds</SectionTitle>
            <p className="text-sm text-gray-500 mb-2">
              Transfer funds from the vault.
            </p>
            {showWithdrawForm ? (
              <div className="mt-2">
                <WithdrawForm
                  charity={charity?.publicKey?.toString()}
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
                disabled={!vaultHasFunds}
                className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                  vaultHasFunds
                    ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Icons.ArrowDownToLine className="mr-1.5 h-4 w-4" />
                Withdraw Funds
              </button>
            )}
          </div>

          {/* Delete */}
          <div className="border-t pt-4">
            <SectionTitle className="text-red-600">Danger Zone</SectionTitle>
            <p className="text-sm text-gray-600 mb-2">
              Permanently delete this charity. This cannot be undone.
            </p>
            {showDeleteConfirm ? (
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-sm text-red-700 mb-4">
                  Are you sure? Remaining funds will be returned to your wallet.
                </p>
                <div className="flex space-x-3">
                  <ConfirmButton onClick={onDelete} />
                  <CancelButton onClick={() => setShowDeleteConfirm(false)} />
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
        </CharityCard>
      )}

      {/* Donation History */}
      <CharityCard>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Donation History
        </h3>
        {donations.length === 0 ? (
          <EmptyState
            message="No donations yet. Be the first to donate!"
            icon={Icons.HeartOff}
          />
        ) : (
          <DonationTable donations={donations} />
        )}
      </CharityCard>
    </div>
  );
}
