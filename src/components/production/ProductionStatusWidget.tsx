
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ShoppingBag, ArrowRight, Pause, CheckCircle, Flame, Clock, Play } from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/lib/database';
import type { OrderWithDetails } from '@/types/database';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

const ProductionStatusWidget = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [activeOrders, setActiveOrders] = useState<OrderWithDetails[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [visible, setVisible] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);

    // Fetch and subscribe
    useEffect(() => {
        fetchData();

        const subscription = supabase
            .channel('production_widget_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchData = async () => {
        const { data } = await getOrders();
        if (data) {
            setOrders(data);
            const preparing = data.filter(o => o.status === 'preparing');

            // Pending Logic considering Start Date
            const today = new Date().toISOString().split('T')[0];
            const pending = data.filter(o => {
                if (o.status !== 'pending') return false;
                if (o.start_date && o.start_date > today) return false;
                return true;
            });

            setActiveOrders(preparing);
            setPendingCount(pending.length);
            setVisible(preparing.length > 0 || pending.length > 0);
        }
    };

    // Derived lists for Sheet
    const todoOrders = orders.filter(o => {
        if (o.status !== 'pending') return false;
        const today = new Date().toISOString().split('T')[0];
        if (o.start_date && o.start_date > today) return false;
        return true;
    });
    const inProgressOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');


    const handleStatusUpdate = async (orderId: string, newStatus: string, currentStatus: string) => {
        const { error } = await updateOrderStatus(orderId, newStatus, currentStatus);

        if (error) {
            toast.error('Erro ao atualizar status');
        } else {
            toast.success('Status atualizado!');
            fetchData();
        }
    };

    // Hover logic
    const hoverTimeout = useState<NodeJS.Timeout | null>(null);
    const handleMouseEnter = () => {
        if (hoverTimeout[0]) clearTimeout(hoverTimeout[0]);
        if (!sheetOpen) hoverTimeout[1](setTimeout(() => setIsHovered(true), 150));
    };
    const handleMouseLeave = () => {
        if (hoverTimeout[0]) clearTimeout(hoverTimeout[0]);
        hoverTimeout[1](setTimeout(() => setIsHovered(false), 300));
    };

    // Timer Component
    const ProductionTimer = ({ startDate }: { startDate?: string | null }) => {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
            if (!startDate) return;
            const start = new Date(startDate).getTime();

            const timer = setInterval(() => {
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000 / 60)); // minutes
            }, 60000);

            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 1000 / 60));

            return () => clearInterval(timer);
        }, [startDate]);

        return (
            <div className="flex items-center gap-1 text-[#c76e60] font-mono font-bold text-sm">
                <Flame className="w-3 h-3 animate-pulse" />
                {elapsed} min
            </div>
        );
    };

    // Stats for widget display
    const totalEstimatedTime = activeOrders.reduce((acc, order) => {
        const orderPrepTime = order.items.reduce((iAcc, item) => iAcc + (item.product?.preparation_time_minutes || 0) * item.quantity, 0);
        return acc + orderPrepTime;
    }, 0);

    const formatHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <>
            <div className={`fixed bottom-36 right-4 z-30 md:left-auto md:top-auto md:bottom-8 md:right-28 md:translate-x-0 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <motion.div
                    layout
                    initial={{ width: 60, height: 60, borderRadius: 30 }}
                    animate={{
                        width: isHovered && !sheetOpen ? 300 : (activeOrders.length > 0 ? 70 : 60),
                        height: isHovered && !sheetOpen ? 400 : (activeOrders.length > 0 ? 70 : 60),
                        borderRadius: isHovered && !sheetOpen ? 16 : 35,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden relative cursor-pointer`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                        if (!isHovered) setIsHovered(true);
                    }}
                >
                    {/* Collapsed State */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-10"></div>
                            <div className="bg-[#3b82f680] w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/20 relative z-10 p-0 backdrop-blur-sm">
                                <ChefHat className="text-white w-7 h-7" />
                                {activeOrders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-[#c76e60] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-neutral-900">
                                        {activeOrders.length}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expanded Widget State (Mini View) */}
                    <div className={`p-4 h-full flex flex-col transition-opacity duration-300 ${isHovered && !sheetOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-bold text-base flex items-center gap-2">
                                <ChefHat className="text-blue-400 w-4 h-4" />
                                Produção
                            </h3>
                            <div className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                                {formatHours(totalEstimatedTime)} est.
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {activeOrders.length > 0 ? (
                                activeOrders.slice(0, 3).map(order => (
                                    <div key={order.id} className="bg-neutral-800/40 p-2 rounded border border-white/5">
                                        <div className="flex justify-between items-center text-xs text-white mb-1">
                                            <span className="font-bold">
                                                #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                                <span className="ml-2 font-normal text-neutral-400 text-[10px]">{order.customer?.name?.split(' ')[0]}</span>
                                            </span>
                                            <ProductionTimer startDate={order.production_started_at} />
                                        </div>
                                        <p className="text-[10px] text-neutral-400 truncate">{order.items?.map(i => i.product_name).join(', ')}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-neutral-500 text-xs py-4">Sem pedidos ativos</div>
                            )}
                            {pendingCount > 0 && (
                                <div className="text-xs text-center text-neutral-400 border-t border-neutral-800 pt-2">
                                    + {pendingCount} na fila
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsHovered(false);
                                setSheetOpen(true);
                            }}
                            size="sm"
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                        >
                            Abrir Painel Completo
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Full Operations Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col bg-slate-50 dark:bg-slate-900 border-l z-[60]">
                    <SheetHeader className="p-6 pb-2 bg-white dark:bg-slate-950 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <ChefHat className="w-6 h-6 text-primary" />
                            Painel de Operações
                        </SheetTitle>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>•</span>
                            <span className="text-[#c76e60] font-medium">{inProgressOrders.length} Produzindo</span>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{readyOrders.length} Prontos</span>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8 pb-10">

                            {/* IN PROGRESS SECTION */}
                            {inProgressOrders.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#c76e60] flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        Em Produção ({inProgressOrders.length})
                                    </h3>
                                    {inProgressOrders.map(order => (
                                        <Card key={order.id} className="border-[#c76e60]/30 bg-[#c76e60]/5 dark:bg-[#c76e60]/20 overflow-hidden relative">
                                            <div className="absolute top-0 left-0 h-1 bg-[#c76e60] w-full animate-progress-indeterminate"></div>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-lg">
                                                            #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                                        </span>
                                                        <p className="text-sm font-medium">{order.customer?.name || 'Cliente Balcão'}</p>
                                                    </div>
                                                    <ProductionTimer startDate={order.production_started_at} />
                                                </div>
                                                <div className="space-y-1">
                                                    {order.items?.map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span>{item.quantity}x {item.product_name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 bg-white border-[#c76e60]/30 hover:bg-[#c76e60]/10 hover:text-[#c76e60] text-[#c76e60]"
                                                        onClick={() => handleStatusUpdate(order.id, 'pending', 'preparing')}
                                                    >
                                                        <Pause className="w-4 h-4 mr-2" />
                                                        Pausar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-[2] bg-[#c76e60] hover:bg-[#c76e60]/90 hover:text-white border-[#c76e60]"
                                                        onClick={() => handleStatusUpdate(order.id, 'ready', 'preparing')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Concluir
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* TO DO SECTION */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Fila de Pedidos ({todoOrders.length})
                                </h3>
                                {todoOrders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Nenhum pedido na fila.</p>
                                ) : (
                                    todoOrders.map(order => (
                                        <Card key={order.id} className="group hover:border-primary/50 transition-colors">
                                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-base">
                                                            #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {format(new Date(order.created_at), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                                                        {order.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="shrink-0 rounded-full h-10 w-10 p-0"
                                                    onClick={() => handleStatusUpdate(order.id, 'preparing', 'pending')}
                                                >
                                                    <Play className="w-4 h-4 ml-0.5" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* READY SECTION */}
                            {readyOrders.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-green-600 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Prontos ({readyOrders.length})
                                    </h3>
                                    {readyOrders.map(order => (
                                        <Card key={order.id} className="bg-green-50/50 border-green-200">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-green-900">
                                                        #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                                    </span>
                                                    <p className="text-sm text-green-700">{order.customer?.name}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-green-200 text-green-700 hover:bg-green-100"
                                                    onClick={() => handleStatusUpdate(order.id, 'delivered', 'ready')}
                                                >
                                                    Entregar
                                                    <ArrowRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default ProductionStatusWidget;
