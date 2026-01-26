import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";

interface DashboardFiltersProps {
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

export const DashboardFilters = ({ dateRange, setDateRange }: DashboardFiltersProps) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
                <p className="text-sm text-muted-foreground">Análise completa do seu negócio</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                    minimal={true}
                />
            </div>
        </div>
    );
};
