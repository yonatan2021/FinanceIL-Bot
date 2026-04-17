export const dynamic = "force-dynamic";

import { TopBar } from "@/components/layout/top-bar";
import { TransactionsClient } from "./transactions-client";

export default function TransactionsPage() {
  return (
    <div>
      <TopBar title="עסקאות" />
      <div className="p-6">
        <TransactionsClient />
      </div>
    </div>
  );
}
