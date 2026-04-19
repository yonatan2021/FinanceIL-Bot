"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { BankConnectWizard } from "@/components/features/banks/BankConnectWizard";
import { BankDeleteDialog } from "@/components/features/banks/BankDeleteDialog";
import { BANKS } from "@/lib/banks";
import { Plus, Trash2, Landmark } from "lucide-react";
import { useCredentials } from "@/hooks/useCredentials";
import type { SafeCredential } from "@/hooks/useCredentials";

// BankDeleteDialog expects lastScrapedAt: Date | null — adapter to satisfy its type
type CredentialForDialog = {
  id: string;
  displayName: string;
  bankId: string;
  status: string | null;
  lastScrapedAt: Date | null;
};

function toDialogCredential(cred: SafeCredential): CredentialForDialog {
  return {
    ...cred,
    lastScrapedAt: cred.lastScrapedAt ? new Date(cred.lastScrapedAt) : null,
  };
}

export function BanksClient() {
  const { credentials: creds, mutate, error: credsError, isLoading: credsLoading } = useCredentials();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SafeCredential | null>(null);

  async function handleWizardSuccess() {
    await mutate();
  }

  async function handleDeleteSuccess() {
    setDeleteTarget(null);
    await mutate();
  }

  return (
    <div className="space-y-4">
      {credsError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          שגיאה בטעינת הבנקים.{" "}
          <button className="underline" onClick={() => void mutate()}>נסה שוב</button>
        </div>
      )}
      {credsLoading && creds.length === 0 && (
        <div className="mb-4 text-sm text-muted-foreground">טוען...</div>
      )}
      <div className="flex justify-end">
        <Button
          onClick={() => setWizardOpen(true)}
          className="gap-2 min-h-11"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          הוסף בנק
        </Button>
      </div>

      {creds.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="אין בנקים מחוברים"
          description="חבר את חשבון הבנק שלך כדי לעקוב אחר העסקאות שלך"
          action={{ label: "הוסף בנק", onClick: () => setWizardOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creds.map((cred) => {
            const bank = BANKS[cred.bankId];
            return (
              <Card key={cred.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {bank && (
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${bank.color}`}
                        aria-hidden="true"
                      >
                        {bank.initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{cred.displayName}</CardTitle>
                      {bank && (
                        <p className="text-xs text-muted-foreground truncate">{bank.name}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(cred)}
                    aria-label={`הסרת ${cred.displayName}`}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {cred.bankId}
                  </p>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={cred.status ?? "active"} />
                    {cred.lastScrapedAt && (
                      <span className="text-xs text-muted-foreground">
                        עודכן:{" "}
                        {new Date(cred.lastScrapedAt).toLocaleDateString("he-IL")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BankConnectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => void handleWizardSuccess()}
      />

      {deleteTarget && (
        <BankDeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          credential={toDialogCredential(deleteTarget)}
          onSuccess={() => void handleDeleteSuccess()}
        />
      )}
    </div>
  );
}
