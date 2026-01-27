import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import { HeaderAction } from "@/components/layout/HeaderAction";

interface DashboardFiltersProps {
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

export const DashboardFilters = ({ dateRange, setDateRange }: DashboardFiltersProps) => {
    return (
        <HeaderAction>
            <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                minimal={true}
            />
        </HeaderAction>
    );
};
