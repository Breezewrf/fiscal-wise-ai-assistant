
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, BarChartHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { 
  ComposedChart, CartesianGrid, XAxis, YAxis, 
  Bar, Line, PieChart, Pie, Cell, Area, AreaChart 
} from 'recharts';
import { cn } from "@/lib/utils";

interface ReportTabsProps {
  isLoading: boolean;
  analysisView: 'daily' | 'weekly';
  setAnalysisView: (view: 'daily' | 'weekly') => void;
  timelineData: any[];
  weeklyData: any[];
  categoryData: any[];
  categoryColors: string[];
  chartColors: {
    income: string;
    expenses: string;
    balance: string;
  };
  formatDateDisplay: () => string;
}

export function ReportTabs({
  isLoading,
  analysisView,
  setAnalysisView,
  timelineData,
  weeklyData,
  categoryData,
  categoryColors,
  chartColors,
  formatDateDisplay
}: ReportTabsProps) {
  return (
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
                <BarChartHorizontal className="h-4 w-4 mr-1" />
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
                <ChartView 
                  analysisView={analysisView}
                  timelineData={timelineData}
                  weeklyData={weeklyData}
                  chartColors={chartColors}
                />
                <CategoryChart 
                  categoryData={categoryData}
                  categoryColors={categoryColors}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="income-expense" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses Analysis</CardTitle>
            <CardDescription>
              Compare your income and expenses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <p className="text-muted-foreground text-center">Income vs Expense analysis content</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="categories" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Breakdown of your spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <p className="text-muted-foreground text-center">Category analysis content</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="weekly" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Financial Analysis</CardTitle>
            <CardDescription>
              Review your weekly financial patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <p className="text-muted-foreground text-center">Weekly analysis content</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

interface ChartViewProps {
  analysisView: 'daily' | 'weekly';
  timelineData: any[];
  weeklyData: any[];
  chartColors: {
    income: string;
    expenses: string;
    balance: string;
  };
}

function ChartView({ analysisView, timelineData, weeklyData, chartColors }: ChartViewProps) {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer
        className="h-[300px]"
        config={{
          income: { color: chartColors.income },
          expenses: { color: chartColors.expenses },
          balance: { color: chartColors.balance }
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
            <Bar dataKey="income" fill={chartColors.income} />
            <Bar dataKey="expenses" fill={chartColors.expenses} />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke={chartColors.income} 
              dot={false} 
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke={chartColors.expenses} 
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
              stroke={chartColors.income} 
              fill={chartColors.income} 
              fillOpacity={0.2}
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stroke={chartColors.expenses} 
              fill={chartColors.expenses} 
              fillOpacity={0.2}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke={chartColors.balance} 
              fill={chartColors.balance} 
              fillOpacity={0.2}
            />
          </AreaChart>
        )}
      </ChartContainer>
    </div>
  );
}

interface CategoryChartProps {
  categoryData: any[];
  categoryColors: string[];
}

function CategoryChart({ categoryData, categoryColors }: CategoryChartProps) {
  return (
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
  );
}
