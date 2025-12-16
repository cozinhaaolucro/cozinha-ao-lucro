import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Lightbulb, TrendingUp, Package, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardInsightsProps {
    hasProducts: boolean;
    hasOrders: boolean;
    hasStock: boolean;
}

export const DashboardInsights = ({ hasProducts, hasOrders, hasStock }: DashboardInsightsProps) => {
    const navigate = useNavigate();

    // Determine the priority insight
    let insight = null;

    if (!hasProducts) {
        insight = {
            title: "Comece a Lucrar Agora!",
            description: "Para calcular seus custos e lucros, o primeiro passo é cadastrar seus produtos.",
            action: "Cadastrar Produto",
            icon: Package,
            path: "/app/produtos",
            color: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-blue-200"
        };
    } else if (!hasStock) {
        insight = {
            title: "Controle seu Estoque",
            description: "Adicione ingredientes para que o sistema possa calcular o custo exato das suas receitas.",
            action: "Adicionar Ingredientes",
            icon: ShoppingCart,
            path: "/app/produtos", // Typically products/ingredients are in similar area or settings
            color: "text-orange-600",
            bg: "bg-orange-50",
            border: "border-orange-200"
        };
    } else if (!hasOrders) {
        insight = {
            title: "Registre sua Primeira Venda",
            description: "Tudo pronto! Registre um pedido para ver seus relatórios de lucro ganharem vida.",
            action: "Novo Pedido",
            path: "/app/pedidos",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-200"
        };
    } else {
        // All set! No insight to show, or maybe a "Good Job" one?
        // User requested removal of placeholders.
        return null;
    }

    if (!insight) return null;

    return (
        <Card className={`${insight.bg} ${insight.border} border-l-4 shadow-sm animate-in slide-in-from-top-4 mb-6`}>
            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-white shadow-sm ${insight.color}`}>
                        <insight.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${insight.color}`}>{insight.title}</h3>
                        <p className="text-muted-foreground max-w-xl">{insight.description}</p>
                    </div>
                </div>
                <Button
                    onClick={() => navigate(insight!.path)}
                    className={`${insight.color.replace('text', 'bg')} text-white hover:opacity-90 shadow-md whitespace-nowrap`}
                >
                    {insight.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
};
