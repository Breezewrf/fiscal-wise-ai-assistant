
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, isAfter, isBefore, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachDayOfInterval, addMonths, subMonths, isFuture, addWeeks, addQuarters, addYears, subWeeks, subQuarters, subYears } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTransactions, getExpensesByCategory, generateSpendingTrendData } from '@/lib/db/transactions';
import { ExportOptions } from '@/components/reports/ExportOptions';
import { MetricCards } from '@/components/reports/MetricCards';
import { PeriodSelect } from '@/components/reports/PeriodSelect';
import { ReportTabs } from '@/components/reports/ReportTabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Dialog } from '@headlessui/react';

const CHART_COLORS = {
  income: '#087E8B',
  expenses: '#D9A566',
  savings: '#4CAF50',
  balance: '#9C27B0'
};

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [analysisView, setAnalysisView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const now = new Date();
    let from: Date;
    let to: Date = endOfDay(now);
    
    switch (selectedPeriod) {
      case 'week':
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case 'month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'quarter':
        from = startOfQuarter(now);
        to = endOfQuarter(now);
        break;
      case 'year':
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case 'all':
        from = new Date(2000, 0, 1); // Far in the past
        to = now;
        break;
      case 'custom':
        setIsCustomRange(true);
        return; // Don't update the date range here
      default:
        from = startOfMonth(now);
        to = endOfMonth(now);
    }
    
    setDateRange({ from, to });
    setIsCustomRange(false);
  }, [selectedPeriod]);

  // Fetch and validate transactions
  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });
  
  // Validate transactions before use
  const validAllTransactions = useMemo(() => {
    return Array.isArray(allTransactions) ? allTransactions.filter(t => t && t.date instanceof Date) : [];
  }, [allTransactions]);
  
  // Filter transactions by date range
  const transactions = useMemo(() => {
    return validAllTransactions.filter(transaction => {
      const transactionDate = transaction.date;
      return (
        isAfter(transactionDate, startOfDay(dateRange.from)) && 
        isBefore(transactionDate, endOfDay(dateRange.to))
      );
    });
  }, [validAllTransactions, dateRange]);
  
  const categoryData = useMemo(() => getExpensesByCategory(transactions), [transactions]);
  const timelineData = useMemo(() => generateSpendingTrendData(transactions), [transactions]);
  
  const weeklyData = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: dateRange.from,
      end: dateRange.to
    });
    
    const dailyData = days.map(day => {
      return {
        date: day,
        income: 0,
        expenses: 0,
        balance: 0,
        formattedDate: format(day, 'yyyy-MM-dd')
      };
    });
    
    transactions.forEach(transaction => {
      if (!transaction.date) return;
      
      const dateStr = format(transaction.date, 'yyyy-MM-dd');
      const dayData = dailyData.find(d => d.formattedDate === dateStr);
      
      if (dayData) {
        if (transaction.type === 'income' && typeof transaction.amount === 'number') {
          dayData.income += transaction.amount;
        } else if (transaction.type === 'expense' && typeof transaction.amount === 'number') {
          dayData.expenses += transaction.amount;
        }
        dayData.balance = dayData.income - dayData.expenses;
      }
    });
    
    const weekMap = new Map();
    
    dailyData.forEach(day => {
      const weekStart = format(startOfWeek(day.date), 'MMM d');
      const weekEnd = format(endOfWeek(day.date), 'MMM d');
      const weekKey = `${weekStart} - ${weekEnd}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          name: weekKey,
          income: 0,
          expenses: 0,
          balance: 0,
          date: day.date,
        });
      }
      
      const weekData = weekMap.get(weekKey);
      weekData.income += day.income;
      weekData.expenses += day.expenses;
      weekData.balance = weekData.income - weekData.expenses;
    });
    
    return Array.from(weekMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions, dateRange]);
  
  const dailyDataThisWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return weekDays.map(day => {
      const dayTransactions = transactions.filter(t => {
        if (!t.date) return false;
        return format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      const income = dayTransactions
        .filter(t => t.type === 'income' && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const expenses = dayTransactions
        .filter(t => t.type === 'expense' && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM dd'),
        income,
        expenses,
        balance: income - expenses
      };
    });
  }, [transactions]);
  
  const monthlyData = useMemo(() => {
    const monthMap = new Map();
    
    transactions.forEach(transaction => {
      if (!transaction.date) return;
      
      const monthKey = format(transaction.date, 'MMM yyyy');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          name: monthKey,
          income: 0,
          expenses: 0,
          balance: 0,
          date: startOfMonth(transaction.date),
        });
      }
      
      const monthData = monthMap.get(monthKey);
      if (transaction.type === 'income' && typeof transaction.amount === 'number') {
        monthData.income += transaction.amount;
      } else if (transaction.type === 'expense' && typeof transaction.amount === 'number') {
        monthData.expenses += transaction.amount;
      }
      monthData.balance = monthData.income - monthData.expenses;
    });
    
    return Array.from(monthMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions]);

  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: dateRange.from,
      end: dateRange.to
    });
    
    return days.map(day => {
      const dayTransactions = transactions.filter(t => {
        if (!t.date) return false;
        return format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      const income = dayTransactions
        .filter(t => t.type === 'income' && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const expenses = dayTransactions
        .filter(t => t.type === 'expense' && typeof t.amount === 'number')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        name: format(day, 'MMM d'),
        income,
        expenses,
        balance: income - expenses
      };
    });
  }, [transactions, dateRange]);

  const dailyExpenseBarData = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
      const dayExpenses = transactions
        .filter(t => {
          if (!t.date) return false;
          return t.type === 'expense' && 
            typeof t.amount === 'number' && 
            format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        date: day,
        label: format(day, 'MMM d'),
        expenses: dayExpenses,
      };
    });
  }, [transactions, dateRange]);

  const selectedDayExpenses = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter(t => {
      if (!t.date) return false;
      return t.type === 'expense' && 
        format(t.date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
    });
  }, [selectedDay, transactions]);

  const categoryColors = ['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D', '#BCA88E', '#8FB9AA', '#F28B66'];

  const financialSummary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense' && typeof t.amount === 'number')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    const balance = income - expenses;
    
    // Calculate the number of days up to today or the end date, whichever is earlier
    const today = new Date();
    const effectiveEndDate = isFuture(dateRange.to) ? today : dateRange.to;
    const days = Math.max(1, Math.round((effectiveEndDate.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      income,
      expenses,
      balance,
      dailyAvgIncome: income / days,
      dailyAvgExpenses: expenses / days,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0
    };
  }, [transactions, dateRange]);

  const prepareExportData = () => {
    const exportData = {
      reportPeriod: `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      summary: {
        totalIncome: timelineData.reduce((sum, item) => sum + (item.income || 0), 0),
        totalExpenses: timelineData.reduce((sum, item) => sum + (item.expenses || 0), 0),
      },
      categories: categoryData,
      transactions: transactions.map(t => ({
        date: format(t.date, 'yyyy-MM-dd'),
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        merchant: t.merchant
      })),
      timelineData,
      weeklyAnalysis: weeklyData
    };
    
    return exportData;
  };

  const convertToCSV = (data: any) => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Merchant'];
    
    let csv = headers.join(',') + '\n';
    
    data.transactions.forEach((item: any) => {
      const row = [
        item.date,
        item.type,
        item.category,
        item.amount,
        item.description ? `"${item.description.replace(/"/g, '""')}"` : '',
        item.merchant ? `"${item.merchant.replace(/"/g, '""')}"` : ''
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };

  const handleDownload = () => {
    const data = prepareExportData();
    
    let blob: Blob;
    let filename = `financial-report-${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (exportFormat) {
      case 'csv':
        const csvData = convertToCSV(data);
        blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        filename += '.csv';
        break;
      case 'pdf':
        toast.info("PDF export would require a PDF generation library. Consider using jsPDF or similar library.");
        setShowExportOptions(false);
        return;
      case 'json':
      default:
        const jsonString = JSON.stringify(data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        filename += '.json';
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Report downloaded as ${exportFormat.toUpperCase()}`);
    setShowExportOptions(false);
  };

  const handlePrint = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        main, main * {
          visibility: visible;
        }
        header, .print-hide {
          display: none !important;
        }
        main {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    window.print();
    
    document.head.removeChild(style);
    toast.success("Printing report");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Financial Report',
        text: `Financial report for ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`,
        url: window.location.href,
      })
        .then(() => toast.success("Shared successfully"))
        .catch((error) => {
          console.error("Share error:", error);
          if (error.name !== 'AbortError') {
            toast.error("Error sharing: " + error.message);
          }
        });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Report URL copied to clipboard"))
        .catch(() => toast.error("Failed to copy URL"));
    }
  };

  const formatDateDisplay = () => {
    if (isCustomRange) {
      return `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    
    switch (selectedPeriod) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'quarter':
        return 'This Quarter';
      case 'year':
        return 'This Year';
      case 'all':
        return 'All Time';
      default:
        return 'Selected Period';
    }
  };

  const hasNextData = useMemo(() => {
    let nextPeriodStart: Date;
    let nextPeriodEnd: Date;

    switch (selectedPeriod) {
      case 'week':
        nextPeriodStart = addWeeks(dateRange.to, 1);
        nextPeriodEnd = endOfWeek(nextPeriodStart);
        break;
      case 'month':
        nextPeriodStart = addMonths(dateRange.to, 1);
        nextPeriodEnd = endOfMonth(nextPeriodStart);
        break;
      case 'quarter':
        nextPeriodStart = addQuarters(dateRange.to, 1);
        nextPeriodEnd = endOfQuarter(nextPeriodStart);
        break;
      case 'year':
        nextPeriodStart = addYears(dateRange.to, 1);
        nextPeriodEnd = endOfYear(nextPeriodStart);
        break;
      default:
        nextPeriodStart = addMonths(dateRange.to, 1);
        nextPeriodEnd = endOfMonth(nextPeriodStart);
    }

    // Don't allow navigation to future periods
    if (isFuture(nextPeriodStart)) return false;

    return validAllTransactions.some(transaction => 
      isAfter(transaction.date, dateRange.to) && 
      isBefore(transaction.date, nextPeriodEnd)
    );
  }, [validAllTransactions, dateRange, selectedPeriod]);

  const hasPreviousData = useMemo(() => {
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (selectedPeriod) {
      case 'week':
        previousPeriodStart = startOfWeek(subWeeks(dateRange.from, 1));
        previousPeriodEnd = dateRange.from;
        break;
      case 'month':
        previousPeriodStart = startOfMonth(subMonths(dateRange.from, 1));
        previousPeriodEnd = dateRange.from;
        break;
      case 'quarter':
        previousPeriodStart = startOfQuarter(subQuarters(dateRange.from, 1));
        previousPeriodEnd = dateRange.from;
        break;
      case 'year':
        previousPeriodStart = startOfYear(subYears(dateRange.from, 1));
        previousPeriodEnd = dateRange.from;
        break;
      default:
        previousPeriodStart = startOfMonth(subMonths(dateRange.from, 1));
        previousPeriodEnd = dateRange.from;
    }

    return validAllTransactions.some(transaction => 
      isAfter(transaction.date, previousPeriodStart) && 
      isBefore(transaction.date, previousPeriodEnd)
    );
  }, [validAllTransactions, dateRange, selectedPeriod]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <span className="text-muted-foreground">
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </span>
        </div>
        
        <PeriodSelect
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setShowExportOptions={setShowExportOptions}
          handlePrint={handlePrint}
          handleShare={handleShare}
          hasNextData={hasNextData}
          hasPreviousData={hasPreviousData}
        />
      </div>
      
      <ExportOptions
        showExportOptions={showExportOptions}
        setShowExportOptions={setShowExportOptions}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        handleDownload={handleDownload}
        isMobile={isMobile}
      />
      
      <MetricCards
        financialSummary={financialSummary}
        formatDateDisplay={formatDateDisplay}
      />
      
      {/* Daily Expenses Bar Chart */}
      <div className="bg-white dark:bg-muted rounded-lg shadow p-2 sm:p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">Daily Expenses</h2>
        <ResponsiveContainer width="100%" height={isMobile ? 160 : 300}>
          <BarChart
            data={dailyExpenseBarData}
            margin={{ top: 10, right: 10, left: 0, bottom: isMobile ? 10 : 20 }}
            onClick={e => {
              if (e && e.activeLabel) {
                const clickedDay = dailyExpenseBarData.find(d => d.label === e.activeLabel);
                if (clickedDay) {
                  setSelectedDay(clickedDay.date);
                  setShowDayModal(true);
                }
              }
            }}
          >
            <XAxis dataKey="label" tick={{ fontSize: isMobile ? 10 : 12 }} />
            <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Expenses']}
              labelFormatter={label => `Date: ${label}`}
              contentStyle={{
                background: 'var(--background)',
                borderRadius: 8,
                border: '1px solid var(--muted)',
                color: 'var(--foreground)'
              }}
            />
            <Bar dataKey="expenses" fill="#F9627D" radius={[4, 4, 0, 0]}>
              {dailyExpenseBarData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground mt-2">
          Click a bar to view detailed expenses for that day.
        </div>
      </div>

      {/* Day Expense Details Modal */}
      <Dialog open={showDayModal} onClose={() => setShowDayModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
          <div className="bg-white dark:bg-muted rounded-lg shadow-lg max-w-md w-full mx-auto z-10 p-6 relative">
            <Dialog.Title className="text-lg font-bold mb-2">
              Expenses on {selectedDay ? format(selectedDay, 'MMM d, yyyy') : ''}
            </Dialog.Title>
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowDayModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            {selectedDayExpenses.length === 0 ? (
              <div className="text-muted-foreground">No expenses recorded for this day.</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {selectedDayExpenses.map((exp, idx) => (
                  <li key={idx} className="py-2 flex flex-col">
                    <div className="flex justify-between">
                      <span className="font-medium">{exp.category}</span>
                      <span className="text-red-500 font-semibold">${exp.amount.toFixed(2)}</span>
                    </div>
                    {exp.description && (
                      <span className="text-xs text-muted-foreground">{exp.description}</span>
                    )}
                    {exp.merchant && (
                      <span className="text-xs text-muted-foreground">Merchant: {exp.merchant}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Dialog>
      
      <ReportTabs
        isLoading={isLoading}
        analysisView={analysisView}
        setAnalysisView={setAnalysisView}
        dailyData={dailyData}
        weeklyData={weeklyData}
        monthlyData={monthlyData}
        categoryData={categoryData}
        categoryColors={categoryColors}
        chartColors={CHART_COLORS}
        formatDateDisplay={formatDateDisplay}
        transactions={transactions}
      />
    </div>
  );
}
