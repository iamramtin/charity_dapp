"use client";

import { useState } from "react";
import * as Icons from "lucide-react";

interface CharityBlinkProps {
  charityKey: string;
  charityName: string;
  baseUrl: string;
}

export function CharityBlink({ charityKey, charityName, baseUrl }: CharityBlinkProps) {
  const [copied, setCopied] = useState(false);
  
  // Create the blink URL
  const blinkUrl = `${baseUrl}/api/actions/donate?charity=${charityKey}&name=${encodeURIComponent(charityName)}`;
  
  // For sharing on social media, we use the interstitial link
  const socialShareUrl = `https://dial.to/?action=solana-action%3A${encodeURIComponent(blinkUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(socialShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      <h3 className="text-md font-semibold text-gray-700 mb-2">
        Share this Charity
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Share this link on social media to let people donate directly to this charity.
      </p>

      <div className="bg-gray-50 rounded-md p-2 border border-gray-200 text-sm font-mono break-all mb-4">
        {socialShareUrl.length > 50 ? `${socialShareUrl.substring(0, 50)}...` : socialShareUrl}
      </div>

      <button
        onClick={copyToClipboard}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
      >
        {copied ? (
          <>
            <Icons.Check className="mr-1.5 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Icons.Copy className="mr-1.5 h-4 w-4" />
            Copy Link
          </>
        )}
      </button>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>
          <Icons.Info className="inline-block mr-1 h-4 w-4" />
          When shared, this link will display a donation interface for your charity.
        </p>
      </div>
    </div>
  );
}