
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, ArrowUpDown, FileText, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface Transaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  merchant?: string;
  importedFrom?: 'manual' | 'wechat' | 'receipt' | 'file' | 'alipay';
}

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  isLoading?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  isLoading = false
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getImportSourceIcon = (source?: string) => {
    switch (source) {
      case 'manual':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'wechat':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">WeChat</Badge>;
      case 'alipay':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Alipay</Badge>;
      case 'receipt':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Receipt</Badge>;
      default:
        return <Wallet className="h-4 w-4 text-gray-500" />;
    }
  };

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      transaction.category.toLowerCase().includes(searchTermLower) ||
      (transaction.description && transaction.description.toLowerCase().includes(searchTermLower)) ||
      (transaction.merchant && transaction.merchant.toLowerCase().includes(searchTermLower)) ||
      formatCurrency(transaction.amount).includes(searchTerm)
    );
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc'
        ? a.date.getTime() - b.date.getTime()
        : b.date.getTime() - a.date.getTime();
    }

    if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc'
        ? a.amount - b.amount
        : b.amount - a.amount;
    }

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search transactions..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="text-sm text-muted-foreground">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm
            ? "No transactions match your search"
            : "No transactions yet. Add your first transaction to get started!"}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">
                  <Button variant="ghost" className="p-0 font-semibold" onClick={() => handleSort('date')}>
                    Date
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" className="p-0 font-semibold" onClick={() => handleSort('amount')}>
                    Amount
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={transaction.type === 'expense' ? 'destructive' : 'default'}
                        className="capitalize"
                      >
                        {transaction.type}
                      </Badge>
                      {transaction.category}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{transaction.description || '-'}</span>
                      {transaction.merchant && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          {getImportSourceIcon(transaction.importedFrom)}
                          {transaction.merchant}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditTransaction(transaction.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
