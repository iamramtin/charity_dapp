"use client";

import { Suspense } from "react";
import { CharityListFeature } from "@/components/charity/charity-feature";

export default function CharitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CharityListFeature />
    </Suspense>
  );
}
