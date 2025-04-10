
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/components/transactions/TransactionList';

export type DbTransaction = {
  id: string;
  user_id: string | null;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string;
  created_at: string;
  merchant_name?: string;
  imported_from?: 'manual' | 'wechat' | 'receipt' | 'file';
}

// Convert from DB format to app format
export const mapDbToTransaction = (dbTransaction: DbTransaction): Transaction => {
  return {
    id: dbTransaction.id,
    date: new Date(dbTransaction.date),
    type: dbTransaction.type,
    category: dbTransaction.category,
    amount: dbTransaction.amount,
    description: dbTransaction.description,
    merchant: dbTransaction.merchant_name,
    importedFrom: dbTransaction.imported_from,
  };
};

// Convert from app format to DB format
export const mapTransactionToDb = (transaction: Partial<Transaction>): Partial<DbTransaction> => {
  return {
    id: transaction.id || uuidv4(),
    date: transaction.date ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
    merchant_name: transaction.merchant,
    imported_from: transaction.importedFrom,
  };
};

// Fetch all transactions for the current user
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return (data || []).map(mapDbToTransaction);
};

// Add a new transaction
export const addTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  const newTransaction = {
    ...mapTransactionToDb(transaction),
    // Ensure the user_id is set to the current user's ID
    user_id: (await supabase.auth.getUser()).data.user?.id,
  };
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([newTransaction])
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }

  return mapDbToTransaction(data as DbTransaction);
};

// Update an existing transaction
export const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const updatedFields = mapTransactionToDb(updates);
  
  const { data, error } = await supabase
    .from('transactions')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }

  return mapDbToTransaction(data as DbTransaction);
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Import multiple transactions at once (for batch imports)
export const importTransactions = async (transactions: Partial<Transaction>[]): Promise<Transaction[]> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const dbTransactions = transactions.map(transaction => ({
    ...mapTransactionToDb(transaction),
    user_id: userId,
  }));
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(dbTransactions)
    .select();

  if (error) {
    console.error('Error importing transactions:', error);
    throw error;
  }

  return (data || []).map((item) => mapDbToTransaction(item as DbTransaction));
};

// Get financial summary from transactions
export const getFinancialSummary = (transactions: Transaction[]) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    income,
    expenses,
    balance: income - expenses
  };
};

// Get expenses by category
export const getExpensesByCategory = (transactions: Transaction[]) => {
  const expensesByCategory: Record<string, number> = {};
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const category = transaction.category;
      expensesByCategory[category] = (expensesByCategory[category] || 0) + transaction.amount;
    });
  
  return Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};

// Generate spending trend data from real transactions
export const generateSpendingTrendData = (transactions: Transaction[]) => {
  const months: Record<string, { income: number; expenses: number }> = {
    'Jan': { income: 0, expenses: 0 },
    'Feb': { income: 0, expenses: 0 },
    'Mar': { income: 0, expenses: 0 },
    'Apr': { income: 0, expenses: 0 },
    'May': { income: 0, expenses: 0 },
    'Jun': { income: 0, expenses: 0 },
    'Jul': { income: 0, expenses: 0 },
    'Aug': { income: 0, expenses: 0 },
    'Sep': { income: 0, expenses: 0 },
    'Oct': { income: 0, expenses: 0 },
    'Nov': { income: 0, expenses: 0 },
    'Dec': { income: 0, expenses: 0 },
  };
  
  transactions.forEach(transaction => {
    const date = transaction.date;
    const month = date.toLocaleString('en-US', { month: 'short' });
    
    if (transaction.type === 'income') {
      months[month].income += transaction.amount;
    } else {
      months[month].expenses += transaction.amount;
    }
  });
  
  return Object.entries(months).map(([name, data]) => ({
    name,
    income: data.income,
    expenses: data.expenses,
  }));
};
