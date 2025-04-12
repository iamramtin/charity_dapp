import {
  ActionError,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createActionHeaders,
  createPostResponse,
} from "@solana/actions";
import { DEFAULT_SOL_ADDRESS } from "./const";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { toPubkey } = validateQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/transfer-sol?to=${toPubkey.toBase58()}`,
      requestUrl.origin
    ).toString();

    const payload: ActionGetResponse = {
      type: "action",
      title: "Transfer Native Sol",
      icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrXgsOjHdJGuvWk4jVZKVWKYLaoHq-bBsiCg&s",
      description: "Send a donation in SOL to support humanitarian causes.",
      label: "Donate",
      links: {
        actions: [
          {
            label: "Send 1 SOL",
            href: `${baseHref}&amout=${"1"}`,
            type: "transaction",
          },
          {
            label: "Send 5 SOL",
            href: `${baseHref}&amout=${"5"}`,
            type: "transaction",
          },
          {
            label: "Send 10 SOL",
            href: `${baseHref}&amout=${"10"}`,
            type: "transaction",
          },
          {
            label: "Send Custom Amount",
            href: `${baseHref}&amout={amount}`,
            type: "transaction",
            parameters: [
              {
                name: "amount",
                label: "Enter amount of SOL to donate",
                required: true,
              },
            ],
          },
        ],
      },
    };
    return Response.json(payload, { headers });
  } catch (err) {
    console.log(err);
    const actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, { status: 400, headers });
  }
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { amount, toPubkey } = validateQueryParams(requestUrl);
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch {
      throw 'Invalid "account" provided';
    }
    const connection = new Connection(
      process.env.SOLANA_RPC || clusterApiUrl("devnet")
    );

    // ensure the receiving account will be rent exempt
    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0
    );
    if (amount * LAMPORTS_PER_SOL < minimumBalance) {
      throw `account may not be rent exempt: ${toPubkey.toBase58()}`;
    }

    // create an instruction to transfer native SOL from one wallet to another
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    });
    // get the latest blockhash amd block height
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    // create a legacy transaction
    const transaction = new Transaction({
      feePayer: account,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Send ${amount} SOL to ${toPubkey.toBase58()}`,
      },
    });
    return Response.json(payload, { headers });
  } catch (err) {
    console.log(err);
    const actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, { status: 400, headers });
  }
};

function validateQueryParams(requestUrl: URL) {
  let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
  let amount: number = 0.1;

  try {
    if (requestUrl.searchParams.get("to")) {
      toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
    }
  } catch {
    throw "Invalid input query parameter: to";
  }

  try {
    if (requestUrl.searchParams.get("amount")) {
      amount = parseFloat(requestUrl.searchParams.get("amount")!);
    }
    if (amount <= 0) throw "amount is too small";
  } catch {
    throw "Invalid input query parameter: amount";
  }
  return {
    toPubkey,
    amount,
  };
}
