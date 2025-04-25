import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { cn } from "@/lib/utils";

interface FinancialSummary {
  income: number;
  expenses: number;
  balance: number;
  dailyAvgIncome: number;
  dailyAvgExpenses: number;
  savingsRate: number;
}

interface MetricCardsProps {
  financialSummary: FinancialSummary;
  formatDateDisplay: () => string;
}

export function MetricCards({ financialSummary, formatDateDisplay }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <Card className="w-full">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-2" />
            <div className="text-xl md:text-2xl font-bold truncate">
              ${financialSummary.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg ${financialSummary.dailyAvgIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
          </p>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-red-500 mr-2" />
            <div className="text-xl md:text-2xl font-bold truncate">
              ${financialSummary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Avg ${financialSummary.dailyAvgExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
          </p>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {financialSummary.balance >= 0 ? (
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500 mr-2" />
            ) : (
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-500 mr-2" />
            )}
            <div className={cn(
              "text-xl md:text-2xl font-bold truncate",
              financialSummary.balance >= 0 ? "text-green-600" : "text-red-600"
            )}>
              ${Math.abs(financialSummary.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {financialSummary.balance >= 0 ? "Surplus" : "Deficit"} for {formatDateDisplay()}
          </p>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-1 md:pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Savings Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Percent className="h-4 w-4 md:h-5 md:w-5 text-primary mr-2" />
            <div className="text-xl md:text-2xl font-bold truncate">
              {financialSummary.savingsRate.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Of total income saved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
