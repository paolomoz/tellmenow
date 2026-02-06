"use client";

import { HomeHero } from "@/components/home/home-hero";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-full px-4 pt-[18vh] pb-12">
      <div className="w-full max-w-2xl space-y-6 mb-24">
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            What do you want to know?
          </h1>
          <p className="text-muted mt-2 text-sm">
            Select a skill and ask your question. Get detailed, structured answers.
          </p>
        </div>

        <HomeHero />
      </div>
    </div>
  );
}
