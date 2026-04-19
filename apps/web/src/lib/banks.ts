export interface BankField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder?: string;
}

export interface BankDef {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  initials: string;
  helpUrl: string;
  fields: BankField[];
}

export const BANKS: Record<string, BankDef> = {
  hapoalim: {
    id: "hapoalim",
    name: "בנק הפועלים",
    subtitle: "Bank Hapoalim",
    color: "bg-red-600",
    initials: "פע",
    helpUrl: "https://www.bankhapoalim.co.il",
    fields: [
      { key: "userCode", label: "קוד משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  leumi: {
    id: "leumi",
    name: "בנק לאומי",
    subtitle: "Bank Leumi",
    color: "bg-blue-700",
    initials: "לא",
    helpUrl: "https://www.leumi.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  discount: {
    id: "discount",
    name: "בנק דיסקונט",
    subtitle: "Bank Discount",
    color: "bg-orange-500",
    initials: "דס",
    helpUrl: "https://www.discountbank.co.il",
    fields: [
      { key: "id", label: "תעודת זהות", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
      { key: "num", label: "מספר לקוח", type: "text" },
    ],
  },
  mizrahi: {
    id: "mizrahi",
    name: "בנק מזרחי טפחות",
    subtitle: "Bank Mizrahi",
    color: "bg-green-700",
    initials: "מז",
    helpUrl: "https://www.mizrahi-tefahot.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  otsarHahayal: {
    id: "otsarHahayal",
    name: "אוצר החייל",
    subtitle: "Otzar Hahayal",
    color: "bg-slate-600",
    initials: "אח",
    helpUrl: "https://www.bankotsar.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  igud: {
    id: "igud",
    name: "בנק איגוד",
    subtitle: "Bank Igud",
    color: "bg-purple-600",
    initials: "אג",
    helpUrl: "https://www.unionbank.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  beinleumi: {
    id: "beinleumi",
    name: "הבנק הבינלאומי",
    subtitle: "First International Bank",
    color: "bg-sky-700",
    initials: "בי",
    helpUrl: "https://www.fibi.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  massad: {
    id: "massad",
    name: "בנק מסד",
    subtitle: "Bank Massad",
    color: "bg-teal-600",
    initials: "מס",
    helpUrl: "https://www.bankmassad.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  visaCal: {
    id: "visaCal",
    name: "ויזה כאל",
    subtitle: "Visa Cal",
    color: "bg-blue-500",
    initials: "VC",
    helpUrl: "https://www.cal-online.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  max: {
    id: "max",
    name: "מקס",
    subtitle: "Max (formerly Leumi Card)",
    color: "bg-indigo-600",
    initials: "MX",
    helpUrl: "https://www.max.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  isracard: {
    id: "isracard",
    name: "ישראכרט",
    subtitle: "Isracard",
    color: "bg-rose-600",
    initials: "IC",
    helpUrl: "https://www.isracard.co.il",
    fields: [
      { key: "id", label: "תעודת זהות", type: "text" },
      { key: "card6Digits", label: "6 ספרות כרטיס", type: "text", placeholder: "XXXXXX" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  amex: {
    id: "amex",
    name: "אמריקן אקספרס",
    subtitle: "American Express Israel",
    color: "bg-cyan-700",
    initials: "AX",
    helpUrl: "https://www.americanexpress.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
  beyahadBishvilha: {
    id: "beyahadBishvilha",
    name: "ביחד בשבילך",
    subtitle: "Be'yahad Bishvilha",
    color: "bg-pink-600",
    initials: "בב",
    helpUrl: "https://www.beyahad.co.il",
    fields: [
      { key: "username", label: "שם משתמש", type: "text" },
      { key: "password", label: "סיסמה", type: "password" },
    ],
  },
};

export const BANKS_LIST: BankDef[] = Object.values(BANKS);
