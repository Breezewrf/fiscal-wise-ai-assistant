
import React from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash, Download, Receipt, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  merchant?: string;
  importedFrom?: 'manual' | 'wechat' | 'receipt' | 'file';
}

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
  isLoading?: boolean;
}

export function TransactionList({ 
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  isLoading = false
}: TransactionListProps) {
  // Get import source icon
  const getImportSourceIcon = (source?: string) => {
    switch(source) {
      case 'wechat':
        return <Download className="h-3 w-3 mr-1" />;
      case 'receipt':
        return <Receipt className="h-3 w-3 mr-1" />;
      case 'file':
        return <FileText className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Loading transactions...
              </TableCell>
            </TableRow>
          ) : transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {format(transaction.date, 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {transaction.importedFrom && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {getImportSourceIcon(transaction.importedFrom)}
                      {transaction.merchant || transaction.importedFrom}
                    </div>
                  )}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  transaction.type === 'income' ? "text-green-600" : "text-red-600"
                )}>
                  {transaction.type === 'income' ? '+' : '-'}
                  ${transaction.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onEditTransaction && (
                        <DropdownMenuItem onClick={() => onEditTransaction(transaction.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDeleteTransaction && (
                        <DropdownMenuItem 
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
