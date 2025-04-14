import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAnchorProvider } from "../../solana/solana-provider";
import { useCluster } from "../../cluster/cluster-data-access";
import { useMemo } from "react";
import { useCharityAccount, useCharityProgram } from "./charity-data-access";

export const findDonationPda = (
  donor: PublicKey,
  charity: PublicKey,
  donationCount: number,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("donation"),
      donor.toBuffer(),
      charity.toBuffer(),
      new BN(donationCount).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
};

export function useDonationAccount(donationKey: PublicKey | undefined) {
  const { cluster } = useCluster();
  const { program } = useCharityProgram();
  const provider = useAnchorProvider();

  // Query to fetch a specific donation account
  const donationQuery = useQuery({
    queryKey: [
      "donation",
      "fetch",
      { cluster, donationKey: donationKey?.toString() },
    ],
    queryFn: async () => {
      if (!donationKey) return null;

      try {
        const account = await program.account.donation.fetch(donationKey);
        return {
          publicKey: donationKey,
          ...account,
        };
      } catch (error) {
        console.error("Error fetching donation account:", error);
        return null;
      }
    },
    enabled: !!donationKey && !!provider,
  });

  return {
    donationQuery,
  };
}

// Helper hook to get total donations and donation count for a charity
export function useCharityStats(charityKey: PublicKey | undefined) {
  const { donationsQuery } = useCharityAccount(charityKey);

  const stats = useMemo(() => {
    if (!donationsQuery.data || donationsQuery.data.length === 0) {
      return {
        totalDonations: 0,
        donationCount: 0,
        averageDonation: 0,
      };
    }

    const totalDonations = donationsQuery.data.reduce(
      (sum, donation) => sum + Number(donation.amountInLamports || 0),
      0
    );

    return {
      totalDonations,
      donationCount: donationsQuery.data.length,
      averageDonation: totalDonations / donationsQuery.data.length,
    };
  }, [donationsQuery.data]);

  return stats;
}
