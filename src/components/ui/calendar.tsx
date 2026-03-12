"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6 bg-background", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-lg font-black uppercase tracking-tighter text-primary italic",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-10 bg-transparent p-0 opacity-100 border-2 border-muted hover:border-primary/30 hover:bg-primary/5 transition-all rounded-xl"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "text-muted-foreground rounded-md w-10 font-black text-[10px] uppercase tracking-widest",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary/5 first:[&:has([aria-selected])]:rounded-l-2xl last:[&:has([aria-selected])]:rounded-r-2xl",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-2xl [&:has(>.day-range-start)]:rounded-l-2xl"
            : "[&:has([aria-selected])]:rounded-2xl"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-bold aria-selected:opacity-100 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
        ),
        day_range_start: "day-range-start bg-primary text-primary-foreground rounded-2xl shadow-lg scale-110 z-30 font-black",
        day_range_end: "day-range-end bg-primary text-primary-foreground rounded-2xl shadow-lg scale-110 z-30 font-black",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-black",
        day_today: "bg-accent/10 text-accent border-2 border-accent/20",
        day_outside:
          "day-outside text-muted-foreground/30 aria-selected:bg-accent/5 aria-selected:text-muted-foreground/30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-primary font-bold",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-6 w-6 text-primary", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-6 w-6 text-primary", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
