import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Phone, Filter, Pencil } from 'lucide-react';
import { getOrders } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { OrderWithDetails } from '@/types/database';
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';

const STATUS_COLUMNS = {
    pending: { label: 'A Fazer', color: 'bg-yellow-50 border-yellow-200' },
    preparing: { label: 'Em Produção', color: 'bg-blue-50 border-blue-200' },
    ready: { label: 'Pronto', color: 'bg-green-50 border-green-200' },
    delivered: { label: 'Entregue', color: 'bg-gray-50 border-gray-200' },
};

const Pedidos = () => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
    const { toast } = useToast();

    const loadOrders = async () => {
        const { data, error } = await getOrders();
        if (!error && data) {
            setOrders(data);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return formatLocalDate(date);
    };

    const handleWhatsApp = (phone: string, customerName: string) => {
        const message = `Olá ${customerName}! Seu pedido está pronto! 🎉`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const filteredOrders = orders.filter((order) => {
        if (order.status === 'cancelled') return false;
        if (!dateFilter.start && !dateFilter.end) return true;

        if (!order.delivery_date) return false;
        const orderDate = parseLocalDate(order.delivery_date);
        orderDate.setHours(0, 0, 0, 0);

        const start = dateFilter.start ? new Date(dateFilter.start) : null;
        const end = dateFilter.end ? new Date(dateFilter.end) : null;

        if (start) {
            start.setHours(0, 0, 0, 0);
            if (orderDate < start) return false;
        }
        if (end) {
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
        }
        return true;
    });

    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        setDraggedOrder(orderId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (!draggedOrder) return;

        // Update locally first
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === draggedOrder ? { ...order, status: newStatus as any } : order
            )
        );

        // Update in database
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', draggedOrder);

        if (error) {
            toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
            loadOrders();
        } else {
            toast({ title: 'Status atualizado!' });
        }

        setDraggedOrder(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">Gerencie seus pedidos em um quadro Kanban</p>
                </div>
                <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Novo Pedido
                </Button>
            </div>

            {/* Date Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                placeholder="Data inicial"
                                className="max-w-xs"
                            />
                            <span className="text-sm text-muted-foreground">até</span>
                            <Input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                placeholder="Data final"
                                className="max-w-xs"
                            />
                            {(dateFilter.start || dateFilter.end) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDateFilter({ start: '', end: '' })}
                                >
                                    Limpar
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(STATUS_COLUMNS).map(([status, config]) => {
                    const statusOrders = filteredOrders.filter((o) => o.status === status);

                    return (
                        <div
                            key={status}
                            className="space-y-3"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{config.label}</h3>
                                <Badge variant="secondary">{statusOrders.length}</Badge>
                            </div>

                            <div className="space-y-2 min-h-[400px]">
                                {statusOrders.length === 0 ? (
                                    <Card className={`${config.color} border-2 border-dashed`}>
                                        <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                            Arraste pedidos aqui
                                        </CardContent>
                                    </Card>
                                ) : (
                                    statusOrders.map((order) => (
                                        <Card
                                            key={order.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, order.id)}
                                            className={`${config.color} border-2 hover:shadow-md transition-all cursor-move ${draggedOrder === order.id ? 'opacity-50' : ''
                                                }`}
                                        >
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-sm flex items-center justify-between">
                                                    <span>{order.customer?.name || 'Cliente não informado'}</span>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingOrder(order);
                                                            }}
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        {order.customer?.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleWhatsApp(order.customer!.phone!, order.customer!.name);
                                                                }}
                                                            >
                                                                <Phone className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <div className="text-xs space-y-1">
                                                    <p><strong>Entrega:</strong> {formatDate(order.delivery_date)}</p>
                                                    <p><strong>Total:</strong> R$ {order.total_value.toFixed(2)}</p>
                                                    {order.items && order.items.length > 0 && (
                                                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                            {order.items.map((item, idx) => (
                                                                <p key={idx}>• {item.product_name} (x{item.quantity})</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <NewOrderDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => {
                    loadOrders();
                    setIsDialogOpen(false);
                }}
            />

            <EditOrderDialog
                order={editingOrder}
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                onSuccess={() => {
                    loadOrders();
                    setEditingOrder(null);
                }}
            />
        </div>
    );
};

export default Pedidos;
