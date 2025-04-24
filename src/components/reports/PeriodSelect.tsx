import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, Printer, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PeriodSelectProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  setShowExportOptions: (show: boolean) => void;
  handlePrint: () => void;
  handleShare: () => void;
  hasNextData: boolean;
  hasPreviousData: boolean;
}

export function PeriodSelect({
  selectedPeriod,
  setSelectedPeriod,
  dateRange,
  setDateRange,
  setShowExportOptions,
  handlePrint,
  handleShare,
  hasNextData,
  hasPreviousData
}: PeriodSelectProps) {
  const handleQuickSelect = (type: 'lastWeek' | 'lastMonth' | 'twoMonthsAgo') => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (type) {
      case 'lastWeek':
        from = startOfWeek(subWeeks(now, 1));
        to = endOfWeek(subWeeks(now, 1));
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'twoMonthsAgo':
        from = startOfMonth(subMonths(now, 2));
        to = endOfMonth(subMonths(now, 2));
        break;
    }

    setSelectedPeriod('custom');
    setDateRange({ from, to });
  };

  const handlePreviousMonth = () => {
    const newFrom = subMonths(dateRange.from, 1);
    const newTo = subMonths(dateRange.to, 1);
    setDateRange({ from: newFrom, to: newTo });
  };

  const handleNextMonth = () => {
    const newFrom = addMonths(dateRange.from, 1);
    const newTo = addMonths(dateRange.to, 1);
    setDateRange({ from: newFrom, to: newTo });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
                disabled={!hasPreviousData}
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {hasPreviousData 
              ? "View previous month" 
              : "No data available for previous month"}
          </TooltipContent>
        </Tooltip>

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
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                disabled={!hasNextData}
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {hasNextData 
              ? "View next month" 
              : "No data available for next month"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-1">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickSelect('lastWeek')}
        >
          Last Week
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickSelect('lastMonth')}
        >
          Last Month
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleQuickSelect('twoMonthsAgo')}
        >
          2 Months Ago
        </Button>
      </div>

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
  );
}
