import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { subMonths, format, addMonths, isSameDay, isToday, startOfDay, endOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, CreditCard, LayoutDashboard, ListChecks, PieChart, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTransactions, deleteTransaction, getExpensesByCategory } from '@/lib/db/transactions';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { useQuery } from '@tanstack/react-query';

interface DataTableProps {
  transactions: any[];
}

function DataTable({ transactions }: DataTableProps) {
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const { refetch } = useDataFetching();
  const isMobile = useIsMobile();

  const handleDelete = async (transactionId: string) => {
    setDeletingTransactionId(transactionId);
    try {
      await deleteTransaction(transactionId);
      toast.success("Transaction deleted successfully!");
      refetch(); // Refresh transactions after deletion
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction.");
    } finally {
      setDeletingTransactionId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto max-h-[300px]">
        <table className="w-full table-auto text-sm">
          <thead className="sticky top-0 bg-background [&_th]:px-4 [&_th]:py-2 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6 border-b">
            <tr>
              <th className="w-[100px]">Date</th>
              <th className="w-[120px]">Category</th>
              <th className="w-[180px]">Description</th>
              <th className="w-[100px]">Amount</th>
              <th className="w-[90px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50 data-[selected=true]:bg-muted">
                <td className="p-4 pl-6">{format(transaction.date, 'HH:mm')}</td>
                <td className="p-4">{transaction.category}</td>
                <td className="p-4 truncate max-w-[180px]">{transaction.description}</td>
                <td className="p-4">{transaction.amount}</td>
                <td className="p-4 pr-6 text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deletingTransactionId === transaction.id}>
                        {deletingTransactionId === transaction.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Are you sure you want to delete this transaction?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(transaction.id)}>
                          {deletingTransactionId === transaction.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle><Skeleton className="h-6 w-80" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-50" /></CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

function useDataFetching() {
  const [date, setDate] = React.useState<Date>(new Date());
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const { data: allTransactions = [], refetch } = useFetchTransactions();

  useEffect(() => {
    if (allTransactions && allTransactions.length > 0) {
      setIsLoading(false);
    }
  }, [allTransactions]);

  const formattedDate = useMemo(() => format(date, 'PPP'), [date]);

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const todayTransactions = useMemo(() => {
    const startOfSelectedDay = startOfDay(date);
    const endOfSelectedDay = endOfDay(date);

    return allTransactions.filter(transaction => {
      if (!transaction.date) return false;
      return transaction.date >= startOfSelectedDay && transaction.date <= endOfSelectedDay;
    });
  }, [date, allTransactions]);

  const topCategories = useMemo(() => {
    // Get the top spending categories for today's transactions
    return getExpensesByCategory(todayTransactions).slice(0, 8);
  }, [todayTransactions]);

  return {
    date,
    formattedDate,
    transactions: todayTransactions,
    isLoading,
    handleDateChange,
    refetch,
    topCategories
  };
}

function useFetchTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions(),
    retry: false,
  });
}

export default function Dashboard() {
  const {
    date,
    formattedDate,
    transactions,
    isLoading,
    handleDateChange,
    refetch,
    topCategories
  } = useDataFetching();
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-80" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-50" /></CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const transactionsForToday = transactions.length;
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return (
    <div className="container px-4 py-6 md:py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <Badge variant="secondary">{isToday(date) ? "Today" : formattedDate}</Badge>
        </div>

        <div className="w-full sm:w-auto">
          <DatePicker
            date={date}
            onDateChange={handleDateChange}
            className="w-full sm:w-auto border-none shadow-none"
            showNavigation={true}
          />
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
            <CardDescription>Income for {formattedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            ${income.toFixed(2)}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>Expenses for {formattedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            ${expenses.toFixed(2)}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Net Balance</CardTitle>
            <CardDescription>Income less expenses for {formattedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            ${balance.toFixed(2)}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Savings Rate</CardTitle>
            <CardDescription>Savings rate for {formattedDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">{savingsRate.toFixed(2)}%</span>
            <Progress value={savingsRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card className="col-span-1 h-full">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Today's Transactions</CardTitle>
              <CardDescription>
                {transactionsForToday} transaction{transactionsForToday !== 1 ? 's' : ''} for {formattedDate}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <DataTable transactions={transactions} />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Your spending for {formattedDate}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="h-[300px] sm:h-[400px] w-full p-2 sm:p-4">
              <CategoryPieChart 
                categoryData={topCategories} 
                categoryColors={['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D', '#BCA88E', '#8FB9AA', '#F28B66']}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
