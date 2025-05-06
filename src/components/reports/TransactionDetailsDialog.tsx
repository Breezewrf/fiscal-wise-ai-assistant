
import React, { useState } from 'react';
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: any[];
  category: string;
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transactions,
  category,
}: TransactionDetailsDialogProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'amount';
    direction: 'asc' | 'desc';
  }>({
    key: 'date',
    direction: 'desc'
  });
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = sortConfig.key === 'date' ? a.date.getTime() : a.amount;
    const bValue = sortConfig.key === 'date' ? b.date.getTime() : b.amount;
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (key: 'date' | 'amount') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{category} Transactions</DialogTitle>
        </DialogHeader>
        
        {/* Explicitly set height for the ScrollArea to ensure scrollbar visibility */}
        <div className="flex-grow overflow-hidden" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <ScrollArea className="h-full" style={{ maxHeight: '100%' }}>
            <div className="pr-4"> {/* Add right padding to prevent content from being hidden behind scrollbar */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1"
                      >
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                        {sortConfig.key === 'date' && (
                          <span className="ml-1 text-xs">
                            ({sortConfig.direction === 'asc' ? '↑' : '↓'})
                          </span>
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1"
                      >
                        Amount
                        <ArrowUpDown className="h-3 w-3" />
                        {sortConfig.key === 'amount' && (
                          <span className="ml-1 text-xs">
                            ({sortConfig.direction === 'asc' ? '↑' : '↓'})
                          </span>
                        )}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No transactions found for this category
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedTransactions.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{format(transaction.date, 'MMM d, yyyy')}</TableCell>
                        <TableCell>{transaction.description || 'No description'}</TableCell>
                        <TableCell className="text-right">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
        
        {transactions.length > 0 && (
          <div className="text-center text-xs text-muted-foreground mt-2 pt-2 border-t">
            {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
