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
  imported_from?: 'manual' | 'wechat' | 'receipt' | 'file' | null;
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

// Calculate percentage change between two periods
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// Get trends for dashboard stats
export const getFinancialTrends = (transactions: Transaction[]) => {
  // Get current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Set up date ranges for current and previous months
  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
  
  // Filter transactions for current and previous months
  const currentMonthTransactions = transactions.filter(t => 
    t.date >= currentMonthStart
  );
  
  const previousMonthTransactions = transactions.filter(t => 
    t.date >= previousMonthStart && t.date < currentMonthStart
  );
  
  // Calculate summaries
  const currentSummary = getFinancialSummary(currentMonthTransactions);
  const previousSummary = getFinancialSummary(previousMonthTransactions);
  
  // Calculate trends with correct sign logic for each metric
  const incomeTrend = calculatePercentageChange(currentSummary.income, previousSummary.income);
  
  // For expenses, increase is negative, decrease is positive (opposite of income)
  const expensesTrend = calculatePercentageChange(currentSummary.expenses, previousSummary.expenses) * -1;
  
  // For balance, calculate normally but check if direction makes sense 
  // (e.g., moving from negative to positive or vice versa is special case)
  let balanceTrend;
  
  if (previousSummary.balance === 0) {
    balanceTrend = currentSummary.balance >= 0 ? 100 : -100;
  } else if (
    (previousSummary.balance < 0 && currentSummary.balance >= 0) || 
    (previousSummary.balance > 0 && currentSummary.balance <= 0)
  ) {
    // When crossing from negative to positive or vice versa
    balanceTrend = Math.abs(calculatePercentageChange(
      Math.abs(currentSummary.balance), 
      Math.abs(previousSummary.balance)
    ));
    
    // Determine sign
    balanceTrend = previousSummary.balance < currentSummary.balance ? balanceTrend : -balanceTrend;
  } else {
    // Normal case - same sign
    balanceTrend = calculatePercentageChange(currentSummary.balance, previousSummary.balance);
  }
  
  return {
    income: {
      value: currentSummary.income,
      trend: incomeTrend
    },
    expenses: {
      value: currentSummary.expenses,
      trend: expensesTrend
    },
    balance: {
      value: currentSummary.balance,
      trend: balanceTrend
    }
  };
};
