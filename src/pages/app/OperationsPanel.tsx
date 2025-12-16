
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Order, OrderWithDetails } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertTriangle, ChefHat, Timer, ArrowRight } from 'lucide-react';
import { getOrders } from '@/lib/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const OperationsPanel = () => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Polling for updates (simple real-time for MVP)
    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        const { data, error } = await getOrders();
        if (!error && data) {
            // Filter only active orders for the panel
            const activeOrders = data.filter(o =>
                ['pending', 'preparing', 'ready'].includes(o.status)
            );
            setOrders(activeOrders);
        }
        setLoading(false);
    };

    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        const updateData: any = { status: newStatus };

        if (newStatus === 'preparing') {
            updateData.production_started_at = new Date().toISOString();
        } else if (newStatus === 'ready') {
            updateData.production_completed_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (!error) {
            toast({ title: `Status atualizado para ${newStatus}` });
            loadOrders();
        } else {
            toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        }
    };

    // Helper to calculate cost from ingredients
    const calculateOrderCost = (order: OrderWithDetails) => {
        if (!order.items) return 0;
        return order.items.reduce((acc, item) => {
            const productCost = item.product?.product_ingredients?.reduce((pAcc: number, pi: any) => {
                const costPerUnit = pi.ingredient?.cost_per_unit || 0;
                // Normalize quantity if needed (assuming DB stores normalized)
                return pAcc + (costPerUnit * pi.quantity);
            }, 0) || 0;
            return acc + (productCost * item.quantity);
        }, 0);
    };

    const OrderCard = ({ order }: { order: OrderWithDetails }) => {
        const waitingTimeMinutes = order.production_started_at
            ? Math.floor((new Date().getTime() - new Date(order.production_started_at).getTime()) / 60000)
            : 0;

        const formatDuration = (minutes: number) => {
            if (minutes < 60) return `${minutes} min`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        };

        const orderCost = calculateOrderCost(order);
        const orderProfit = (order.total_value || 0) - orderCost;

        return (
            <Card key={order.id} className="bg-white/5 backdrop-blur-md border-white/10 text-white overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-lg relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <CardHeader className="pb-2 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="text-blue-400">#{order.order_number || order.id.slice(0, 4)}</span>
                                <span className="text-sm font-normal opacity-70">- {order.customer?.name || 'Balcão'}</span>
                            </CardTitle>
                            <div className="text-xs text-muted-slate-400 mt-1 flex items-center gap-2 opacity-60">
                                <Clock className="w-3 h-3" />
                                {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            {order.status === 'preparing' && (
                                <Badge variant="outline" className={`${waitingTimeMinutes > 20 ? 'bg-red-500/20 text-red-200 border-red-500/50 animate-pulse' : 'bg-blue-500/20 text-blue-200 border-blue-500/50'} text-xs py-0.5 px-2`}>
                                    <Timer className="w-3 h-3 mr-1" />
                                    {formatDuration(waitingTimeMinutes)}
                                </Badge>
                            )}
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] hover:bg-emerald-500/20">
                                Lucro: R$ {orderProfit.toFixed(2)}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                    <span className="font-medium text-white/90">{item.quantity}x {item.product_name}</span>
                                </div>
                            ))}
                        </div>

                        {order.notes && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded text-xs text-yellow-200 flex items-start gap-2">
                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                {order.notes}
                            </div>
                        )}

                        <div className="pt-2">
                            {order.status === 'pending' && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                                    onClick={() => updateStatus(order.id, 'preparing')}
                                >
                                    <ChefHat className="w-4 h-4 mr-2" />
                                    Iniciar Preparo
                                </Button>
                            )}
                            {order.status === 'preparing' && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 transition-all active:scale-95"
                                    onClick={() => updateStatus(order.id, 'ready')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Marcar Pronto
                                </Button>
                            )}
                            {order.status === 'ready' && (
                                <Button
                                    variant="outline"
                                    className="w-full border-white/20 hover:bg-white/10 text-white/70"
                                    disabled
                                >
                                    Aguardando Entrega
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Metrics Calculation
    const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status));
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const totalEstimatedTime = activeOrders.reduce((acc, order) => {
        const orderPrepTime = order.items.reduce((iAcc, item) => iAcc + (item.product?.preparation_time_minutes || 0) * item.quantity, 0);
        return acc + orderPrepTime;
    }, 0);

    // "Realized Hours": Sum of time spent on currently preparing orders
    const totalRealizedMinutes = preparingOrders.reduce((acc, order) => {
        if (!order.production_started_at) return acc;
        const elapsed = Math.floor((new Date().getTime() - new Date(order.production_started_at).getTime()) / 60000);
        return acc + elapsed;
    }, 0);

    const formatHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // Profit from "Ready" orders (assuming this represents completed production for the session)
    // In a real app, this might filter by "Today"
    const finishedOrders = orders.filter(o => o.status === 'ready');
    const totalSessionProfit = finishedOrders.reduce((acc, order) => acc + ((order.total_value || 0) - calculateOrderCost(order)), 0);


    return (
        <div className="min-h-screen bg-slate-900 p-6 md:p-8 font-sans selection:bg-blue-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Painel de Operações
                            </span>
                            <div className="px-2 py-1 rounded bg-white/10 text-xs text-white/60 border border-white/10 font-mono">
                                LIVE
                            </div>
                        </h1>
                        <p className="text-neutral-400 flex items-center gap-2">
                            Gerenciamento de fila em tempo real
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-help group relative">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Tempo Estimado</span>
                            <span className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                {formatHours(totalEstimatedTime)}
                            </span>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50 pointer-events-none">
                                Soma do tempo de preparo de todos pedidos ativos.
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-help group relative">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Horas Realizadas</span>
                            <span className="text-xl md:text-2xl font-bold text-blue-400 flex items-center gap-2">
                                {formatHours(totalRealizedMinutes)}
                            </span>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 text-white text-xs p-2 rounded hidden group-hover:block z-50 pointer-events-none">
                                Tempo total gasto nos pedidos em andamento até agora.
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Lucro Sessão</span>
                            <span className="text-xl md:text-2xl font-bold text-emerald-400">R$ {totalSessionProfit.toFixed(2)}</span>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Fila Total</span>
                            <span className="text-xl md:text-2xl font-bold text-white">{orders.filter(o => o.status === 'pending').length}</span>
                        </div>
                    </div>
                </header>

                <div className="border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur-sm shadow-2xl shadow-black/20">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Coluna: A Fazer */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-white/50 px-2 uppercase text-xs font-bold tracking-wider">
                                <span>A Fazer</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-white/70">{orders.filter(o => o.status === 'pending').length}</span>
                            </div>
                            <div className="space-y-4">
                                {orders.filter(o => o.status === 'pending').map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {orders.filter(o => o.status === 'pending').length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                        Fila vazia
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna: Em Preparo */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-blue-400/80 px-2 uppercase text-xs font-bold tracking-wider">
                                <span className="flex items-center gap-2"><ChefHat className="w-4 h-4" /> Em Preparo</span>
                                <span className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">{orders.filter(o => o.status === 'preparing').length}</span>
                            </div>
                            <div className="space-y-4">
                                {orders.filter(o => o.status === 'preparing').map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {orders.filter(o => o.status === 'preparing').length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                        Sem produção ativa
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna: Pronto */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-green-400/80 px-2 uppercase text-xs font-bold tracking-wider">
                                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Prontos</span>
                                <span className="bg-green-500/20 px-2 py-0.5 rounded text-green-300">{orders.filter(o => o.status === 'ready').length}</span>
                            </div>
                            <div className="space-y-4">
                                {orders.filter(o => o.status === 'ready').map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {orders.filter(o => o.status === 'ready').length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                        Nenhum pronto
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OperationsPanel;
