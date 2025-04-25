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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  return (
    <Tabs defaultValue="overview">
      <TabsContent value="overview" className="space-y-4 md:space-y-6">
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                Overview of your financial activity for {formatDateDisplay()}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap w-full md:w-auto gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className={`flex-1 md:flex-none ${analysisView === 'daily' ? "bg-primary/10" : ""}`}
                onClick={() => setAnalysisView('daily')}
              >
                <ChartLine className="h-4 w-4 mr-1" />
                Daily
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex-1 md:flex-none ${analysisView === 'weekly' ? "bg-primary/10" : ""}`}
                onClick={() => setAnalysisView('weekly')}
              >
                <BarChartHorizontal className="h-4 w-4 mr-1" />
                Weekly
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`flex-1 md:flex-none ${analysisView === 'monthly' ? "bg-primary/10" : ""}`}
                onClick={() => setAnalysisView('monthly')}
              >
                <BarChartHorizontal className="h-4 w-4 mr-1" />
                Monthly
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loading financial data...</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <ScrollArea className="w-full overflow-x-auto">
                    <div className={isMobile ? "min-w-[220px] h-[180px]" : "min-w-[300px] h-[320px]"}>
                      <ChartView 
                        analysisView={analysisView}
                        dailyData={dailyData}
                        weeklyData={weeklyData}
                        monthlyData={monthlyData}
                        chartColors={chartColors}
                        isMobile={isMobile}
                      />
                    </div>
                  </ScrollArea>
                  <ScrollArea className="w-full overflow-x-auto">
                    <div className={isMobile ? "min-w-[220px] h-[180px]" : "min-w-[300px] h-[320px]"}>
                      <CategoryChart 
                        categoryData={categoryData}
                        categoryColors={categoryColors}
                        onCategorySelect={setSelectedCategory}
                        selectedCategory={selectedCategory}
                        isMobile={isMobile}
                      />
                    </div>
                  </ScrollArea>
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
  isMobile: boolean;
}

function ChartView({ analysisView, dailyData, weeklyData, monthlyData, chartColors, isMobile }: ChartViewProps) {
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
    <div className={isMobile ? "h-[180px] w-full" : "h-[320px] w-full"}>
      <ChartContainer
        className={isMobile ? "h-[180px]" : "h-[320px]"}
        config={{
          income: { color: chartColors.income },
          expenses: { color: chartColors.expenses },
          balance: { color: chartColors.balance }
        }}
      >
        <AreaChart
          data={getData()}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          height={isMobile ? 160 : 300}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
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
  isMobile: boolean;
}

function CategoryChart({ categoryData, categoryColors, onCategorySelect, selectedCategory, isMobile }: CategoryChartProps) {
  return (
    <div className={isMobile ? "h-[180px] w-full" : "h-[320px] w-full"}>
      {categoryData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-muted-foreground">No expense data available for this period</p>
        </div>
      ) : (
        <ChartContainer
          className={isMobile ? "h-[180px]" : "h-[320px]"}
          config={Object.fromEntries(
            categoryData.slice(0, 8).map((cat, i) => [
              cat.name,
              { color: categoryColors[i % categoryColors.length] }
            ])
          )}
        >
          <PieChart width={isMobile ? 180 : 320} height={isMobile ? 180 : 320}>
            <Pie
              data={categoryData.slice(0, 8)}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={isMobile ? 36 : 60}
              outerRadius={isMobile ? 54 : 80}
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
