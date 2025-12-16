
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

    const OrderCard = ({ order }: { order: OrderWithDetails }) => {
        const [elapsed, setElapsed] = useState(0);

        // Calculate total ideal prep time
        const idealTimeMinutes = order.items.reduce((acc, item) => {
            return acc + (item.product?.preparation_time_minutes || 0) * item.quantity;
        }, 0);

        useEffect(() => {
            if (order.status !== 'preparing' || !order.production_started_at) return;

            const start = new Date(order.production_started_at).getTime();
            const tick = () => {
                const now = new Date().getTime();
                setElapsed(Math.floor((now - start) / 1000 / 60)); // Minutes
            };

            tick();
            const timer = setInterval(tick, 60000); // Update every minute
            return () => clearInterval(timer);
        }, [order]);

        const isDelayed = order.status === 'preparing' && idealTimeMinutes > 0 && elapsed > idealTimeMinutes;

        return (
            <Card className={`border-l-4 ${order.status === 'pending' ? 'border-l-yellow-500' :
                order.status === 'preparing' ? (isDelayed ? 'border-l-red-500 animate-pulse' : 'border-l-blue-500') :
                    'border-l-green-500'
                }`}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">#{order.id.slice(0, 5)}</CardTitle>
                            <p className="text-sm text-muted-foreground">{order.customer?.name || 'Cliente Balcão'}</p>
                        </div>
                        <Badge variant={order.status === 'pending' ? 'outline' : 'default'} className={
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                    'bg-green-100 text-green-800 border-green-200'
                        }>
                            {order.status === 'pending' ? 'A Fazer' :
                                order.status === 'preparing' ? 'Produzindo' : 'Pronto'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Order Items */}
                        <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                                <li key={idx} className="flex justify-between text-sm font-medium">
                                    <span>{item.quantity}x {item.product?.name}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Timer Section */}
                        {order.status === 'preparing' && (
                            <div className={`flex items-center gap-2 p-2 rounded-md ${isDelayed ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                <Timer className="w-4 h-4" />
                                <span className="font-bold text-lg">{elapsed} min</span>
                                <span className="text-xs opacity-70"> / {idealTimeMinutes} min (meta)</span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2">
                            {order.status === 'pending' && (
                                <Button className="w-full gap-2" onClick={() => updateStatus(order.id, 'preparing')}>
                                    <ChefHat className="w-4 h-4" /> Iniciar Produção
                                </Button>
                            )}
                            {order.status === 'preparing' && (
                                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" onClick={() => updateStatus(order.id, 'ready')}>
                                    <CheckCircle2 className="w-4 h-4" /> Finalizar
                                </Button>
                            )}
                            {order.status === 'ready' && (
                                <Button variant="outline" className="w-full gap-2" onClick={() => updateStatus(order.id, 'delivered')}>
                                    <ArrowRight className="w-4 h-4" /> Entregar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Painel de Operações</h2>
                    <p className="text-muted-foreground">Gerencie a produção em tempo real (KDS)</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-400"></span> A Fazer
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span> Produzindo
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span> Pronto
                    </div>
                </div>
            </div>

            {/* Mobile Tabs View (Hidden on Desktop) */}
            <div className="md:hidden flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="pending" className="flex-1 flex flex-col h-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="pending" className="text-yellow-700 data-[state=active]:bg-yellow-100">
                            A Fazer ({orders.filter(o => o.status === 'pending').length})
                        </TabsTrigger>
                        <TabsTrigger value="preparing" className="text-blue-700 data-[state=active]:bg-blue-100">
                            Produzindo ({orders.filter(o => o.status === 'preparing').length})
                        </TabsTrigger>
                        <TabsTrigger value="ready" className="text-green-700 data-[state=active]:bg-green-100">
                            Pronto ({orders.filter(o => o.status === 'ready').length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="flex-1 overflow-y-auto space-y-4 p-1">
                        {orders.filter(o => o.status === 'pending').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {orders.filter(o => o.status === 'pending').length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">Nenhum pedido pendente</div>
                        )}
                    </TabsContent>

                    <TabsContent value="preparing" className="flex-1 overflow-y-auto space-y-4 p-1">
                        {orders.filter(o => o.status === 'preparing').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {orders.filter(o => o.status === 'preparing').length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">Nada em produção no momento</div>
                        )}
                    </TabsContent>

                    <TabsContent value="ready" className="flex-1 overflow-y-auto space-y-4 p-1">
                        {orders.filter(o => o.status === 'ready').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {orders.filter(o => o.status === 'ready').length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">Nenhum pedido aguardando entrega</div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Desktop Grid View (Hidden on Mobile) */}
            <div className="hidden md:grid grid-cols-3 gap-6 h-full overflow-hidden">
                {/* Column: Pending */}
                <div className="bg-gray-100/50 p-4 rounded-xl border flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-yellow-700">
                        <Clock className="w-5 h-5" /> A Fazer ({orders.filter(o => o.status === 'pending').length})
                    </h3>
                    <div className="space-y-4">
                        {orders.filter(o => o.status === 'pending').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>

                {/* Column: Preparing */}
                <div className="bg-blue-50/30 p-4 rounded-xl border flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-700">
                        <ChefHat className="w-5 h-5" /> Em Produção ({orders.filter(o => o.status === 'preparing').length})
                    </h3>
                    <div className="space-y-4">
                        {orders.filter(o => o.status === 'preparing').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>

                {/* Column: Ready */}
                <div className="bg-green-50/30 p-4 rounded-xl border flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" /> Pronto ({orders.filter(o => o.status === 'ready').length})
                    </h3>
                    <div className="space-y-4">
                        {orders.filter(o => o.status === 'ready').map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsPanel;
