
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download, Printer, Share2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PeriodSelectProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  setShowExportOptions: (show: boolean) => void;
  handlePrint: () => void;
  handleShare: () => void;
}

export function PeriodSelect({
  selectedPeriod,
  setSelectedPeriod,
  dateRange,
  setDateRange,
  setShowExportOptions,
  handlePrint,
  handleShare
}: PeriodSelectProps) {
  return (
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
