import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { formatDistanceToNow } from "date-fns";

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
export function formatTime(timestamp: number | BN | null | undefined): string {
  try {
    if (timestamp == null) return "Invalid time";

    let time: number;

    if (timestamp instanceof BN) {
      if (timestamp.isZero()) return "Never";
      time = timestamp.toNumber() * 1000;
    } else {
      if (isNaN(timestamp)) return "Invalid time";
      time = timestamp * 1000;
    }

    const date = new Date(time);

    if (isNaN(date.getTime())) return "Invalid time";

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (err) {
    return "Invalid time";
  }
}

// Truncate address for display
export function truncateAddress(address?: string | PublicKey, length = 4) {
  if (!address) return "";
  const base58 = typeof address === "string" ? address : address.toString();
  return `${base58.slice(0, length)}...${base58.slice(-length)}`;
}
