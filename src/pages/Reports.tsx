import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Download, 
  Printer, 
  Share2, 
  Calendar as CalendarIcon, 
  FileDown, 
  Check,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  ChartBarHorizontal,
  ChartLine
} from 'lucide-react';
import { 
  fetchTransactions, 
  getExpensesByCategory,
  generateSpendingTrendData 
} from '@/lib/db/transactions';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { 
  format, 
  isAfter, 
  isBefore, 
  startOfDay, 
  endOfDay, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  eachDayOfInterval,
  formatISO
} from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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
  
  // Generate weekly data
  const weeklyData = useMemo(() => {
    // Map transactions to daily data first
    const days = eachDayOfInterval({ 
      start: dateRange.from,
      end: dateRange.to
    });
    
    // Initialize data for each day
    const dailyData = days.map(day => {
      return {
        date: day,
        income: 0,
        expenses: 0,
        balance: 0,
        formattedDate: format(day, 'yyyy-MM-dd')
      };
    });
    
    // Fill in transaction data
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
    
    // Group by weeks
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
    
    // Convert to array and sort by date
    return Array.from(weekMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions, dateRange]);
  
  // Generate daily data for current week
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

  // Financial summary stats
  const financialSummary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const balance = income - expenses;
    
    // Calculate daily averages
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

  const ExportOptionsContainer = ({ children }: { children: React.ReactNode }) => {
    if (isMobile) {
      return (
        <Drawer open={showExportOptions} onOpenChange={setShowExportOptions}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Export Report</DrawerTitle>
              <DrawerDescription>
                Choose a format to download your report
              </DrawerDescription>
            </DrawerHeader>
            {children}
            <DrawerFooter>
              <Button onClick={handleDownload}>Download</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={showExportOptions} onOpenChange={setShowExportOptions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose a format to download your report
            </DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button onClick={handleDownload}>Download</Button>
            <Button variant="outline" onClick={() => setShowExportOptions(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedPeriod === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange?.from,
                    to: dateRange?.to,
                  }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ 
                        from: range.from, 
                        to: range.to 
                      });
                    }
                  }}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
          
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowExportOptions(true)}
              className="relative"
              aria-label="Download report"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePrint}
              aria-label="Print report"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleShare}
              aria-label="Share report"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <ExportOptionsContainer>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Select format</h4>
            <div className="flex flex-col space-y-1.5">
              <Button 
                variant="outline" 
                className={cn(
                  "justify-start text-left",
                  exportFormat === 'json' && "border-primary"
                )}
                onClick={() => setExportFormat('json')}
              >
                <div className="flex items-center">
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>JSON</span>
                  {exportFormat === 'json' && <Check className="ml-auto h-4 w-4" />}
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className={cn(
                  "justify-start text-left",
                  exportFormat === 'csv' && "border-primary"
                )}
                onClick={() => setExportFormat('csv')}
              >
                <div className="flex items-center">
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>CSV (Excel)</span>
                  {exportFormat === 'csv' && <Check className="ml-auto h-4 w-4" />}
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className={cn(
                  "justify-start text-left",
                  exportFormat === 'pdf' && "border-primary"
                )}
                onClick={() => setExportFormat('pdf')}
              >
                <div className="flex items-center">
                  <FileDown className="mr-2 h-4 w-4" />
                  <span>PDF Document</span>
                  {exportFormat === 'pdf' && <Check className="ml-auto h-4 w-4" />}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </ExportOptionsContainer>
      
      {/* Financial metrics summary cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                ${financialSummary.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg ${financialSummary.dailyAvgIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold">
                ${financialSummary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg ${financialSummary.dailyAvgExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {financialSummary.balance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
              )}
              <div className={cn(
                "text-2xl font-bold",
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Savings Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Percent className="h-5 w-5 text-primary mr-2" />
              <div className="text-2xl font-bold">
                {financialSummary.savingsRate.toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of total income saved
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income-expense">Income vs Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Overview of your financial activity for {formatDateDisplay()}.
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className={analysisView === 'daily' ? "bg-primary/10" : ""}
                  onClick={() => setAnalysisView('daily')}
                >
                  <ChartLine className="h-4 w-4 mr-1" />
                  Daily
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={analysisView === 'weekly' ? "bg-primary/10" : ""}
                  onClick={() => setAnalysisView('weekly')}
                >
                  <ChartBarHorizontal className="h-4 w-4 mr-1" />
                  Weekly
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading financial data...</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-[300px] w-full">
                    <ChartContainer
                      className="h-[300px]"
                      config={{
                        income: { color: CHART_COLORS.income },
                        expenses: { color: CHART_COLORS.expenses },
                        balance: { color: CHART_COLORS.balance }
                      }}
                    >
                      {analysisView === 'daily' ? (
                        <ComposedChart
                          data={timelineData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip 
                            content={({active, payload}) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-medium">{payload[0].payload.name}</div>
                                    {payload.map((entry, index) => (
                                      <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1">
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                          />
                                          {entry.name}:
                                        </span>
                                        <span className="font-medium">
                                          ${Number(entry.value).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="income" fill={CHART_COLORS.income} />
                          <Bar dataKey="expenses" fill={CHART_COLORS.expenses} />
                          <Line 
                            type="monotone" 
                            dataKey="income" 
                            stroke={CHART_COLORS.income} 
                            dot={false} 
                            activeDot={{ r: 8 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="expenses" 
                            stroke={CHART_COLORS.expenses} 
                            dot={false} 
                          />
                        </ComposedChart>
                      ) : (
                        <AreaChart
                          data={weeklyData}
                          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <ChartTooltip 
                            content={({active, payload}) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="font-medium">{payload[0].payload.name}</div>
                                    {payload.map((entry, index) => (
                                      <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                                        <span className="flex items-center gap-1">
                                          <div
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                          />
                                          {entry.name}:
                                        </span>
                                        <span className="font-medium">
                                          ${Number(entry.value).toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="income" 
                            stroke={CHART_COLORS.income} 
                            fill={CHART_COLORS.income} 
                            fillOpacity={0.2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="expenses" 
                            stroke={CHART_COLORS.expenses} 
                            fill={CHART_COLORS.expenses} 
                            fillOpacity={0.2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke={CHART_COLORS.balance} 
                            fill={CHART_COLORS.balance} 
                            fillOpacity={0.2}
                          />
                        </AreaChart>
                      )}
                    </ChartContainer>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    {categoryData.length === 0 ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <p className="text-muted-foreground">No expense data available for this period</p>
                      </div>
                    ) : (
                      <ChartContainer
                        className="h-[300px]"
                        config={Object.fromEntries(
                          categoryData.slice(0, 8).map((cat, i) => [
                            cat.name,
                            { color: categoryColors[i % categoryColors.length] }
                          ])
                        )}
                      >
                        <PieChart>
                          <Pie
                            data={categoryData.slice(0, 8)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="amount"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={({active, payload}) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid gap-2">
                                      {payload.map((entry, index) => (
                                        <div key={`item-${index}`} className="flex items-center justify-between gap-2">
                                          <span className="flex items-center gap-1">
                                            <div
                                              className="h-2 w-2 rounded-full"
                                              style={{ backgroundColor: entry.color }}
                                            />
                                            {entry.name}:
                                          </span>
                                          <span className="font-medium">
                                            ${Number(entry.value).toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ChartContainer>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <
