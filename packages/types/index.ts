export interface Credential {
  id: string;
  bankId: string;
  displayName: string;
  encryptedData: string;
  status: string | null;
  lastScrapedAt: Date | null;
}

export interface Account {
  id: string;
  credentialId: string;
  accountNumber: string;
  balance: number;
  lastUpdatedAt: Date | null;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: string;
  category: string | null;
  status: string | null;
  createdAt: Date;
}

export interface AllowedUser {
  id: string;
  telegramId: string;
  name: string | null;
  role: string;
  isActive: boolean | null;
  addedBy: string | null;
  createdAt: Date;
  lastSeenAt: Date | null;
}

export interface Budget {
  id: string;
  categoryName: string;
  monthlyLimit: number;
  period: string | null;
  alertThreshold: number | null;
  isActive: boolean | null;
  createdAt: Date;
}

export type ScrapeStatus = 'success' | 'error' | 'partial';

export interface ScrapeLog {
  id: string;
  credentialId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  transactionsFetched: number | null;
  status: ScrapeStatus;
  errorMessage: string | null;
}

export interface SchedulerJob {
  jobName: string;
  enabled: boolean;
  cronExpression: string;
  lastRunAt: Date | null;
  lastStatus: ScrapeStatus | null;
  lastError: string | null;
  nextRunAt: Date | null;
  updatedAt: Date | null;
}

export interface BotHeartbeat {
  id: number;
  lastBeatAt: Date | null;
  pid: number | null;
  memoryMb: number | null;
  uptimeSec: number | null;
  lastError: string | null;
  lastErrorAt: Date | null;
}

export interface CommandUsage {
  id: number;
  telegramId: string;
  command: string;
  timestamp: Date;
  success: boolean | null;
  durationMs: number | null;
}

export interface CategoryRule {
  id: number;
  categoryName: string;
  pattern: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}
