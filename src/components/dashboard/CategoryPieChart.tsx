
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryPieChartProps {
  categoryData: any[];
  categoryColors: string[];
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function CategoryPieChart({ 
  categoryData, 
  categoryColors,
  onCategorySelect,
  selectedCategory 
}: CategoryPieChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className="w-full h-full">
      {categoryData.length === 0 ? (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-muted-foreground">No expense data available for this period</p>
        </div>
      ) : (
        <ChartContainer
          className="w-full h-full"
          config={Object.fromEntries(
            categoryData.slice(0, 8).map((cat, i) => [
              cat.name,
              { color: categoryColors[i % categoryColors.length] }
            ])
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
                onClick={(_, index) => onCategorySelect && onCategorySelect(categoryData[index].name)}
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
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
