"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BANKS_LIST } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Props {
  selected: string | null;
  onSelect: (bankId: string) => void;
}

export function BankPicker({ selected, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = BANKS_LIST.filter((bank) => {
    const q = query.toLowerCase();
    return (
      bank.name.includes(q) ||
      bank.subtitle.toLowerCase().includes(q) ||
      bank.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש בנק..."
          className="ps-9"
          aria-label="חיפוש בנק"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          לא נמצאו בנקים התואמים לחיפוש
        </p>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pe-1"
          role="listbox"
          aria-label="בחר בנק"
        >
          {filtered.map((bank) => {
            const isSelected = selected === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(bank.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all min-h-11",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold shrink-0",
                    bank.color
                  )}
                  aria-hidden="true"
                >
                  {bank.initials}
                </div>
                <div className="space-y-0.5 min-w-0 w-full">
                  <p className="text-xs font-medium leading-tight line-clamp-2">
                    {bank.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" dir="ltr">
                    {bank.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
