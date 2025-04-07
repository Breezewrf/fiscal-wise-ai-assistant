
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
  Legend,
  AreaChart,
  Area
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
import { generateMockTransactions, getExpensesByCategory } from '@/lib/mock-data';
import { toast } from 'sonner';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const transactions = generateMockTransactions(90);
  const categoryData = getExpensesByCategory(transactions);
  
  // Mock data for reports
  const timelineData = [
    { name: 'Jan', income: 4000, expenses: 2400 },
    { name: 'Feb', income: 3000, expenses: 2210 },
    { name: 'Mar', income: 2000, expenses: 1800 },
    { name: 'Apr', income: 2780, expenses: 1908 },
    { name: 'May', income: 1890, expenses: 1600 },
    { name: 'Jun', income: 2390, expenses: 1700 },
    { name: 'Jul', income: 3490, expenses: 2300 },
    { name: 'Aug', income: 3200, expenses: 2100 },
    { name: 'Sep', income: 2800, expenses: 1800 },
    { name: 'Oct', income: 2400, expenses: 1500 },
    { name: 'Nov', income: 3000, expenses: 2000 },
    { name: 'Dec', income: 4200, expenses: 2600 },
  ];

  const savingsData = [
    { name: 'Jan', value: 1600 },
    { name: 'Feb', value: 790 },
    { name: 'Mar', value: 200 },
    { name: 'Apr', value: 872 },
    { name: 'May', value: 290 },
    { name: 'Jun', value: 690 },
    { name: 'Jul', value: 1190 },
    { name: 'Aug', value: 1100 },
    { name: 'Sep', value: 1000 },
    { name: 'Oct', value: 900 },
    { name: 'Nov', value: 1000 },
    { name: 'Dec', value: 1600 },
  ];

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
          <TabsTrigger value="savings">Savings</TabsTrigger>
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
                        formatter={(value) => [`$${value.toFixed(2)}`, undefined]}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Savings Rate</span>
                      <span className="text-sm font-medium text-green-500">23%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Expense Ratio</span>
                      <span className="text-sm font-medium text-amber-500">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Debt-to-Income</span>
                      <span className="text-sm font-medium text-blue-500">12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                        formatter={(value) => [`$${value.toFixed(2)}`, undefined]}
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
                              width: `${(category.amount / categoryData[0].amount) * 100}%`,
                              backgroundColor: categoryColors[index % categoryColors.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="savings">
          <Card>
            <CardHeader>
              <CardTitle>Savings Trend</CardTitle>
              <CardDescription>
                Track your savings progress over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={savingsData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, "Savings"]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#087E8B" fill="#087E8B" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground">Total Savings</h3>
                  <p className="text-3xl font-bold mt-2">$10,232</p>
                  <p className="text-sm text-green-500 mt-1">+18% from last year</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground">Savings Rate</h3>
                  <p className="text-3xl font-bold mt-2">23%</p>
                  <p className="text-sm text-green-500 mt-1">+5% from last year</p>
                </div>
                
                <div className="border rounded-lg p-4 text-center">
                  <h3 className="text-lg font-medium text-muted-foreground">Savings Goal</h3>
                  <p className="text-3xl font-bold mt-2">68%</p>
                  <p className="text-sm text-muted-foreground mt-1">$10,232 of $15,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
