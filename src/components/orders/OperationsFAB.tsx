import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, Clock, Play, Pause, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OrderWithDetails } from '@/types/database';
import { getOrders, updateOrderStatus } from '@/lib/database';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const OperationsFAB = () => {
    const [open, setOpen] = useState(false);
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch orders on mount and when open
    useEffect(() => {
        if (open) {
            fetchOrders();
        }

        // Real-time subscription
        const subscription = supabase
            .channel('operations_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [open]);

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await getOrders();
        if (data) {
            // Filter only relevant orders (pending, preparing, ready)
            // And also check start_date for pending orders
            const today = new Date().toISOString().split('T')[0];

            const activeOrders = data.filter(o => {
                if (['cancelled', 'delivered'].includes(o.status)) return false;

                // If pending, check start_date
                if (o.status === 'pending') {
                    if (o.start_date && o.start_date > today) return false; // Future orders
                    // If no start_date, show it (as asap) or maybe hiding? Assuming show.
                }
                return true;
            });
            setOrders(activeOrders);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string, currentStatus: string) => {
        const { error } = await updateOrderStatus(orderId, newStatus, currentStatus);

        if (error) {
            toast.error('Erro ao atualizar status');
        } else {
            toast.success('Status atualizado!');
            fetchOrders();
        }
    };

    // Derived lists
    const todoOrders = orders.filter(o => o.status === 'pending');
    const inProgressOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    // Timer Component for In Progress
    const ProductionTimer = ({ startDate }: { startDate?: string | null }) => {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
            if (!startDate) return;
            const start = new Date(startDate).getTime();

            const timer = setInterval(() => {
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000 / 60)); // minutes
            }, 60000); // update every minute

            // Initial set
            const now = new Date().getTime();
            setElapsed(Math.floor((now - start) / 1000 / 60));

            return () => clearInterval(timer);
        }, [startDate]);

        return (
            <div className="flex items-center gap-1 text-orange-500 font-mono font-bold">
                <Flame className="w-4 h-4 animate-pulse" />
                {elapsed} min
            </div>
        );
    };

    // Calculate total items
    const totalActive = todoOrders.length + inProgressOrders.length + readyOrders.length;

    if (totalActive === 0 && !open) return null; // Hide if nothing to do? Or show empty state? Better show always or bubble?

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="lg"
                        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-[100] p-0 overflow-hidden group bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative flex flex-col items-center justify-center">
                            <ChefHat className="w-8 h-8" />
                            {totalActive > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 border-2 border-white">
                                    {totalActive}
                                </Badge>
                            )}
                        </div>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col bg-slate-50 dark:bg-slate-900 border-l">
                    <SheetHeader className="p-6 pb-2 bg-white dark:bg-slate-950 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <ChefHat className="w-6 h-6 text-primary" />
                            Painel de Operações
                        </SheetTitle>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                            <span>{todoOrders.length} Fila</span>
                            <span>•</span>
                            <span className="text-orange-500 font-medium">{inProgressOrders.length} Produzindo</span>
                            <span>•</span>
                            <span className="text-green-600 font-medium">{readyOrders.length} Prontos</span>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-8 pb-10">

                            {/* IN PROGRESS SECTION - HIGHLIGHTED */}
                            {inProgressOrders.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500 flex items-center gap-2">
                                        <Flame className="w-4 h-4" />
                                        Em Produção ({inProgressOrders.length})
                                    </h3>
                                    {inProgressOrders.map(order => (
                                        <Card key={order.id} className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 overflow-hidden relative">
                                            {/* Progress Bar Animation */}
                                            <div className="absolute top-0 left-0 h-1 bg-orange-500 w-full animate-progress-indeterminate"></div>

                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-lg">
                                                            #{order.display_id || order.id.slice(0, 4)}
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
                                                        className="flex-1 bg-white border-orange-200 hover:bg-[hsl(182,16%,55%)] hover:text-white text-orange-700"
                                                        onClick={() => handleStatusUpdate(order.id, 'pending', 'preparing')}
                                                    >
                                                        <Pause className="w-4 h-4 mr-2" />
                                                        Pausar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="flex-[2] bg-orange-500 hover:bg-[hsl(182,16%,55%)] hover:text-white border-orange-600"
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
                                                            #{order.display_id || order.id.slice(0, 4)}
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
                                                        #{order.display_id || order.id.slice(0, 4)}
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

export default OperationsFAB;
