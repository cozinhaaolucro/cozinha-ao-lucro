import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CostBreakdownChart } from '@/components/dashboard/CostBreakdownChart';
import type { OrderWithDetails, Product } from '@/types/database';

interface DashboardChartsSectionProps {
    dailyData: any[]; // Ideally typed from Dashboard calc
    orders: OrderWithDetails[];
    products: Product[];
}

export const DashboardChartsSection = ({ dailyData, orders, products }: DashboardChartsSectionProps) => {
    // Transformer logic moved here or passed down? 
    // For now pass down.

    // Cost Breakdown calc reuse
    const costBreakdownData = orders.flatMap(o => o.items || []).reduce((acc, item) => {
        const prod = products.find(p => p.id === item.product_id);
        if (!prod?.product_ingredients) return acc;

        prod.product_ingredients.forEach((pi: any) => { // Using any as per original Dashboard logic
            if (!pi.ingredient) return;
            const cost = (pi.ingredient.cost_per_unit || 0) * pi.quantity * item.quantity;
            const existing = acc.find(x => x.name === pi.ingredient!.name);
            if (existing) existing.value += cost;
            else acc.push({ name: pi.ingredient.name, value: cost });
        });
        return acc;
    }, [] as { name: string; value: number }[]);

    return (
        <div className="mt-4">
            <div className="grid gap-4 md:grid-cols-3">
                <RevenueChart data={dailyData} />
                <CostBreakdownChart data={costBreakdownData} />
            </div>
        </div>
    );
};
