"use client";

import { Board } from "@/components/board";

export default function Home() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-border/50 px-4 py-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Zen Board</h1>
      </header>
      <Board />
    </div>
  );
}
