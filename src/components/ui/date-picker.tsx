
import * as React from "react"
import { format, addDays, subDays } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date) => void
  className?: string
  showNavigation?: boolean
}

export function DatePicker({ 
  date, 
  onDateChange, 
  className,
  showNavigation = false
}: DatePickerProps) {
  const handlePreviousDay = () => {
    if (date && onDateChange) {
      onDateChange(subDays(date, 1));
    }
  };

  const handleNextDay = () => {
    if (date && onDateChange) {
      onDateChange(addDays(date, 1));
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showNavigation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePreviousDay}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous day</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous day</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[180px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {showNavigation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNextDay}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next day</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next day</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
