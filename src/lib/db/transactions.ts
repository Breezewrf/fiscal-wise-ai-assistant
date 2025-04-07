
import { v4 as uuidv4 } from 'uuid';
import { supabase, DbTransaction } from '../supabase';
import { Transaction } from '@/components/transactions/TransactionList';

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
  const newTransaction = mapTransactionToDb(transaction);
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([newTransaction])
    .select()
    .single();

  if (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }

  return mapDbToTransaction(data);
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

  return mapDbToTransaction(data);
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
  const dbTransactions = transactions.map(mapTransactionToDb);
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(dbTransactions)
    .select();

  if (error) {
    console.error('Error importing transactions:', error);
    throw error;
  }

  return (data || []).map(mapDbToTransaction);
};
