
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = sortConfig.key === 'date' ? a.date.getTime() : a.amount;
    const bValue = sortConfig.key === 'date' ? b.date.getTime() : b.amount;
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Get current page items
  const currentItems = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: 'date' | 'amount') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxPageButtons = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxPageButtons) {
      // If total pages is less than max buttons, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of page range around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(totalPages - 1, 4);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed before middle pages
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed after middle pages
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{category} Transactions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
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
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    No transactions found for this category
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((transaction, index) => (
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
        </ScrollArea>
        
        {/* Pagination component */}
        {totalPages > 1 && (
          <div className="mt-4 border-t pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                      <div className="flex h-9 w-9 items-center justify-center">
                        <span>...</span>
                      </div>
                    ) : (
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => goToPage(Number(page))}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            
            <div className="text-center text-xs text-muted-foreground mt-2">
              Showing page {currentPage} of {totalPages}
              {transactions.length > 0 ? ` (${transactions.length} total transactions)` : ''}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
