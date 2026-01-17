import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
    date,
    setDate,
    className,
    placeholder = "Selecione uma data"
}: {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    className?: string
    placeholder?: string
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal bg-muted/10 border-input/60 hover:bg-muted/20 hover:border-primary/30 hover:text-foreground shadow-sm",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                />
            </PopoverContent>
        </Popover>
    )
}

export function DateRangePicker({
    date,
    setDate,
    className,
}: {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
}) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-muted/10 border-input/60 hover:bg-muted/20 hover:border-primary/30 hover:text-foreground shadow-sm",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                                    {format(date.to, "dd/MM/y", { locale: ptBR })}
                                </>
                            ) : (
                                <span>Selecione a data final</span>
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}

                        {date?.from && (
                            <div
                                className="ml-auto hover:bg-destructive/10 p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors ml-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDate(undefined);
                                }}
                            >
                                <X className="w-3 h-3" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
