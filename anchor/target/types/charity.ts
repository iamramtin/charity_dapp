/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/charity.json`.
 */
export type Charity = {
  "address": "9MipEJLetsngpXJuyCLsSu3qTJrHQ6E6W1rZ1GrG68am",
  "metadata": {
    "name": "charity",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createCharity",
      "discriminator": [
        193,
        30,
        89,
        168,
        17,
        72,
        111,
        51
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "charity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "vault",
          "docs": [
            "The vault that will hold donated SOL for the charity.",
            "",
            "Why we use a separate vault:",
            "- Solana accounts must remain **rent-exempt** to persist.",
            "- If we store lamports directly in the `Charity` account and its balance drops below",
            "the rent-exempt threshold (e.g., after a withdrawal), the account could be purged.",
            "- `Charity` is a data account, so mixing lamports and state increases fragility.",
            "- This vault PDA has **no custom data layout** — it's just a secure lamport holder.",
            "",
            "Design Pattern:",
            "- Keep **data and funds separate**",
            "- Store metadata in `Charity`",
            "- Store SOL in a **dedicated PDA vault**",
            "",
            "Why `UncheckedAccount`:",
            "- We're only transferring SOL (no deserialization required)",
            "- The vault is a PDA we derive deterministically with known seeds",
            "- Ownership checks aren't enforced because it's program-derived and safe",
            "- Minimal overhead — we just need the public key and `mut` access",
            "",
            "Safety:",
            "- This vault must be verified by seeds in the program logic"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "charity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "deleteCharity",
      "discriminator": [
        87,
        196,
        87,
        43,
        218,
        72,
        184,
        188
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "charity"
          ]
        },
        {
          "name": "charity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "charity.name",
                "account": "charity"
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "charity"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "docs": [
            "Destination account that will receive the withdrawn SOL",
            "Allows the charity authority to send funds to a different address than their own",
            "Why `UncheckedAccount`:",
            "- We're only transferring SOL (no deserialization required)",
            "- We're not enforcing any constraints on it through Anchor's account validation"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "donateSol",
      "discriminator": [
        168,
        195,
        198,
        161,
        226,
        163,
        222,
        113
      ],
      "accounts": [
        {
          "name": "donor",
          "writable": true,
          "signer": true
        },
        {
          "name": "charity",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "charity"
              }
            ]
          }
        },
        {
          "name": "donation",
          "docs": [
            "Donation account to keep track of history"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  110,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "donor"
              },
              {
                "kind": "account",
                "path": "charity"
              },
              {
                "kind": "account",
                "path": "charity.donation_count",
                "account": "charity"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "pauseDonations",
      "discriminator": [
        82,
        229,
        85,
        242,
        137,
        10,
        72,
        40
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "charity"
          ]
        },
        {
          "name": "charity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "charity.name",
                "account": "charity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "paused",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setWithdrawalRecipient",
      "discriminator": [
        39,
        143,
        225,
        235,
        133,
        146,
        130,
        89
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "charity"
          ]
        },
        {
          "name": "charity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "charity.name",
                "account": "charity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "recipient",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "updateCharity",
      "discriminator": [
        93,
        190,
        9,
        196,
        32,
        84,
        153,
        139
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "charity"
          ]
        },
        {
          "name": "charity",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  114,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "charity.name",
                "account": "charity"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "description",
          "type": "string"
        }
      ]
    },
    {
      "name": "withdrawDonations",
      "discriminator": [
        1,
        93,
        87,
        93,
        93,
        251,
        195,
        179
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "charity"
          ]
        },
        {
          "name": "charity",
          "writable": true
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "charity"
              }
            ]
          }
        },
        {
          "name": "recipient",
          "docs": [
            "Destination account that will receive the withdrawn SOL",
            "Allows the charity authority to send funds to a different address than their own",
            "Why `UncheckedAccount`:",
            "- We're only transferring SOL (no deserialization required)",
            "- We're not enforcing any constraints on it through Anchor's account validation"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "charity",
      "discriminator": [
        229,
        164,
        231,
        12,
        25,
        172,
        91,
        111
      ]
    },
    {
      "name": "donation",
      "discriminator": [
        189,
        210,
        54,
        77,
        216,
        85,
        7,
        68
      ]
    }
  ],
  "events": [
    {
      "name": "createCharityEvent",
      "discriminator": [
        213,
        219,
        93,
        160,
        91,
        105,
        70,
        242
      ]
    },
    {
      "name": "deleteCharityEvent",
      "discriminator": [
        241,
        116,
        32,
        227,
        200,
        111,
        252,
        68
      ]
    },
    {
      "name": "makeDonationEvent",
      "discriminator": [
        23,
        55,
        46,
        211,
        8,
        225,
        105,
        21
      ]
    },
    {
      "name": "pauseDonationsEvent",
      "discriminator": [
        142,
        208,
        44,
        116,
        46,
        34,
        13,
        161
      ]
    },
    {
      "name": "setWithdrawalRecipientEvent",
      "discriminator": [
        202,
        62,
        83,
        159,
        167,
        70,
        162,
        169
      ]
    },
    {
      "name": "updateCharityEvent",
      "discriminator": [
        29,
        156,
        125,
        176,
        95,
        192,
        196,
        210
      ]
    },
    {
      "name": "withdrawCharitySolEvent",
      "discriminator": [
        253,
        239,
        91,
        192,
        52,
        48,
        47,
        10
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized access"
    },
    {
      "code": 6001,
      "name": "overflow",
      "msg": "Math overflow occurred"
    },
    {
      "code": 6002,
      "name": "insufficientFunds",
      "msg": "Insufficient funds for withdrawal"
    },
    {
      "code": 6003,
      "name": "insufficientFundsForRent",
      "msg": "Cannot withdraw below rent-exemption threshold"
    },
    {
      "code": 6004,
      "name": "invalidDescription",
      "msg": "Invalid description"
    },
    {
      "code": 6005,
      "name": "invalidDescriptionLength",
      "msg": "Invalid description length"
    },
    {
      "code": 6006,
      "name": "invalidNameLength",
      "msg": "Invalid name length"
    },
    {
      "code": 6007,
      "name": "invalidVaultAccount",
      "msg": "Invalid vault account"
    },
    {
      "code": 6008,
      "name": "donationsPaused",
      "msg": "Donations for this charity are paused"
    },
    {
      "code": 6009,
      "name": "invalidWithdrawalRecipient",
      "msg": "Invalid withdrawal recipient"
    },
    {
      "code": 6010,
      "name": "recipientAlreadySet",
      "msg": "Recipient already set"
    }
  ],
  "types": [
    {
      "name": "charity",
      "docs": [
        "* ACCOUNTS"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "donationsInLamports",
            "type": "u64"
          },
          {
            "name": "donationCount",
            "type": "u64"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          },
          {
            "name": "deletedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "withdrawnAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "vaultBump",
            "type": "u8"
          },
          {
            "name": "recipient",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "createCharityEvent",
      "docs": [
        "* EVENTS"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "deleteCharityEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "deletedAt",
            "type": "i64"
          },
          {
            "name": "withdrawnToRecipient",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "donation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "donorKey",
            "type": "pubkey"
          },
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "amountInLamports",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "makeDonationEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "donorKey",
            "type": "pubkey"
          },
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pauseDonationsEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "setWithdrawalRecipientEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "recipientKey",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "updateCharityEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "withdrawCharitySolEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "charityKey",
            "type": "pubkey"
          },
          {
            "name": "charityName",
            "type": "string"
          },
          {
            "name": "donationsInLamports",
            "type": "u64"
          },
          {
            "name": "donationCount",
            "type": "u64"
          },
          {
            "name": "withdrawnAt",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
