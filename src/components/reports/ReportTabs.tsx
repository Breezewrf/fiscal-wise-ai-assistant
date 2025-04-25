import React, { useState } from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";

interface ReportTabsProps {
  isLoading: boolean;
  analysisView: 'daily' | 'weekly' | 'monthly';
  setAnalysisView: (view: 'daily' | 'weekly' | 'monthly') => void;
  dailyData: any[];
  weeklyData: any[];
  monthlyData: any[];
  categoryData: any[];
  categoryColors: string[];
  chartColors: {
    income: string;
    expenses: string;
    balance: string;
  };
  formatDateDisplay: () => string;
  transactions: any[];
}

export function ReportTabs({
  isLoading,
  analysisView,
  setAnalysisView,
  dailyData,
  weeklyData,
  monthlyData,
  categoryData,
  categoryColors,
  chartColors,
  formatDateDisplay,
  transactions
}: ReportTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  return (
    <Tabs defaultValue="overview">
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
              <Button 
                variant="outline" 
                size="sm"
                className={analysisView === 'monthly' ? "bg-primary/10" : ""}
                onClick={() => setAnalysisView('monthly')}
              >
                <BarChartHorizontal className="h-4 w-4 mr-1" />
                Monthly
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading financial data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <ChartView 
                    analysisView={analysisView}
                    dailyData={dailyData}
                    weeklyData={weeklyData}
                    monthlyData={monthlyData}
                    chartColors={chartColors}
                  />
                  <CategoryChart 
                    categoryData={categoryData}
                    categoryColors={categoryColors}
                    onCategorySelect={setSelectedCategory}
                    selectedCategory={selectedCategory}
                  />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Categories Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {categoryData.map((category, index) => (
                        <div
                          key={category.name}
                          className={cn(
                            "flex items-center justify-between p-2 cursor-pointer hover:bg-muted rounded",
                            selectedCategory === category.name && "bg-muted"
                          )}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setShowTransactionDetails(true);
                          }}
                        >
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
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {selectedCategory && (
        <TransactionDetailsDialog
          open={showTransactionDetails}
          onOpenChange={setShowTransactionDetails}
          transactions={transactions.filter(t => t.category === selectedCategory)}
          category={selectedCategory}
        />
      )}
    </Tabs>
  );
}

interface ChartViewProps {
  analysisView: 'daily' | 'weekly' | 'monthly';
  dailyData: any[];
  weeklyData: any[];
  monthlyData: any[];
  chartColors: {
    income: string;
    expenses: string;
    balance: string;
  };
}

function ChartView({ analysisView, dailyData, weeklyData, monthlyData, chartColors }: ChartViewProps) {
  const getData = () => {
    switch (analysisView) {
      case 'daily':
        return dailyData;
      case 'weekly':
        return weeklyData;
      case 'monthly':
        return monthlyData;
      default:
        return dailyData;
    }
  };

  return (
    <div className="h-[400px] w-full">
      <ChartContainer
        className="h-[400px]"
        config={{
          income: { color: chartColors.income },
          expenses: { color: chartColors.expenses },
          balance: { color: chartColors.balance }
        }}
      >
        <AreaChart
          data={getData()}
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
      </ChartContainer>
    </div>
  );
}

interface CategoryChartProps {
  categoryData: any[];
  categoryColors: string[];
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
}

function CategoryChart({ categoryData, categoryColors, onCategorySelect, selectedCategory }: CategoryChartProps) {
  return (
    <div className="h-[400px] w-full">
      {categoryData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-muted-foreground">No expense data available for this period</p>
        </div>
      ) : (
        <ChartContainer
          className="h-[400px]"
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
              onClick={(_, index) => onCategorySelect(categoryData[index].name)}
            >
              {categoryData.slice(0, 8).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={categoryColors[index % categoryColors.length]}
                  opacity={selectedCategory === entry.name ? 1 : 0.7}
                />
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
