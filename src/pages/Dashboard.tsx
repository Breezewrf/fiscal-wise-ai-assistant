
import React, { useState } from 'react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  LineChart, 
  PieChart,
  Lightbulb
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Transaction } from '@/components/transactions/TransactionList';
import { 
  getFinancialSummary,
  generateSpendingTrendData,
  getExpensesByCategory,
  getFinancialTrends
} from '@/lib/db/transactions';
import { generateMockInsights } from '@/lib/mock-data';
import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '@/lib/db/transactions';

export default function Dashboard() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });
  
  const summary = getFinancialSummary(transactions);
  const trends = getFinancialTrends(transactions);
  const insights = generateMockInsights(transactions);
  const spendingTrendData = generateSpendingTrendData(transactions);
  const expenseBreakdownData = getExpensesByCategory(transactions);
  
  const COLORS = ['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D'];

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard 
          title="Income"
          value={`$${summary.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<ArrowUpRight className="h-5 w-5 text-green-500" />}
          description="Total income this month"
          trend={{ value: trends.income.trend, isPositive: trends.income.trend >= 0 }}
        />
        
        <StatCard 
          title="Expenses"
          value={`$${summary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<ArrowDownRight className="h-5 w-5 text-red-500" />}
          description="Total expenses this month"
          trend={{ value: trends.expenses.trend, isPositive: trends.expenses.trend <= 0 }}
        />
        
        <StatCard 
          title="Balance"
          value={`$${summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          description="Current balance"
          trend={{ value: trends.balance.trend, isPositive: trends.balance.trend >= 0 }}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Monthly Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full p-4">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading spending data...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={spendingTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, undefined]}
                      labelStyle={{ color: '#1A1F2C' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="income" name="Income" fill="#087E8B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#D9A566" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full p-4">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading expense data...</p>
                </div>
              ) : expenseBreakdownData.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-muted-foreground">No expense data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      label={({ name, percent }) => 
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expenseBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip 
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return [`$${value.toFixed(2)}`, undefined];
                        }
                        return [`$${value}`, undefined];
                      }}
                      labelStyle={{ color: '#1A1F2C' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="h-24 flex items-center justify-center">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {transaction.date.toLocaleDateString()}
                      </span>
                    </div>
                    <span className={transaction.type === 'income' 
                      ? "text-green-600 font-medium" 
                      : "text-red-600 font-medium"
                    }>
                      {transaction.type === 'income' ? '+' : '-'}
                      ${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="flex gap-3 bg-muted/20 p-3 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
