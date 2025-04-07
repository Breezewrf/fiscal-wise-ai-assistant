
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList, Transaction } from '@/components/transactions/TransactionList';
import { generateMockTransactions } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTransactions(20));
  const { toast } = useToast();

  const handleFormSubmit = (data: any) => {
    const newTransaction: Transaction = {
      id: uuidv4(),
      date: data.date,
      type: data.type,
      category: data.category,
      amount: parseFloat(data.amount),
      description: data.description
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    return Promise.resolve(); // Simulate API call success
  };

  const handleEditTransaction = (id: string) => {
    // In a real app, this would open a modal or navigate to edit form
    toast({
      title: "Edit Transaction",
      description: `Editing transaction ${id}. This feature would be implemented in the full version.`,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    toast({
      title: "Transaction Deleted",
      description: "The transaction has been removed.",
    });
  };

  const handleClearAll = () => {
    setTransactions([]);
    toast({
      title: "All Transactions Cleared",
      description: "All transactions have been removed.",
    });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Transactions</h1>
      
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="add">Add Transaction</TabsTrigger>
          </TabsList>
          
          <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={transactions.length === 0}>
            Clear All
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="pt-6">
              <TransactionList 
                transactions={transactions}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
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
              <TransactionForm onSubmit={handleFormSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
