export interface DonateArgs {
  charity: string;
  amount: number;
}

export interface PauseDonationsArgs {
  charity: string;
  paused: boolean;
}

export interface WithdrawDonationsArgs {
  charity: string;
  recipient: string;
  amount: number;
}
