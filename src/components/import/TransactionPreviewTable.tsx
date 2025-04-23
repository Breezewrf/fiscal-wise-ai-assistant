
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/components/transactions/TransactionList";

type EditableTransaction = Partial<Transaction> & { id?: string };

type TransactionPreviewTableProps = {
  transactions: EditableTransaction[];
  onTransactionChange: (idx: number, updated: EditableTransaction) => void;
  onRemove: (idx: number) => void;
  page?: number;
  perPage?: number;
};

export const TransactionPreviewTable: React.FC<TransactionPreviewTableProps> = ({
  transactions,
  onTransactionChange,
  onRemove,
  page = 1,
  perPage = 10,
}) => {
  // Simple client-side paging
  const startIdx = (page - 1) * perPage;
  const endIdx = startIdx + perPage;
  const paged = transactions.slice(startIdx, endIdx);

  // Show a summary if too many items
  return (
    <div className="max-h-[420px] overflow-y-auto border rounded-lg">
      <Table>
        <TableCaption>
          {transactions.length === 0
            ? "No transactions to import"
            : `Showing ${startIdx + 1}-${Math.min(endIdx, transactions.length)} of ${transactions.length} transactions`}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Source</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((txn, i) => (
            <TableRow key={i}>
              <TableCell>
                <Input
                  type="date"
                  value={txn.date
                    ? typeof txn.date === "string"
                      ? txn.date.slice(0, 10)
                      : new Date(txn.date).toISOString().slice(0, 10)
                    : ""}
                  onChange={(e) =>
                    onTransactionChange(
                      startIdx + i,
                      { ...txn, date: e.target.value }
                    )
                  }
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <select
                  className="w-24 border rounded p-1"
                  value={txn.type || ""}
                  onChange={(e) =>
                    onTransactionChange(startIdx + i, {
                      ...txn,
                      type: e.target.value as "income" | "expense",
                    })
                  }
                >
                  <option value="">-</option>
                  <option value="expense">expense</option>
                  <option value="income">income</option>
                </select>
              </TableCell>
              <TableCell>
                <Input
                  value={txn.category || ""}
                  onChange={(e) =>
                    onTransactionChange(startIdx + i, {
                      ...txn,
                      category: e.target.value,
                    })
                  }
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={txn.amount ?? ""}
                  onChange={(e) =>
                    onTransactionChange(startIdx + i, {
                      ...txn,
                      amount: Number(e.target.value),
                    })
                  }
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={txn.description || ""}
                  onChange={(e) =>
                    onTransactionChange(startIdx + i, {
                      ...txn,
                      description: e.target.value,
                    })
                  }
                  className="w-44"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={txn.merchant_name || txn.merchant || ""}
                  onChange={(e) =>
                    onTransactionChange(startIdx + i, {
                      ...txn,
                      merchant_name: e.target.value,
                    })
                  }
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <span className="text-xs text-gray-500">{txn.importedFrom}</span>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  onClick={() => onRemove(startIdx + i)}
                  type="button"
                  aria-label="Remove"
                  size="sm"
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination controls if needed */}
      {transactions.length > perPage && (
        <div className="flex gap-2 items-center justify-end px-2 py-1">
          <span>
            Page {page} of {Math.ceil(transactions.length / perPage)}
          </span>
        </div>
      )}
    </div>
  );
};
