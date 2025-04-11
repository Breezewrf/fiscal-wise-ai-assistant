
import React, { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { cn } from "@/lib/utils";
import { ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from './chart';
import { format } from 'date-fns';
import { Button } from './button';

interface DataPoint {
  name: string;
  date?: Date;
  [key: string]: any;
}

interface InteractiveChartProps {
  data: DataPoint[];
  config: ChartConfig;
  height?: string | number;
  className?: string;
  onRangeSelect?: (start: number, end: number) => void;
}

export const InteractiveChart = ({
  data,
  config,
  height = 300,
  className,
  onRangeSelect,
}: InteractiveChartProps) => {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [zoomedData, setZoomedData] = useState<DataPoint[]>(data);
  const [zoomed, setZoomed] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const getAxisYDomain = (from: number, to: number, offset: number) => {
    const dataSlice = data.slice(from, to + 1);
    const allValues: number[] = [];
    
    // Collect all numeric values from all series
    Object.keys(config).forEach(key => {
      if (key !== 'name' && key !== 'date') {
        dataSlice.forEach(item => {
          if (typeof item[key] === 'number') {
            allValues.push(item[key]);
          }
        });
      }
    });
    
    if (allValues.length === 0) return [0, 0];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    return [Math.max(0, min - offset), max + offset];
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!e.activeLabel) return;
    setRefAreaLeft(e.activeLabel);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!refAreaLeft || !e.activeLabel) return;
    setRefAreaRight(e.activeLabel);
  };

  const handleMouseUp = () => {
    if (!refAreaLeft || !refAreaRight) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // Ensure refAreaLeft is always before refAreaRight
    const tempRefAreaLeft = data.findIndex(item => item.name === refAreaLeft);
    const tempRefAreaRight = data.findIndex(item => item.name === refAreaRight);
    
    let left = Math.min(tempRefAreaLeft, tempRefAreaRight);
    let right = Math.max(tempRefAreaLeft, tempRefAreaRight);
    
    // If selection is too small, ignore
    if (right - left < 2) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    const [bottom, top] = getAxisYDomain(left, right, (right - left) * 0.05);
    
    // Update zoomed data
    setZoomedData(data.slice(left, right + 1));
    setZoomed(true);
    
    // Notify parent component
    if (onRangeSelect) {
      onRangeSelect(left, right);
    }
    
    // Reset reference areas
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleReset = () => {
    setZoomedData(data);
    setZoomed(false);
  };

  const displayData = zoomed ? zoomedData : data;

  const LineComponents = Object.entries(config).map(([key, itemConfig]) => {
    if (key === 'name' || key === 'date') return null;
    
    const color = itemConfig.theme?.light || itemConfig.color || '#000';
    
    return (
      <Line
        key={key}
        type="monotone"
        dataKey={key}
        name={itemConfig.label || key}
        stroke={color}
        activeDot={{ r: 5 }}
        strokeWidth={2}
      />
    );
  });

  return (
    <div className={cn("relative", className)}>
      {zoomed && (
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-0 right-0 z-10"
          onClick={handleReset}
        >
          Reset Zoom
        </Button>
      )}
      <div style={{ width: '100%', height: height }} ref={chartRef}>
        <ChartContainer config={config} className="h-full">
          <LineChart
            data={displayData}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              allowDataOverflow 
            />
            <YAxis 
              allowDataOverflow 
              domain={['auto', 'auto']}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
            />
            <Legend />
            {LineComponents}
            {refAreaLeft && refAreaRight && (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
                fill="#8884d8"
                fillOpacity={0.3}
              />
            )}
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
};
