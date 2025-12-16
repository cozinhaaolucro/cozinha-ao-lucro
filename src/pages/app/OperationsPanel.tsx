import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, subscribeToOrders } from '@/lib/supabase';
import { Order, OrderWithDetails } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertTriangle, ChefHat, Timer, Package, Zap } from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/lib/database';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Toast-inspired color thresholds (in minutes)
const TIME_THRESHOLDS = {
    NEW: 5,      // Green: 0-5 min
    WARNING: 15, // Yellow: 5-15 min
    URGENT: 20,  // Red: 15+ min
};

// Get border color class based on waiting time (Toast KDS style)
const getTimeBorderClass = (minutes: number, status: string) => {
    if (status === 'pending') {
        if (minutes < TIME_THRESHOLDS.NEW) return 'border-l-4 border-l-emerald-500';
        if (minutes < TIME_THRESHOLDS.WARNING) return 'border-l-4 border-l-yellow-500';
        return 'border-l-4 border-l-red-500 animate-pulse';
    }
    if (status === 'preparing') {
        if (minutes < TIME_THRESHOLDS.WARNING) return 'border-l-4 border-l-blue-500';
        if (minutes < TIME_THRESHOLDS.URGENT) return 'border-l-4 border-l-yellow-500';
        return 'border-l-4 border-l-red-500 animate-pulse';
    }
    return 'border-l-4 border-l-emerald-500'; // Ready = always green
};

const OperationsPanel = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRealtime, setIsRealtime] = useState(false);
    const { toast } = useToast();
    const [tick, setTick] = useState(0); // For real-time timer updates

    // Real-time timer tick (every second)
    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initial fetch and real-time subscription
    useEffect(() => {
        fetchOrders();

        // Set up real-time subscription if user is authenticated
        if (user?.id) {
            const channel = subscribeToOrders(
                user.id,
                // On INSERT: refetch all orders (simpler than merging nested data)
                () => {
                    console.log('[Realtime] New order received');
                    fetchOrders();
                },
                // On UPDATE: refetch all orders
                () => {
                    console.log('[Realtime] Order updated');
                    fetchOrders();
                },
                // On DELETE: refetch all orders
                () => {
                    console.log('[Realtime] Order deleted');
                    fetchOrders();
                }
            );

            if (channel) {
                setIsRealtime(true);
                return () => {
                    channel.unsubscribe();
                };
            }
        }

        // Fallback: polling every 15s if realtime is not available
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const fetchOrders = async () => {
        const { data, error } = await getOrders();
        if (!error && data) {
            setOrders(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const order = orders.find(o => o.id === id);
        const currentStatus = order?.status;

        const { error } = await updateOrderStatus(id, newStatus, currentStatus);

        if (error) {
            toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
        } else {
            toast({ title: 'Status atualizado!' });
            // Real-time will handle the update, but fetch immediately for responsiveness
            fetchOrders();
        }
    };

    // Helper to calculate cost from ingredients
    const calculateOrderCost = (order: OrderWithDetails) => {
        if (!order.items) return 0;
        return order.items.reduce((acc, item) => {
            const productCost = item.product?.product_ingredients?.reduce((pAcc: number, pi: any) => {
                const costPerUnit = pi.ingredient?.cost_per_unit || 0;
                return pAcc + (costPerUnit * pi.quantity);
            }, 0) || 0;
            return acc + (productCost * item.quantity);
        }, 0);
    };

    // Calculate waiting time since order was created (for pending) or started (for preparing)
    const getWaitingMinutes = (order: OrderWithDetails) => {
        if (order.status === 'preparing' && order.production_started_at) {
            return Math.floor((Date.now() - new Date(order.production_started_at).getTime()) / 60000);
        }
        // For pending orders, use created_at
        return Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
    };

    const OrderCard = ({ order }: { order: OrderWithDetails }) => {
        const waitingMinutes = getWaitingMinutes(order);
        const borderClass = getTimeBorderClass(waitingMinutes, order.status);

        const formatDuration = (minutes: number) => {
            if (minutes < 60) return `${minutes} min`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        };

        const orderCost = calculateOrderCost(order);
        const orderProfit = (order.total_value || 0) - orderCost;

        return (
            <Card className={`bg-white/5 backdrop-blur-md border-white/10 text-white overflow-hidden shadow-lg relative hover:border-white/20 transition-all duration-200 ${borderClass}`}>
                <CardHeader className="pb-2 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="text-blue-400 font-mono">#{order.order_number || order.id.slice(0, 4)}</span>
                                <span className="text-sm font-normal opacity-70">- {order.customer?.name || 'Balcão'}</span>
                            </CardTitle>
                            <div className="text-xs text-muted-slate-400 mt-1 flex items-center gap-2 opacity-60">
                                <Clock className="w-3 h-3" />
                                {format(new Date(order.created_at), "HH:mm", { locale: ptBR })}
                                {order.delivery_time && (
                                    <span className="ml-2">→ Entrega: {order.delivery_time}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge
                                variant="outline"
                                className={`${waitingMinutes > TIME_THRESHOLDS.URGENT
                                        ? 'bg-red-500/20 text-red-200 border-red-500/50 animate-pulse'
                                        : waitingMinutes > TIME_THRESHOLDS.WARNING
                                            ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/50'
                                            : 'bg-blue-500/20 text-blue-200 border-blue-500/50'
                                    } text-xs py-0.5 px-2`}
                            >
                                <Timer className="w-3 h-3 mr-1" />
                                {formatDuration(waitingMinutes)}
                            </Badge>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] hover:bg-emerald-500/20">
                                Lucro: R$ {orderProfit.toFixed(2)}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="space-y-3">
                        {/* All Day View: Item summary (Toast-inspired) */}
                        <div className="space-y-1">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-white/5 last:border-0">
                                    <span className="font-medium text-white/90">
                                        <span className="text-blue-400 font-mono">{item.quantity}x</span> {item.product_name}
                                    </span>
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
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                                    onClick={() => updateStatus(order.id, 'delivered')}
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Entregar (Pago)
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    // Metrics Calculation
    const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
    const totalEstimatedTime = activeOrders.reduce((acc, order) => {
        if (order.status === 'ready') return acc;
        const orderPrepTime = order.items.reduce((iAcc, item) => iAcc + (item.product?.preparation_time_minutes || 0) * item.quantity, 0);
        return acc + orderPrepTime;
    }, 0);

    // "All Day View" counts (Toast-inspired)
    const allDayCounts = useMemo(() => {
        const counts = new Map<string, number>();
        activeOrders.forEach(order => {
            order.items.forEach(item => {
                const current = counts.get(item.product_name) || 0;
                counts.set(item.product_name, current + item.quantity);
            });
        });
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [activeOrders]);

    // "Horas Realizadas": Sum of production time for ALL orders worked on TODAY
    const totalRealizedMinutes = useMemo(() => {
        return orders.reduce((acc, order) => {
            if (!order.production_started_at) return acc;

            const startDate = new Date(order.production_started_at);
            if (!isToday(startDate)) return acc;

            let elapsed = 0;

            if (order.status === 'preparing') {
                elapsed = Math.floor((Date.now() - startDate.getTime()) / 60000);
            } else if (order.status === 'ready' || order.status === 'delivered') {
                if (order.production_completed_at) {
                    const endDate = new Date(order.production_completed_at);
                    elapsed = Math.floor((endDate.getTime() - startDate.getTime()) / 60000);
                }
            }

            return acc + Math.max(0, elapsed);
        }, 0);
    }, [orders, tick]);

    const formatHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // "Daily Profit": Sum of (Value - Cost) for orders delivered TODAY
    const dailyProfitOrders = orders.filter(o => o.status === 'delivered' && o.delivered_at && isToday(new Date(o.delivered_at)));
    const totalDailyProfit = dailyProfitOrders.reduce((acc, order) => acc + ((order.total_value || 0) - calculateOrderCost(order)), 0);

    return (
        <div className="-m-4 md:-m-8 min-h-screen w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] bg-slate-900">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 overflow-visible">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Painel de Operações
                            </span>
                            <div className={`px-2 py-1 rounded text-xs border font-mono flex items-center gap-1 ${isRealtime ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/10 text-white/60 border-white/10'}`}>
                                {isRealtime && <Zap className="w-3 h-3" />}
                                {isRealtime ? 'REALTIME' : 'POLLING'}
                            </div>
                        </h1>
                        <p className="text-neutral-400 flex items-center gap-2">
                            Gerenciamento de fila em tempo real
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-visible">
                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-help group relative">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Tempo Estimado</span>
                            <span className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                {formatHours(totalEstimatedTime)}
                            </span>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-neutral-900 text-white text-xs p-2 rounded shadow-xl border border-white/10 hidden group-hover:block z-[100] pointer-events-none">
                                Soma do tempo de preparo de todos pedidos ativos.
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px] hover:bg-white/10 transition-colors cursor-help group relative">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Horas Realizadas</span>
                            <span className="text-xl md:text-2xl font-bold text-blue-400 flex items-center gap-2">
                                {formatHours(totalRealizedMinutes)}
                            </span>
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-neutral-900 text-white text-xs p-2 rounded shadow-xl border border-white/10 hidden group-hover:block z-[100] pointer-events-none">
                                Tempo total gasto nos pedidos hoje (Finalizados + Ativos).
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Lucro Dia</span>
                            <span className="text-xl md:text-2xl font-bold text-emerald-400">R$ {totalDailyProfit.toFixed(2)}</span>
                        </div>

                        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 md:p-4 flex flex-col items-center min-w-[100px]">
                            <span className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-wider font-bold mb-1">Fila Total</span>
                            <span className="text-xl md:text-2xl font-bold text-white">{orders.filter(o => o.status === 'pending').length}</span>
                        </div>
                    </div>
                </header>

                {/* Toast-inspired All Day View */}
                {allDayCounts.length > 0 && (
                    <div className="mb-6 bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Produção do Dia
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {allDayCounts.map(([name, count]) => (
                                <Badge key={name} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 py-1 px-3">
                                    <span className="font-mono font-bold mr-1">{count}x</span> {name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border border-white/10 rounded-xl p-6 bg-white/5 backdrop-blur-sm shadow-2xl shadow-black/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pending Column */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Aguardando
                                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded">{orders.filter(o => o.status === 'pending').length}</span>
                            </h2>
                            <div className="space-y-4">
                                {orders.filter(o => o.status === 'pending').map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {orders.filter(o => o.status === 'pending').length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                        Nenhum pedido pendente
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preparing Column */}
                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                Preparando
                                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded">{orders.filter(o => o.status === 'preparing').length}</span>
                            </h2>
                            <div className="space-y-4">
                                {orders.filter(o => o.status === 'preparing').map(order => (
                                    <OrderCard key={order.id} order={order} />
                                ))}
                                {orders.filter(o => o.status === 'preparing').length === 0 && (
                                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-white/20 text-sm">
                                        Nenhum pedido em preparo
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ready Column */}
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                Prontos para Entrega
                                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded">{orders.filter(o => o.status === 'ready').length}</span>
                            </h2>
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
