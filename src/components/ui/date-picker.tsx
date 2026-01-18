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

// Helper to check for equality
function isSameDateRange(a: DateRange | undefined, b: DateRange | undefined) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.from?.getTime() === b.from?.getTime() && a.to?.getTime() === b.to?.getTime();
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
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(date);
    const [isOpen, setIsOpen] = React.useState(false);

    // Sync internal date when parent date changes (and popover is closed or forcing sync)
    React.useEffect(() => {
        setInternalDate(date);
    }, [date]);

    const handleSelect = (range: DateRange | undefined, selectedDay: Date) => {
        // Enforce "Start Over" on 3rd click (standard flow)
        if (internalDate?.from && internalDate?.to) {
            setInternalDate({ from: selectedDay, to: undefined });
            return;
        }
        setInternalDate(range);
    };

    const handleApply = () => {
        setDate(internalDate);
        setIsOpen(false);
    };

    const handleCancel = () => {
        setInternalDate(date);
        setIsOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Reset to parent state if closed without applying
            setInternalDate(date);
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal bg-muted/10 border-input/60 hover:bg-muted/20 hover:border-primary/30 hover:text-foreground shadow-sm",
                            !internalDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {internalDate?.from ? (
                            internalDate.to ? (
                                <>
                                    {format(internalDate.from, "dd/MM/y", { locale: ptBR })} -{" "}
                                    {format(internalDate.to, "dd/MM/y", { locale: ptBR })}
                                </>
                            ) : (
                                <span>Selecione a data final</span>
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}

                        {internalDate?.from && (
                            <div
                                className="ml-auto hover:bg-destructive/10 p-1 rounded-full text-muted-foreground hover:text-destructive transition-colors ml-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDate(undefined);
                                    setInternalDate(undefined);
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
                        selected={internalDate}
                        onSelect={handleSelect}
                        numberOfMonths={1}
                        locale={ptBR}
                    />
                    <div className="p-3 border-t border-border flex items-center justify-end gap-2 bg-muted/5">
                        <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 text-xs">
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            className="h-8 text-xs"
                            disabled={!internalDate?.from || !internalDate?.to}
                        >
                            Aplicar Filtro
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
