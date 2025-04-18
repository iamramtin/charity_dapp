import {
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    BLOCKCHAIN_IDS
  } from "@solana/actions";
  import {
    Connection,
    Keypair,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction,
    TransactionInstruction,
  } from "@solana/web3.js";
  import { BN } from "@coral-xyz/anchor";
  import { Buffer } from 'buffer';
  
  // Change to the appropriate blockchain ID
  const blockchain = BLOCKCHAIN_IDS.devnet; // Use devnet for local development?
  
  // Connection setup - adjust based on environment
  const connection = new Connection("http://127.0.0.1:8899"); // Change to appropriate RPC URL when deploying
  
  // Set the headers with the blockchain ID
  const headers = {
    ...ACTIONS_CORS_HEADERS,
    "x-blockchain-ids": blockchain,
    "x-action-version": "2.4",
  };
  
  // Program ID  NEED TO CHANGE!!!!!
  const PROGRAM_ID = new PublicKey("9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am"); //BvcJhp763SjsFo9xMc8pEz9Vmbt7R8uKZariBk31FBpZ
  
  // first 8 bytes of the SHA256 hash of "global:donate_sol"
  const DONATE_SOL_DISCRIMINATOR = Buffer.from([211, 60, 196, 59, 89, 139, 109, 89]);
  
  // OPTIONS endpoint for CORS
  export const OPTIONS = async () => {
    return new Response(null, { headers });
  };
  
  // GET endpoint returns the blink metadata and UI configuration
  export const GET = async (req: Request) => {
    const url = new URL(req.url);
    const charityKey = url.searchParams.get("charity");
    const charityName = url.searchParams.get("name") || "Charity";
    const charityDesc = url.searchParams.get("description") || "Support this charity with a donation on Solana.";
  
    if (!charityKey) {
      return Response.json({ error: "Charity key is required" }, { status: 400, headers });
    }
  
    // Blink UI config
    const response: ActionGetResponse = {
      type: "action",
      icon: `${new URL("/charity-logo.png", req.url).toString()}`, // Maybe updating it to dynamic logo
      label: "Donate SOL",
      title: `Donate to ${charityName}`,
      description: charityDesc,
      links: {
        actions: [
          {
            type: "transaction",
            label: "0.01 SOL",
            href: `/api/actions/donate?charity=${charityKey}&amount=0.01`,
          },
          {
            type: "transaction",
            label: "0.05 SOL",
            href: `/api/actions/donate?charity=${charityKey}&amount=0.05`,
          },
          {
            type: "transaction",
            label: "0.1 SOL",
            href: `/api/actions/donate?charity=${charityKey}&amount=0.1`,
          },
          {
            type: "transaction",
            href: `/api/actions/donate?charity=${charityKey}&amount={amount}`,
            label: "Custom Amount",
            parameters: [
              {
                name: "amount",
                label: "Enter a custom SOL amount",
                type: "number",
              },
            ],
          },
        ],
      },
    };
  
    return Response.json(response, { status: 200, headers });
  };
  
  // POST endpoint handles the actual transaction creation
  export const POST = async (req: Request) => {
    try {
      // Extract parameters from the URL
      const url = new URL(req.url);
      const charityKey = url.searchParams.get("charity");
      const amount = Number(url.searchParams.get("amount") || "0");
  
      if (!charityKey) {
        return Response.json({ error: "Charity key is required" }, { status: 400, headers });
      }
  
      if (isNaN(amount) || amount <= 0) {
        return Response.json({ error: "Invalid amount" }, { status: 400, headers });
      }
  
      // Get the donor's public key from the request body
      const request: ActionPostRequest = await req.json();
      const donorPublicKey = new PublicKey(request.account);
      const charityPublicKey = new PublicKey(charityKey);
      
      // Fetch the charity account to verify it exists and get donation_count
      const charityAccountInfo = await connection.getAccountInfo(charityPublicKey);
      if (!charityAccountInfo) {
        return Response.json({ error: "Charity not found" }, { status: 404, headers });
      }
      
      // Parse the charity account to get donation_count
      // In the Anchor-generated account layout:
      // - First 8 bytes: discriminator
      // - Next 32 bytes: authority
      // - Then variable-length string for name (prefixed with length)
      // - Then variable-length string for description (prefixed with length)
      // - Then 8 bytes for donations_in_lamports
      // - Then 8 bytes for donation_count (what we need)
      
      const accountData = charityAccountInfo.data;
      
      // Skip the discriminator
      let offset = 8;
      
      // Skip authority
      offset += 32;
      
      // Skip name (variable length)
      // First 4 bytes is the string length
      const nameLength = accountData.readUInt32LE(offset);
      offset += 4 + nameLength;
      
      // Skip description (variable length)
      const descLength = accountData.readUInt32LE(offset);
      offset += 4 + descLength;
      
      // Skip donations_in_lamports
      offset += 8;
      
      // Read donation_count
      const donationCount = accountData.readBigUInt64LE(offset);
      
      // Calculate vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), charityPublicKey.toBuffer()],
        PROGRAM_ID
      );
      
      // Calculate donation PDA for the next donation
      const donationCountBytes = Buffer.alloc(8);
      donationCountBytes.writeBigUInt64LE(donationCount);
      
      const [donationPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("donation"), 
          donorPublicKey.toBuffer(), 
          charityPublicKey.toBuffer(),
          donationCountBytes
        ],
        PROGRAM_ID
      );
      
      // Convert amount to lamports
      const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);
      
      // Create the donate_sol instruction
      const instruction = createDonateSolInstruction(
        donorPublicKey,
        charityPublicKey,
        vaultPda,
        donationPda,
        amountLamports
      );
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      
      // Create the transaction message
      const message = new TransactionMessage({
        payerKey: donorPublicKey,
        recentBlockhash: blockhash,
        instructions: [instruction]
      }).compileToV0Message();
      
      // Create the versioned transaction
      const transaction = new VersionedTransaction(message);
      
      // Create the response with transaction
      const response = {
        type: "transaction",
        transaction: Buffer.from(transaction.serialize()).toString("base64"),
      } as ActionPostResponse;
      
      return Response.json(response, { status: 200, headers });
    } catch (error) {
      console.error("Error processing donation request:", error);
      return Response.json(
        { error: "Failed to process donation", details: String(error) },
        { status: 500, headers }
      );
    }
  };
  
  // Function to create the donate_sol instruction
  function createDonateSolInstruction(
    donor: PublicKey,
    charity: PublicKey,
    vault: PublicKey,
    donation: PublicKey,
    amountLamports: number
  ): TransactionInstruction {
    // Encode instruction data: discriminator + amount (u64)
    const dataAmount = new BN(amountLamports).toArrayLike(Buffer, "le", 8);
    const data = Buffer.concat([DONATE_SOL_DISCRIMINATOR, dataAmount]);
    
    // Create the account metas (the accounts needed for the instruction)
    const keys = [
      { pubkey: donor, isSigner: true, isWritable: true }, // donor
      { pubkey: charity, isSigner: false, isWritable: true }, // charity
      { pubkey: vault, isSigner: false, isWritable: true }, // vault
      { pubkey: donation, isSigner: false, isWritable: true }, // donation
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ];
    
    // Create and return the instruction
    return new TransactionInstruction({
      programId: PROGRAM_ID,
      keys,
      data
    });
  }