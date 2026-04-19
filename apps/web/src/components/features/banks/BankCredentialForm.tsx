"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BANKS } from "@/lib/banks";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  bankId: string;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  displayName: string;
  onDisplayNameChange: (v: string) => void;
}

export function BankCredentialForm({
  bankId,
  values,
  onChange,
  displayName,
  onDisplayNameChange,
}: Props) {
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set());
  const bank = BANKS[bankId];

  if (!bank) return null;

  function toggleVisibility(key: string) {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Display name — always first */}
      <div className="space-y-2">
        <Label htmlFor="credential-display-name">שם תצוגה</Label>
        <Input
          id="credential-display-name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder={`לדוגמה: ${bank.name} עו"ש`}
          required
          aria-required="true"
        />
      </div>

      {/* Dynamic fields from bank definition */}
      {bank.fields.map((field) => {
        const inputId = `credential-field-${field.key}`;
        const isPassword = field.type === "password";
        const isVisible = visibleFields.has(field.key);
        const inputType = isPassword && !isVisible ? "password" : "text";

        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={inputId}>{field.label}</Label>
            <div className="relative">
              <Input
                id={inputId}
                type={inputType}
                dir="ltr"
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required
                aria-required="true"
                className={isPassword ? "pe-10" : undefined}
              />
              {isPassword && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleVisibility(field.key)}
                  aria-label={isVisible ? "הסתר סיסמה" : "הצג סיסמה"}
                  className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                  tabIndex={0}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
