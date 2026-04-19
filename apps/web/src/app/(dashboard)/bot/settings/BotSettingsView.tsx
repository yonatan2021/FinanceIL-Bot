"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle, XCircle, Copy } from "lucide-react";
import { useBotConfig, updateBotConfig } from "@/hooks/useBotConfig";
import { useBotConfigStore } from "@/stores/useBotConfigStore";
import type { BotConfig } from "@finance-bot/types";

const DEEP_LINKS = [
  { key: 'budget', label: 'תקציב' },
  { key: 'balances', label: 'יתרות' },
  { key: 'summary', label: 'סיכום' },
  { key: 'transactions', label: 'תנועות' },
  { key: 'search', label: 'חיפוש' },
  { key: 'settings', label: 'הגדרות' },
] as const;

const FEATURE_TOGGLES: {
  field: keyof Pick<BotConfig, 'enableDeepLinks' | 'enablePinning' | 'enableConversations'>;
  label: string;
}[] = [
  { field: 'enableDeepLinks', label: 'קישורים עמוקים' },
  { field: 'enablePinning', label: 'הצמדת הודעות שבועיות' },
  { field: 'enableConversations', label: 'אשף החיפוש (שיחות)' },
];

type PingResult =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok'; latencyMs: number }
  | { status: 'error'; message: string };

export function BotSettingsView() {
  const { config, error, mutate } = useBotConfig();
  const { isSaving, setSaving } = useBotConfigStore();
  const [dashboardUrlInput, setDashboardUrlInput] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<PingResult>({ status: 'idle' });
  const [togglingField, setTogglingField] = useState<string | null>(null);

  const currentUrl = dashboardUrlInput ?? config?.dashboardUrl ?? '';

  const handleSaveUrl = async () => {
    setSaving(true);
    try {
      const updated = await updateBotConfig({ dashboardUrl: currentUrl });
      await mutate(updated, { revalidate: false });
      setDashboardUrlInput(null);
      toast.success('כתובת הדשבורד עודכנה');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handlePing = async () => {
    setPingResult({ status: 'checking' });
    try {
      const res = await fetch('/api/bot/ping-dashboard');
      const json = (await res.json()) as { success: boolean; latencyMs?: number; error?: string };
      if (json.success && json.latencyMs !== undefined) {
        setPingResult({ status: 'ok', latencyMs: json.latencyMs });
      } else {
        setPingResult({ status: 'error', message: json.error ?? 'שגיאה בבדיקת החיבור' });
      }
    } catch {
      setPingResult({ status: 'error', message: 'שגיאה בבדיקת החיבור' });
    }
  };

  const handleToggle = async (
    field: keyof Pick<BotConfig, 'enableDeepLinks' | 'enablePinning' | 'enableConversations'>,
    currentValue: boolean
  ) => {
    setTogglingField(field);
    try {
      const updated = await updateBotConfig({ [field]: !currentValue });
      await mutate(updated, { revalidate: false });
      toast.success('עודכן');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'שגיאה בעדכון');
    } finally {
      setTogglingField(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  return (
    <div>
      <TopBar title="הגדרות בוט" />
      <div className="p-6 max-w-2xl space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm text-right">
            שגיאה בטעינת ההגדרות.{" "}
            <button
              onClick={() => void mutate()}
              className="underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Section A — Dashboard URL */}
        <section className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-right">כתובת הדשבורד</h2>
          <p className="text-sm text-muted-foreground text-right">
            כתובת URL של לוח הבקרה — משמשת ליצירת כפתור "פתח דשבורד" בהודעות הבוט.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              dir="ltr"
              value={currentUrl}
              onChange={(e) => setDashboardUrlInput(e.target.value)}
              placeholder="https://your-dashboard.example.com"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              onClick={() => void handleSaveUrl()}
              disabled={isSaving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={() => void handlePing()}
              disabled={pingResult.status === 'checking'}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {pingResult.status === 'checking' ? 'בודק...' : 'בדוק חיבור'}
            </button>
          </div>
          {pingResult.status === 'ok' && (
            <p className="flex items-center gap-1.5 text-sm text-green-600 justify-end">
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              <span>הדשבורד נגיש — {pingResult.latencyMs}ms</span>
            </p>
          )}
          {pingResult.status === 'error' && (
            <p className="flex items-center gap-1.5 text-sm text-destructive justify-end">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span>{pingResult.message}</span>
            </p>
          )}
        </section>

        {/* Section B — Deep Links */}
        <section className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-right">קישורים עמוקים</h2>
          <p className="text-sm text-muted-foreground text-right">
            קישורים ישירים לחלקים שונים בבוט. החלף את <code className="font-mono bg-muted px-1 rounded">&lt;שם-הבוט&gt;</code> בשם המשתמש של הבוט ב-Telegram.
          </p>
          <div className="space-y-2">
            {DEEP_LINKS.map(({ key, label }) => {
              const link = `t.me/<שם-הבוט>?start=${key}`;
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
                  <span className="text-sm text-muted-foreground min-w-20 text-right">{label}</span>
                  <span dir="ltr" className="flex-1 font-mono text-xs text-slate-700">{link}</span>
                  <button
                    onClick={() => void handleCopy(link)}
                    aria-label={`העתק קישור ל${label}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section C — Feature Toggles */}
        <section className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="text-base font-semibold text-right">הגדרות פיצ'רים</h2>
          <div className="space-y-3">
            {FEATURE_TOGGLES.map(({ field, label }) => {
              const enabled = config?.[field] ?? false;
              const isToggling = togglingField === field;
              return (
                <div key={field} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Switch
                    checked={enabled}
                    disabled={isToggling || config === null}
                    onCheckedChange={() => void handleToggle(field, enabled)}
                    aria-label={label}
                  />
                  <span className="text-sm font-medium text-right">{label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
