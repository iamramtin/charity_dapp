"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useCharityProgram } from "./charity-data-access";
import { CharityCreate, CharityList } from "./charity-ui";

export default function CharityFeature() {
  const { publicKey } = useWallet();
  const { programId } = useCharityProgram();

  if (!publicKey) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="alert alert-info mt-4">
          <div>
            <span>Connect your wallet to manage vesting accounts</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AppHero
        title="Charity"
        subtitle={
          'Create a new account by clicking the "Create" button. The state of a account is stored on-chain and can be manipulated by calling the program\'s methods (close).'
        }
      >
        <p className="mb-6">
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
          />
        </p>
        <CharityCreate />
      </AppHero>
      <CharityList />
    </div>
  );
}
