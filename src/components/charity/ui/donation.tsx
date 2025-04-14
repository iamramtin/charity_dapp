"use client";

import { useForm } from "react-hook-form";
import * as Icons from "lucide-react";
import { formatSol, formatTime } from "../utils/format";
import { DonateArgs } from "../types/donation-types";

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
        <div className="relative mt-1 rounded-lg shadow-sm">
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
        className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
