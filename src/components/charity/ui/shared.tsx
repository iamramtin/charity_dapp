import * as Icons from "lucide-react";
import { truncateAddress, formatSol, formatTime } from "../utils/format";

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

export function StatCard({
  icon,
  label,
  value,
  isZero,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  isZero?: boolean;
}) {
  return (
    <CharityCard className="flex flex-col items-center justify-center p-5 space-y-2">
      <div className="mb-1">{icon}</div>
      <h3 className="text-base font-medium text-gray-700">{label}</h3>
      <p
        className={`text-2xl font-extrabold tracking-tight ${
          isZero ? "text-gray-400" : "text-gray-800"
        }`}
      >
        {value}
      </p>{" "}
    </CharityCard>
  );
}

export function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <p className="flex items-center">
      {icon}
      <span className="font-medium mx-2">{label}:</span>
      <span>{value}</span>
    </p>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h4 className={`text-md font-medium mb-2 ${className || "text-gray-600"}`}>
      {children}
    </h4>
  );
}

export function ConfirmButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600"
    >
      <Icons.Trash2 className="mr-1.5 h-4 w-4" />
      Yes, Delete Charity
    </button>
  );
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
    >
      Cancel
    </button>
  );
}

export function DonationTable({ donations }: { donations: any[] }) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["Donor", "Amount", "Date"].map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {donations
            .slice()
            .reverse()
            .map((donation) => (
              <tr key={donation.publicKey.toString()}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {truncateAddress(donation.donorKey)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">
                  {formatSol(donation.amountInLamports)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatTime(donation.createdAt)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
