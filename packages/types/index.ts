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

export interface ScrapeLog {
  id: string;
  credentialId: string | null;
  startedAt: Date;
  finishedAt: Date | null;
  transactionsFetched: number | null;
  status: string;
  errorMessage: string | null;
}
