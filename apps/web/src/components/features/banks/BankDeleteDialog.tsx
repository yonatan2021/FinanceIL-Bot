"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SafeCredential {
  id: string;
  displayName: string;
  bankId: string;
  status: string | null;
  lastScrapedAt: Date | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  credential: SafeCredential;
  onSuccess: () => void;
}

export function BankDeleteDialog({ open, onOpenChange, credential, onSuccess }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const isMatch = inputValue === credential.displayName;

  async function handleDelete() {
    if (!isMatch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/credentials/${credential.id}`, {
        method: "DELETE",
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? "שגיאה בהסרת הבנק");
        return;
      }
      toast.success(`${credential.displayName} הוסר בהצלחה`);
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("שגיאת רשת. נסה שוב.");
    } finally {
      setLoading(false);
      setInputValue("");
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) setInputValue("");
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            הסרת חיבור בנק
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            פעולה זו תמחק את החיבור לבנק לצמיתות. כדי לאשר, הקלד את שם הבנק:
          </p>

          <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
            {credential.displayName}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm-input">אישור שם הבנק</Label>
            <Input
              id="delete-confirm-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={credential.displayName}
              aria-label={`הקלד ${credential.displayName} לאישור`}
              onPaste={(e) => e.preventDefault()}
            />
          </div>

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="min-h-11"
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isMatch || loading}
              className="min-h-11"
            >
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              הסר חיבור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
