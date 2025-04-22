import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format, isAfter, isBefore, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachDayOfInterval } from "date-fns";
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTransactions, getExpensesByCategory, generateSpendingTrendData } from '@/lib/db/transactions';
import { ExportOptions } from '@/components/reports/ExportOptions';
import { MetricCards } from '@/components/reports/MetricCards';
import { PeriodSelect } from '@/components/reports/PeriodSelect';
import { ReportTabs } from '@/components/reports/ReportTabs';

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
  const [analysisView, setAnalysisView] = useState<'daily' | 'weekly'>('daily');
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

  const { data: allTransactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });
  
  const transactions = allTransactions.filter(transaction => {
    const transactionDate = transaction.date;
    return (
      isAfter(transactionDate, startOfDay(dateRange.from)) && 
      isBefore(transactionDate, endOfDay(dateRange.to))
    );
  });
  
  const categoryData = getExpensesByCategory(transactions);
  const timelineData = generateSpendingTrendData(transactions);
  
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
      const dateStr = format(transaction.date, 'yyyy-MM-dd');
      const dayData = dailyData.find(d => d.formattedDate === dateStr);
      
      if (dayData) {
        if (transaction.type === 'income') {
          dayData.income += transaction.amount;
        } else if (transaction.type === 'expense') {
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
    
    const dailyData = weekDays.map(day => {
      const dayTransactions = transactions.filter(t => 
        format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM dd'),
        income,
        expenses,
        balance: income - expenses
      };
    });
    
    return dailyData;
  }, [transactions]);
  
  const categoryColors = ['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D', '#BCA88E', '#8FB9AA', '#F28B66'];

  const financialSummary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const balance = income - expenses;
    
    const days = Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)));
    
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

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        
        <PeriodSelect
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          setShowExportOptions={setShowExportOptions}
          handlePrint={handlePrint}
          handleShare={handleShare}
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
      
      <ReportTabs
        isLoading={isLoading}
        analysisView={analysisView}
        setAnalysisView={setAnalysisView}
        timelineData={timelineData}
        weeklyData={weeklyData}
        categoryData={categoryData}
        categoryColors={categoryColors}
        chartColors={CHART_COLORS}
        formatDateDisplay={formatDateDisplay}
      />
    </div>
  );
}
