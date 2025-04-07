
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList, Transaction } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  fetchTransactions, 
  addTransaction, 
  deleteTransaction, 
  updateTransaction 
} from '@/lib/db/transactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Transactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);

  // Fetch transactions with React Query
  const { 
    data: transactions = [], 
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transaction Added",
        description: "Your transaction has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add transaction: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete transaction: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    const newTransaction: Partial<Transaction> = {
      date: data.date,
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description,
      importedFrom: 'manual'
    };
    
    await addTransactionMutation.mutateAsync(newTransaction);
    return Promise.resolve();
  };

  // Handle edit transaction
  const handleEditTransaction = (id: string) => {
    // In a real app, this would open a modal or navigate to edit form
    toast({
      title: "Edit Transaction",
      description: `Editing transaction ${id}. This feature would be implemented in the full version.`,
    });
  };

  // Handle delete transaction
  const handleDeleteTransaction = (id: string) => {
    deleteTransactionMutation.mutate(id);
  };

  // Handle clear all transactions
  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      // Delete each transaction one by one
      const promises = transactions.map(transaction => 
        deleteTransaction(transaction.id)
      );
      
      await Promise.all(promises);
      
      queryClient.setQueryData(['transactions'], []);
      
      toast({
        title: "All Transactions Cleared",
        description: "All transactions have been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear transactions: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Show error message if fetch fails
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Error Loading Transactions",
        description: "Failed to load your transactions: " + (error as Error).message,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Transactions</h1>
      
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="add">Add Transaction</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearAll} 
            disabled={transactions.length === 0 || isClearing || isLoading}
          >
            {isClearing ? "Clearing..." : "Clear All"}
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <TransactionList 
                transactions={transactions}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="add" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Add New Transaction</CardTitle>
              <CardDescription>
                Record a new expense or income transaction.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionForm 
                onSubmit={handleFormSubmit} 
                isSubmitting={addTransactionMutation.isPending}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
