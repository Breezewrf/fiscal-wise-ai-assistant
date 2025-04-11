import React, { useState, useEffect } from 'react';
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
  Legend
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
import { Download, Printer, Share2, Calendar as CalendarIcon } from 'lucide-react';
import { 
  fetchTransactions, 
  getExpensesByCategory,
  generateSpendingTrendData 
} from '@/lib/db/transactions';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, eachDayOfInterval, isSameDay, getDate } from "date-fns";
import { InteractiveChart } from '@/components/ui/interactive-chart';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [dateRange, setDateRange] = useState<{from: Date, to: Date}>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [detailedTimelineData, setDetailedTimelineData] = useState<any[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);
  
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

  useEffect(() => {
    if (transactions.length === 0) {
      setDetailedTimelineData([]);
      return;
    }

    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    const dailyData = days.map(day => {
      const dayTransactions = transactions.filter(t => 
        isSameDay(t.date, day)
      );
      
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        date: day,
        name: format(day, 'MMM d'),
        income,
        expenses
      };
    });
    
    setDetailedTimelineData(dailyData);
  }, [transactions, dateRange]);

  const handleRangeSelect = (startIndex: number, endIndex: number) => {
    setShowDetailedView(true);
  };

  const categoryColors = ['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D', '#BCA88E', '#8FB9AA', '#F28B66'];

  const handleDownload = () => {
    const jsonData = {
      summary: {
        dateRange: `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
        categoryData,
        timelineData
      }
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast("Report downloaded successfully");
  };

  const handlePrint = () => {
    window.print();
    toast("Printing report");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Financial Report',
        text: `Financial report for ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`,
        url: window.location.href,
      })
        .then(() => toast("Shared successfully"))
        .catch((error) => toast("Error sharing: " + error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast("Report URL copied to clipboard"))
        .catch(() => toast("Failed to copy URL"));
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

  const chartConfig = {
    income: {
      label: "Income",
      color: "#087E8B"
    },
    expenses: {
      label: "Expenses",
      color: "#D9A566"
    }
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
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income-expense">Income vs Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                Overview of your financial activity for {formatDateDisplay()}.
                {showDetailedView && " Drag to zoom in or click Reset Zoom to view all data."}
                {!showDetailedView && " Drag on the chart to zoom in on specific periods."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading financial data...</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-[300px] w-full">
                    <InteractiveChart 
                      data={timelineData}
                      config={chartConfig}
                      onRangeSelect={handleRangeSelect}
                      className="h-full w-full"
                    />
                  </div>
                  
                  <div className="h-[300px] w-full">
                    {categoryData.length === 0 ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <p className="text-muted-foreground">No expense data available for this period</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
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
                          <Tooltip 
                            formatter={(value) => {
                              if (typeof value === 'number') {
                                return [`$${value.toFixed(2)}`, undefined];
                              }
                              return [`$${value}`, undefined];
                            }}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading categories...</p>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-muted-foreground">No categories found for this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryData.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        />
                        <span>{category.name}</span>
                      </div>
                      <span className="font-medium">${category.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="income-expense">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>
                Compare your income and expenses for {formatDateDisplay()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading financial data...</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <InteractiveChart 
                    data={timelineData}
                    config={chartConfig}
                    height={400}
                    className="h-full w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>
                Detailed breakdown of your expenses by category for {formatDateDisplay()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading category data...</p>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No expense data available for this period</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="amount"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => {
                            if (typeof value === 'number') {
                              return [`$${value.toFixed(2)}`, undefined];
                            }
                            return [`$${value}`, undefined];
                          }}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <div className="space-y-6">
                      {categoryData.slice(0, 8).map((category, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <span className="font-medium">${category.amount.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${categoryData.length > 0 ? (category.amount / categoryData[0].amount) * 100 : 0}%`,
                                backgroundColor: categoryColors[index % categoryColors.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
