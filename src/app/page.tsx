"use client";

import { Board } from "@/components/board";

export default function Home() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-background">
      <Board />
    </div>
  );
}
