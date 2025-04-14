"use client";

import { Main } from "@/components/charity/feature/main";
import { Suspense } from "react";

export default function CharitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Main />
    </Suspense>
  );
}
