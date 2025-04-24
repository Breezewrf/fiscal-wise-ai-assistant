import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, Printer, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, addWeeks, addQuarters, addYears, subQuarters, subYears, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
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

  const handlePrevious = () => {
    const now = new Date();
    let newFrom: Date;
    let newTo: Date;

    switch (selectedPeriod) {
      case 'week':
        newFrom = startOfWeek(subWeeks(dateRange.from, 1));
        newTo = endOfWeek(subWeeks(dateRange.to, 1));
        break;
      case 'month':
        newFrom = startOfMonth(subMonths(dateRange.from, 1));
        newTo = endOfMonth(subMonths(dateRange.to, 1));
        break;
      case 'quarter':
        newFrom = startOfQuarter(subQuarters(dateRange.from, 1));
        newTo = endOfQuarter(subQuarters(dateRange.to, 1));
        break;
      case 'year':
        newFrom = startOfYear(subYears(dateRange.from, 1));
        newTo = endOfYear(subYears(dateRange.to, 1));
        break;
      default:
        newFrom = startOfMonth(subMonths(dateRange.from, 1));
        newTo = endOfMonth(subMonths(dateRange.to, 1));
    }

    setDateRange({ from: newFrom, to: newTo });
  };

  const handleNext = () => {
    const now = new Date();
    let newFrom: Date;
    let newTo: Date;

    switch (selectedPeriod) {
      case 'week':
        newFrom = startOfWeek(addWeeks(dateRange.from, 1));
        newTo = endOfWeek(addWeeks(dateRange.to, 1));
        break;
      case 'month':
        newFrom = startOfMonth(addMonths(dateRange.from, 1));
        newTo = endOfMonth(addMonths(dateRange.to, 1));
        break;
      case 'quarter':
        newFrom = startOfQuarter(addQuarters(dateRange.from, 1));
        newTo = endOfQuarter(addQuarters(dateRange.to, 1));
        break;
      case 'year':
        newFrom = startOfYear(addYears(dateRange.from, 1));
        newTo = endOfYear(addYears(dateRange.to, 1));
        break;
      default:
        newFrom = startOfMonth(addMonths(dateRange.from, 1));
        newTo = endOfMonth(addMonths(dateRange.to, 1));
    }

    setDateRange({ from: newFrom, to: newTo });
  };

  const getNavigationButtonTooltip = (direction: 'previous' | 'next') => {
    if (direction === 'previous' && !hasPreviousData) {
      return "No data available for previous period";
    }
    if (direction === 'next' && !hasNextData) {
      return "No data available for next period";
    }

    const period = selectedPeriod === 'week' ? 'week' :
                  selectedPeriod === 'month' ? 'month' :
                  selectedPeriod === 'quarter' ? 'quarter' :
                  selectedPeriod === 'year' ? 'year' : 'period';

    return `View ${direction} ${period}`;
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
                onClick={handlePrevious}
                disabled={!hasPreviousData}
                title={`Previous ${selectedPeriod}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {getNavigationButtonTooltip('previous')}
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
                onClick={handleNext}
                disabled={!hasNextData}
                title={`Next ${selectedPeriod}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {getNavigationButtonTooltip('next')}
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
