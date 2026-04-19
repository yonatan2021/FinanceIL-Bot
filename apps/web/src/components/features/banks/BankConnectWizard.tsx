"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BankPicker } from "./BankPicker";
import { BankCredentialForm } from "./BankCredentialForm";
import { BANKS } from "@/lib/banks";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
  onSuccess: (cred: SafeCredential) => void;
}

type Step = 1 | 2 | 3 | 4;

interface TestResult {
  ok: boolean;
  accountsFound: number;
  errorMessage?: string;
}

const STEP_LABELS: Record<Step, string> = {
  1: "בחר בנק",
  2: "פרטי כניסה",
  3: "בדוק חיבור",
  4: "שמור",
};

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = [1, 2, 3, 4];
  return (
    <div className="flex items-center justify-center gap-1 mb-6" aria-label="שלבי האשף">
      {steps.map((step, idx) => {
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  isActive && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  !isDone && !isActive && "bg-muted text-muted-foreground"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : step}
              </div>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 mb-5 mx-1 transition-colors",
                  step < current ? "bg-primary" : "bg-muted"
                )}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BankConnectWizard({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Reset all state when dialog opens fresh
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedBank(null);
      setFieldValues({});
      setDisplayName("");
      setTestLoading(false);
      setTestResult(null);
      setSaveLoading(false);
    }
  }, [open]);

  function handleFieldChange(key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  }

  function isStep2Valid(): boolean {
    if (!selectedBank) return false;
    const bank = BANKS[selectedBank];
    if (!bank) return false;
    if (!displayName.trim()) return false;
    return bank.fields.every((f) => (fieldValues[f.key] ?? "").trim() !== "");
  }

  async function handleTestConnection() {
    if (!selectedBank) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/bot/scrape/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId: selectedBank, loginData: fieldValues }),
      });
      const json = await res.json() as { success: boolean; data?: TestResult; error?: string };
      if (json.success && json.data) {
        setTestResult(json.data);
      } else {
        setTestResult({ ok: false, accountsFound: 0, errorMessage: json.error ?? "שגיאה בבדיקת החיבור" });
      }
    } catch {
      setTestResult({ ok: false, accountsFound: 0, errorMessage: "שגיאת רשת. נסה שוב." });
    } finally {
      setTestLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedBank) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bankId: selectedBank,
          loginData: fieldValues,
        }),
      });
      const json = await res.json() as { success: boolean; data?: SafeCredential; error?: string };
      if (!json.success || !json.data) {
        toast.error(json.error ?? "שגיאה בשמירת הבנק");
        return;
      }
      toast.success("בנק נוסף בהצלחה");
      onSuccess(json.data);
      onOpenChange(false);
    } catch {
      toast.error("שגיאת רשת. נסה שוב.");
    } finally {
      setSaveLoading(false);
    }
  }

  const bank = selectedBank ? BANKS[selectedBank] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>חיבור בנק חדש</DialogTitle>
          <DialogDescription className="sr-only">
            חיבור חשבון בנק חדש לניטור אוטומטי
          </DialogDescription>
        </DialogHeader>

        <StepIndicator current={step} />

        {/* Step 1: Bank Picker */}
        {step === 1 && (
          <div className="space-y-4">
            <BankPicker selected={selectedBank} onSelect={setSelectedBank} />
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedBank}
                className="min-h-11"
              >
                המשך
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && selectedBank && (
          <div className="space-y-4">
            <BankCredentialForm
              bankId={selectedBank}
              values={fieldValues}
              onChange={handleFieldChange}
              displayName={displayName}
              onDisplayNameChange={setDisplayName}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="min-h-11">
                חזור
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid()}
                className="min-h-11"
              >
                המשך
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Test Connection */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
              <p className="font-medium">{bank?.name}</p>
              <p className="text-muted-foreground">{displayName}</p>
            </div>

            {!testResult && !testLoading && (
              <p className="text-sm text-muted-foreground text-center py-2">
                לחץ על הכפתור לבדיקת החיבור לבנק
              </p>
            )}

            {testLoading && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">בודק חיבור...</p>
              </div>
            )}

            {testResult && testResult.ok && (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
                <p className="font-medium text-emerald-700">החיבור הצליח</p>
                <p className="text-sm text-muted-foreground">
                  נמצאו {testResult.accountsFound} חשבונות
                </p>
              </div>
            )}

            {testResult && !testResult.ok && (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <XCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
                <p className="font-medium text-destructive">החיבור נכשל</p>
                {testResult.errorMessage && (
                  <p className="text-sm text-muted-foreground">{testResult.errorMessage}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="min-h-11">
                חזור
              </Button>
              <div className="flex items-center gap-3">
                {!testResult && (
                  <Button
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="min-h-11"
                  >
                    {testLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    בדוק חיבור
                  </Button>
                )}
                {testResult && !testResult.ok && (
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    className="min-h-11"
                  >
                    נסה שוב
                  </Button>
                )}
                <div className="flex flex-col items-end gap-1">
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!testResult?.ok}
                    className="min-h-11"
                  >
                    המשך
                  </Button>
                  {!testResult?.ok && (
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      דלג
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-medium text-sm">סיכום</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">בנק</span>
                  <span className="font-medium">{bank?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">שם תצוגה</span>
                  <span className="font-medium">{displayName}</span>
                </div>
                {testResult?.ok && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">סטטוס</span>
                    <span className="text-emerald-600 font-medium">נבדק ✓</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="min-h-11">
                חזור
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveLoading}
                className="min-h-11"
              >
                {saveLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                שמור
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
