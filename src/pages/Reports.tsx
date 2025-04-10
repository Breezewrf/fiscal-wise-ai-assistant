
import React, { useState } from 'react';
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
import { Download, Printer, Share2 } from 'lucide-react';
import { 
  fetchTransactions, 
  getExpensesByCategory,
  generateSpendingTrendData 
} from '@/lib/db/transactions';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions
  });
  
  const categoryData = getExpensesByCategory(transactions);
  const timelineData = generateSpendingTrendData(transactions);
  
  const categoryColors = ['#087E8B', '#B0D9A2', '#D9A566', '#C9AADB', '#F9627D', '#BCA88E', '#8FB9AA', '#F28B66'];

  const handleDownload = () => {
    toast("Report downloaded successfully");
  };

  const handlePrint = () => {
    toast("Preparing report for printing");
  };

  const handleShare = () => {
    toast("Share dialog opened");
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
            </SelectContent>
          </Select>
          
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
                Overview of your financial activity for {selectedPeriod === 'month' ? 'this month' : selectedPeriod === 'year' ? 'this year' : 'the selected period'}.
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
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timelineData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, undefined]}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#087E8B" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#D9A566" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    {categoryData.length === 0 ? (
                      <div className="h-full w-full flex items-center justify-center">
                        <p className="text-muted-foreground">No expense data available</p>
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
                  <p className="text-muted-foreground">No categories found</p>
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
                Compare your income and expenses over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading financial data...</p>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timelineData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, undefined]}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#087E8B" />
                      <Bar dataKey="expenses" name="Expenses" fill="#D9A566" />
                    </BarChart>
                  </ResponsiveContainer>
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
                Detailed breakdown of your expenses by category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">Loading category data...</p>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground">No expense data available</p>
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
