import { create } from "zustand";

interface TestResult {
  ok: boolean;
  accountsFound?: number;
  errorMessage?: string;
}

interface BankWizardStore {
  open: boolean;
  step: 1 | 2 | 3 | 4;
  selectedBankId: string | null;
  formValues: Record<string, string>;
  displayName: string;
  testResult: TestResult | null;
  setOpen: (open: boolean) => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setSelectedBank: (bankId: string) => void;
  setFormValues: (values: Record<string, string>) => void;
  setDisplayName: (name: string) => void;
  setTestResult: (result: TestResult | null) => void;
  reset: () => void;
}

const initialState = {
  open: false,
  step: 1 as const,
  selectedBankId: null,
  formValues: {},
  displayName: "",
  testResult: null,
};

export const useBankWizardStore = create<BankWizardStore>()((set) => ({
  ...initialState,
  setOpen: (open) => set({ open }),
  setStep: (step) => set({ step }),
  setSelectedBank: (bankId) => set({ selectedBankId: bankId }),
  setFormValues: (values) => set({ formValues: { ...values } }),
  setDisplayName: (name) => set({ displayName: name }),
  setTestResult: (result) => set({ testResult: result }),
  reset: () => set({ ...initialState }),
}));
