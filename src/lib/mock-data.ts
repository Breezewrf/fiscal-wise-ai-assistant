
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/components/transactions/TransactionList';

// Mock transactions data
export const generateMockTransactions = (count: number = 20): Transaction[] => {
  const categories = {
    expense: [
      'Food & Dining',
      'Shopping',
      'Housing',
      'Transportation',
      'Entertainment',
      'Health & Medical',
      'Personal Care',
      'Education',
      'Travel',
      'Gifts & Donations',
      'Bills & Utilities',
      'Other',
    ],
    income: [
      'Salary',
      'Business',
      'Investments',
      'Gifts',
      'Rental Income',
      'Other',
    ],
  };

  const transactions: Transaction[] = [];

  // Current date
  const currentDate = new Date();
  
  // Generate transactions for the past 'count' days
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(currentDate.getDate() - i);
    
    // Randomly decide if it's income or expense
    const type = Math.random() > 0.7 ? 'income' : 'expense';
    
    // Get a random category based on the type
    const category = categories[type][Math.floor(Math.random() * categories[type].length)];
    
    // Generate a random amount
    let amount: number;
    if (type === 'income') {
      amount = parseFloat((Math.random() * 2000 + 1000).toFixed(2));
    } else {
      amount = parseFloat((Math.random() * 200 + 10).toFixed(2));
    }
    
    // Add the transaction
    transactions.push({
      id: uuidv4(),
      date,
      type,
      category,
      amount,
      description: `${type === 'income' ? 'Received' : 'Spent'} on ${category}`,
    });
  }
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Get total income, expenses and balance for given transactions
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

// Get category breakdown for expenses
export const getExpensesByCategory = (transactions: Transaction[]) => {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categories = expenseTransactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    
    acc[category] += amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to array for easier sorting/mapping
  return Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};

// Generate mock AI insights
export const generateMockInsights = (transactions: Transaction[]) => {
  const insights = [
    "Your food expenses are 15% higher than last month. Consider meal planning to reduce costs.",
    "You've been consistent with saving 10% of your income - great job!",
    "Your highest spending category this month is Entertainment at $320.",
    "Consider setting a budget for Shopping, as it's trending upward.",
    "Your utility bills decreased by 8% compared to the same period last year."
  ];
  
  // Return 3 random insights
  return insights
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
};

// Generate data for spending trend chart
export const generateSpendingTrendData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Get last 6 months
  const lastSixMonths = Array.from({ length: 6 }).map((_, index) => {
    const monthIndex = (currentMonth - index + 12) % 12;
    return months[monthIndex];
  }).reverse();
  
  return lastSixMonths.map(month => ({
    name: month,
    income: Math.floor(Math.random() * 3000) + 2000,
    expenses: Math.floor(Math.random() * 2000) + 1000,
  }));
};

// Generate data for expense breakdown chart
export const generateExpenseBreakdownData = (transactions: Transaction[]) => {
  const categoryData = getExpensesByCategory(transactions);
  
  // Return top 5 categories
  return categoryData.slice(0, 5).map(category => ({
    name: category.name,
    value: category.amount
  }));
};
