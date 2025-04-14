"use client";

import { CharityListFeature } from "@/components/charity/feature/charity-list";
import { Suspense } from "react";

export default function CharitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CharityListFeature />
    </Suspense>
  );
}
