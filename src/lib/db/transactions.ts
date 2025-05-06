
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/components/transactions/TransactionList';
import { Database } from '@/integrations/supabase/types';

export type DbTransaction = {
  id: string;
  user_id: string | null;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string | null;
  created_at: string;
  merchant_name?: string | null;
  imported_from?: 'manual' | 'wechat' | 'receipt' | 'file' | 'alipay' | null;
}

export const mapDbToTransaction = (dbTransaction: DbTransaction): Transaction => {
  return {
    id: dbTransaction.id,
    date: new Date(dbTransaction.date),
    type: dbTransaction.type,
    category: dbTransaction.category,
    amount: dbTransaction.amount,
    description: dbTransaction.description || undefined,
    merchant: dbTransaction.merchant_name || undefined,
    importedFrom: dbTransaction.imported_from || undefined,
  };
};

export const mapTransactionToDb = (transaction: Partial<Transaction>): Partial<DbTransaction> => {
  return {
    id: transaction.id || uuidv4(),
    date: transaction.date ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: transaction.type,
    category: transaction.category || '',
    amount: transaction.amount || 0,
    description: transaction.description,
    merchant_name: transaction.merchant,
    imported_from: transaction.importedFrom,
  };
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }

  return (data as DbTransaction[] || []).map(mapDbToTransaction);
};

export const addTransaction = async (transaction: Partial<Transaction>): Promise<Transaction> => {
  if (!transaction.type || !transaction.category || transaction.amount === undefined) {
    throw new Error('Transaction must include type, category, and amount');
  }
  
  const newTransaction = {
    id: transaction.id || uuidv4(),
    user_id: (await supabase.auth.getUser()).data.user?.id || null,
    date: transaction.date ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description || null,
    merchant_name: transaction.merchant || null,
    imported_from: transaction.importedFrom || null
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

export const importTransactions = async (transactions: Partial<Transaction>[]): Promise<Transaction[]> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const validTransactions = transactions.filter(t => 
    t.type && t.category && t.amount !== undefined
  );
  
  if (validTransactions.length === 0) {
    throw new Error('No valid transactions to import');
  }
  
  const dbTransactions = validTransactions.map(transaction => ({
    id: transaction.id || uuidv4(),
    user_id: userId || null,
    date: transaction.date ? transaction.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    type: transaction.type as 'income' | 'expense',
    category: transaction.category as string,
    amount: transaction.amount as number,
    description: transaction.description || null,
    merchant_name: transaction.merchant || null,
    imported_from: transaction.importedFrom || null
  }));
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(dbTransactions)
    .select();

  if (error) {
    console.error('Error importing transactions:', error);
    throw error;
  }

  return (data as DbTransaction[] || []).map(mapDbToTransaction);
};

interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
}

function getDaysInCurrentMonth(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

function getDaysPassed(): number {
  const now = new Date();
  return now.getDate();
}

export function getFinancialSummary(transactions: Transaction[]): FinancialSummary {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Ensure we're filtering by month and handling the Date comparison correctly
  const monthTransactions = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear;
  });

  // Ensure we're properly calculating totals with null/undefined checks
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income' && typeof t.amount === 'number')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense' && typeof t.amount === 'number')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const daysPassed = getDaysPassed();
  
  // Avoid division by zero
  const daysToUse = daysPassed > 0 ? daysPassed : 1;

  return {
    income: totalIncome / daysToUse,
    expenses: totalExpenses / daysToUse,
    balance: (totalIncome - totalExpenses) / daysToUse
  };
}

export function getFinancialTrends(transactions: Transaction[]) {
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const currentYear = new Date().getFullYear();
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Improve filtering by ensuring date objects exist
  const currentMonthData = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear;
  });

  const lastMonthData = transactions.filter(t => {
    if (!t.date) return false;
    return t.date.getMonth() === lastMonth && t.date.getFullYear() === lastMonthYear;
  });

  // Calculate daily averages with proper checks
  const currentDaysPassed = getDaysPassed();
  const lastMonthDays = new Date(lastMonthYear, lastMonth + 1, 0).getDate();
  
  // Avoid division by zero
  const currentDaysToUse = currentDaysPassed > 0 ? currentDaysPassed : 1;
  const lastMonthDaysToUse = lastMonthDays > 0 ? lastMonthDays : 1;

  const currentAvg = {
    income: currentMonthData
      .filter(t => t.type === 'income' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / currentDaysToUse,
    expenses: currentMonthData
      .filter(t => t.type === 'expense' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / currentDaysToUse
  };

  const lastAvg = {
    income: lastMonthData
      .filter(t => t.type === 'income' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / lastMonthDaysToUse,
    expenses: lastMonthData
      .filter(t => t.type === 'expense' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0) / lastMonthDaysToUse
  };

  // Calculate trend percentages with safety checks to avoid division by zero
  return {
    income: {
      trend: lastAvg.income > 0 ? ((currentAvg.income - lastAvg.income) / lastAvg.income) * 100 : (currentAvg.income > 0 ? 100 : 0)
    },
    expenses: {
      trend: lastAvg.expenses > 0 ? ((currentAvg.expenses - lastAvg.expenses) / lastAvg.expenses) * 100 : (currentAvg.expenses > 0 ? 100 : 0)
    },
    balance: {
      trend: Math.abs(lastAvg.income - lastAvg.expenses) > 0 ? 
        (((currentAvg.income - currentAvg.expenses) - (lastAvg.income - lastAvg.expenses)) / Math.abs(lastAvg.income - lastAvg.expenses)) * 100 : 
        ((currentAvg.income - currentAvg.expenses) > 0 ? 100 : 0)
    }
  };
}

export const getExpensesByCategory = (transactions: Transaction[]) => {
  const expensesByCategory: Record<string, number> = {};
  
  // Add safety check to ensure transactions array exists
  if (!Array.isArray(transactions)) {
    console.error("Expected transactions to be an array but got", typeof transactions);
    return [];
  }
  
  transactions
    .filter(t => t && t.type === 'expense' && typeof t.amount === 'number')
    .forEach(transaction => {
      // Check if category exists, use 'Uncategorized' as default
      const category = transaction.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (transaction.amount || 0);
    });
  
  return Object.entries(expensesByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};

export const generateSpendingTrendData = (transactions: Transaction[]) => {
  // Default month structure with empty values
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
  
  // Check if transactions is an array before processing
  if (Array.isArray(transactions)) {
    transactions.forEach(transaction => {
      if (!transaction || !transaction.date) return;
      
      const date = transaction.date;
      const month = date.toLocaleString('en-US', { month: 'short' });
      
      // Check if month is valid before updating
      if (months[month]) {
        if (transaction.type === 'income' && typeof transaction.amount === 'number') {
          months[month].income += transaction.amount;
        } else if (transaction.type === 'expense' && typeof transaction.amount === 'number') {
          months[month].expenses += transaction.amount;
        }
      }
    });
  }
  
  return Object.entries(months).map(([name, data]) => ({
    name,
    income: data.income,
    expenses: data.expenses,
  }));
};

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};
