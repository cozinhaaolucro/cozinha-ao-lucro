import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type UnifiedCalendarProps = React.ComponentProps<typeof DayPicker>;

function UnifiedCalendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: UnifiedCalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-semibold tracking-wide text-foreground/80",
                nav: "space-x-1 flex items-center bg-muted/30 rounded-full p-0.5",
                nav_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-7 w-7 bg-transparent p-0 text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm rounded-full transition-all"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex mb-2",
                head_cell:
                    "text-muted-foreground rounded-lg w-9 font-medium text-[0.7rem] uppercase tracking-wider",
                row: "flex w-full mt-2 gap-1",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-muted hover:text-foreground transition-all duration-200"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-[#5F98A1] text-white hover:bg-[#5F98A1] hover:text-white shadow-sm font-semibold focus:bg-[#5F98A1] focus:text-white",
                day_today: "bg-transparent text-foreground ring-2 ring-primary ring-offset-2 font-semibold",
                day_outside:
                    "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-20",
                day_range_middle:
                    "aria-selected:bg-[#d7d9db] aria-selected:text-accent-foreground",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
            }}
            {...props}
        />
    );
}
UnifiedCalendar.displayName = "UnifiedCalendar";

export { UnifiedCalendar };
