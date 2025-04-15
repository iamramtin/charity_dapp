"use client";

import { useForm } from "react-hook-form";
import * as Icons from "lucide-react";
import { formatSol, formatTime } from "../utils/format";
import { DonateArgs } from "../types/donation-types";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

// Donation summary component for user's donations list
export function DonationSummary({
  donation,
  onClick,
}: {
  donation: any;
  onClick?: () => void;
}) {
  console.log("Rendering donation:", donation);

  return (
    <div
      className={`border rounded-lg p-5 mb-5 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between">
        <div>
          <h3 className="text-md font-semibold text-gray-900">
            {donation.charityName || "Unknown Charity"}
          </h3>
          <p className="text-sm text-gray-600">
            {donation.amountInLamports
              ? formatSol(donation.amountInLamports)
              : "Amount unknown"}
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {donation.createdAt ? formatTime(donation.createdAt) : "Date unknown"}
        </span>
      </div>
    </div>
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
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<DonateArgs>({
    defaultValues: {
      charity,
      amount: 0.1,
    },
  });

  const amount = watch("amount");
  const lamports = amount ? Math.floor(amount * 1_000_000_000) : 0;

  // Estimated transaction fee in lamports (0.000005 SOL)
  const ESTIMATED_TX_FEE = 5000;

  // Maximum donation is wallet balance minus estimated transaction fee
  const maxDonationInSol =
    walletBalance !== null
      ? Math.max(0, (walletBalance - ESTIMATED_TX_FEE) / 1_000_000_000)
      : 0;

  useEffect(() => {
    if (!publicKey || !connection) return;

    const fetchBalance = async () => {
      try {
        setIsLoadingBalance(true);
        setError(null);
        const balance = await connection.getBalance(publicKey);
        setWalletBalance(balance);

        // If the currently entered amount is more than the balance, adjust it
        if (amount > (balance - ESTIMATED_TX_FEE) / 1_000_000_000) {
          const maxAmount = Math.max(
            0,
            (balance - ESTIMATED_TX_FEE) / 1_000_000_000
          );
          setValue("amount", Number(maxAmount.toFixed(4)));
        }
      } catch (err) {
        console.error("Error fetching wallet balance:", err);
        setError("Failed to fetch wallet balance");
        setWalletBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();

    // Set up a refresh interval for the balance
    const intervalId = setInterval(fetchBalance, 15000); // Refresh every 15 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection, setValue, amount]);

  const onFormSubmit = (data: DonateArgs) => {
    if (!walletBalance) return;

    // Final check to make sure donation is not more than available balance
    if (lamports > walletBalance - ESTIMATED_TX_FEE) {
      setError("Donation amount exceeds your available balance");
      return;
    }

    // Convert SOL to lamports for the API
    const updatedData = {
      ...data,
      amount: lamports,
    };

    setError(null);
    onSubmit(updatedData);
  };

  const handleSetMaxAmount = () => {
    if (walletBalance !== null) {
      setValue("amount", Number(maxDonationInSol.toFixed(4)));
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            Donation Amount (SOL)
          </label>

          {isLoadingBalance ? (
            <span className="text-xs text-gray-500 flex items-center">
              <Icons.Loader2 className="animate-spin h-3 w-3 mr-1" />
              Loading balance...
            </span>
          ) : walletBalance !== null ? (
            <span className="text-xs text-gray-600">
              Balance: {formatSol(walletBalance)}
            </span>
          ) : null}
        </div>

        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0.001"
            max={maxDonationInSol || undefined}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount || error ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter amount in SOL"
            {...register("amount", {
              required: "Amount is required",
              min: { value: 0.001, message: "Minimum donation is 0.001 SOL" },
              max: {
                value: maxDonationInSol || 999999,
                message: "Amount exceeds your balance",
              },
              validate: {
                notExceedingBalance: (value) =>
                  walletBalance === null ||
                  value * 1_000_000_000 <= walletBalance - ESTIMATED_TX_FEE ||
                  "Amount exceeds your available balance",
              },
            })}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 sm:text-sm">SOL</span>
          </div>
        </div>

        {errors.amount && (
          <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
        )}

        {error && !errors.amount && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}

        <div className="mt-2 flex justify-between text-sm">
          <p className="text-sm text-gray-500">
            <Icons.Info className="inline-block h-4 w-4 mr-1" />
            This equals approximately {formatSol(lamports)} ({lamports}{" "}
            lamports)
          </p>

          <button
            type="button"
            className="text-blue-600 hover:text-blue-800"
            onClick={handleSetMaxAmount}
            disabled={isLoadingBalance || walletBalance === null}
          >
            Max
          </button>
        </div>

        {/* Transaction fee notice */}
        <p className="mt-1 text-xs text-gray-500">
          A small network fee (~{ESTIMATED_TX_FEE / 1_000_000_000} SOL) might be
          charged for the transaction.
        </p>
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting ||
          isLoadingBalance ||
          !!error ||
          !walletBalance ||
          lamports > walletBalance - ESTIMATED_TX_FEE
        }
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
