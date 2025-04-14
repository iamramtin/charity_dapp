export interface CreateCharityArgs {
  name: string;
  description: string;
}

export interface UpdateCharityArgs {
  charity: string;
  description: string;
}

export interface DeleteCharityArgs {
  charity: string;
  recipient: string;
}
