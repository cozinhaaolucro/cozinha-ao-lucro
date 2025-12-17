import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Phone, Filter, Pencil, Download, Upload, Copy, Trash2, PackageCheck, ChevronRight } from 'lucide-react';
import { getOrders, deductStockFromOrder } from '@/lib/database';
import { exportToExcel, importFromExcel } from '@/lib/excel';
import { supabase } from '@/lib/supabase';
import type { OrderWithDetails } from '@/types/database';
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import ClientProfileDrawer from '@/components/crm/ClientProfileDrawer';
import SendMessageDialog from '@/components/crm/SendMessageDialog';
import { Customer, OrderStatus } from '@/types/database';

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
    const [longPressOrder, setLongPressOrder] = useState<OrderWithDetails | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // CRM States
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [messageOrder, setMessageOrder] = useState<OrderWithDetails | null>(null);
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

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

    const handleWhatsApp = (order: OrderWithDetails) => {
        setMessageOrder(order);
        setIsMessageDialogOpen(true);
    };

    const handleDuplicate = async (order: OrderWithDetails) => {
        const orderData = {
            customer_id: order.customer_id,
            delivery_date: null,
            delivery_time: null,
            notes: order.notes ? `Cópia: ${order.notes}` : 'Cópia duplicada',
            status: 'pending' as const, // Force type literal
            total_value: order.total_value,
            order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        };

        const items = order.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
        }));

        // Use createOrder but we need to import it properly or check if its available in scope
        // It is imported as createOrder from '@/lib/database'
        const { error } = await import('@/lib/database').then(mod => mod.createOrder(orderData, items));

        if (!error) {
            toast({ title: 'Pedido duplicado com sucesso!' });
            loadOrders();
        } else {
            toast({ title: 'Erro ao duplicar pedido', variant: 'destructive' });
        }
    };

    const handleCustomerClick = (customer: Customer | null) => {
        if (customer) {
            setSelectedCustomer(customer);
            setIsDrawerOpen(true);
        }
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
                order.id === draggedOrder ? { ...order, status: newStatus as OrderStatus } : order
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

            // Deduct stock if moving to preparing
            if (newStatus === 'preparing') {
                deductStockFromOrder(draggedOrder).then(({ error: stockError }) => {
                    if (stockError) {
                        toast({ title: 'Erro ao dar baixa no estoque', variant: 'destructive' });
                    } else {
                        toast({ title: 'Estoque atualizado com sucesso!' });
                    }
                });
            }
        }

        setDraggedOrder(null);
    };

    const handleExport = () => {
        const dataToExport = filteredOrders.map(o => ({
            Status: STATUS_COLUMNS[o.status]?.label || o.status,
            Cliente: o.customer?.name || 'Não informado',
            'Data Entrega': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('pt-BR') : '-',
            Items: o.items?.map(i => `${i.product_name} (${i.quantity})`).join(', ') || '',
            'Valor Total': Number(o.total_value.toFixed(2)),
            CriadoEm: new Date(o.created_at).toLocaleDateString('pt-BR')
        }));
        exportToExcel(dataToExport, 'pedidos_cozinha_ao_lucro');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">Gerencie seus pedidos em um quadro Kanban</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                try {
                                    const data = await importFromExcel(file);
                                    // Basic validation and import logic would go here.
                                    // For now, alerting user that import is purely visual/mock for this demo or needs mapped fields.
                                    // Since Orders are complex (relations), doing a full import is risky without strict template.
                                    // I'll implement a basic alert or placeholder logic, or trying to map "Cliente", "Total".

                                    toast({ title: 'Importação', description: 'Funcionalidade de importação de pedidos em desenvolvimento avançado (requer mapeamento de clientes).' });

                                } catch (error) {
                                    toast({ title: 'Erro na importação', variant: 'destructive' });
                                }
                                // Reset input
                                e.target.value = '';
                            }}
                            title="Importar Excel"
                        />
                        <Button variant="outline" size="icon" title="Importar Excel">
                            <Upload className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleExport} title="Exportar Excel">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Novo Pedido
                    </Button>
                </div>
            </div>

            {/* Date Filters */}
            <Card>
                <CardContent className="p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                placeholder="Data inicial"
                                className="w-36 h-9"
                            />
                            <span className="text-sm text-muted-foreground">até</span>
                            <Input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                placeholder="Data final"
                                className="w-36 h-9"
                            />
                        </div>
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
                                    statusOrders.map((order) => {
                                        const nextStatus = order.status === 'pending' ? 'preparing'
                                            : order.status === 'preparing' ? 'ready'
                                                : order.status === 'ready' ? 'delivered' : null;

                                        return (
                                            <Card
                                                key={order.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, order.id)}
                                                onTouchStart={() => {
                                                    longPressTimerRef.current = setTimeout(() => {
                                                        setLongPressOrder(order);
                                                    }, 500);
                                                }}
                                                onTouchEnd={() => {
                                                    if (longPressTimerRef.current) {
                                                        clearTimeout(longPressTimerRef.current);
                                                    }
                                                }}
                                                onTouchMove={() => {
                                                    if (longPressTimerRef.current) {
                                                        clearTimeout(longPressTimerRef.current);
                                                    }
                                                }}
                                                className={`${config.color} border-2 hover:shadow-md transition-all cursor-move group ${draggedOrder === order.id ? 'opacity-50' : ''
                                                    }`}
                                            >
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-1">
                                                            {order.ready_for_pickup && (
                                                                <PackageCheck className="w-4 h-4 text-amber-600" title="Disponível para entrega" />
                                                            )}
                                                            <span
                                                                className="hover:underline cursor-pointer text-primary"
                                                                onClick={() => handleCustomerClick(order.customer)}
                                                            >
                                                                {order.customer?.name || 'Cliente não informado'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicate(order);
                                                                }}
                                                                title="Duplicar Pedido"
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
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
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Excluir este pedido?')) {
                                                                        const { error } = await supabase
                                                                            .from('orders')
                                                                            .delete()
                                                                            .eq('id', order.id);
                                                                        if (!error) {
                                                                            toast({ title: 'Pedido excluído' });
                                                                            loadOrders();
                                                                        }
                                                                    }
                                                                }}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                            {order.customer?.phone && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleWhatsApp(order);
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
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isDialogOpen && (
                <NewOrderDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={loadOrders}
                />
            )}

            {editingOrder && (
                <EditOrderDialog
                    order={editingOrder}
                    open={!!editingOrder}
                    onOpenChange={(open) => !open && setEditingOrder(null)}
                    onSuccess={loadOrders}
                />
            )}


            <ClientProfileDrawer
                customer={selectedCustomer}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            <SendMessageDialog
                isOpen={isMessageDialogOpen}
                onClose={() => setIsMessageDialogOpen(false)}
                order={messageOrder}
            />

            {/* Mobile Long-Press Action Sheet - Centered Modal */}
            {longPressOrder && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:hidden"
                    onClick={() => setLongPressOrder(null)}
                >
                    <div
                        className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div className="text-2xl font-bold text-primary">
                                #{longPressOrder.order_number || longPressOrder.id.slice(0, 4)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {longPressOrder.customer?.name || 'Sem cliente'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Forward actions */}
                            {longPressOrder.status === 'pending' && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-500"
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('orders')
                                            .update({ status: 'preparing', updated_at: new Date().toISOString() })
                                            .eq('id', longPressOrder.id);
                                        if (!error) {
                                            toast({ title: '→ Em Produção' });
                                            loadOrders();
                                        }
                                        setLongPressOrder(null);
                                    }}
                                >
                                    Iniciar Produção →
                                </Button>
                            )}
                            {longPressOrder.status === 'preparing' && (
                                <>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-500"
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('orders')
                                                .update({ status: 'ready', updated_at: new Date().toISOString() })
                                                .eq('id', longPressOrder.id);
                                            if (!error) {
                                                toast({ title: '→ Pronto' });
                                                loadOrders();
                                            }
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        Marcar Pronto →
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('orders')
                                                .update({ status: 'pending', updated_at: new Date().toISOString() })
                                                .eq('id', longPressOrder.id);
                                            if (!error) {
                                                toast({ title: '← Voltou para A Fazer' });
                                                loadOrders();
                                            }
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        ← Voltar para A Fazer
                                    </Button>
                                </>
                            )}
                            {longPressOrder.status === 'ready' && (
                                <>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('orders')
                                                .update({
                                                    status: 'delivered',
                                                    delivered_at: new Date().toISOString(),
                                                    updated_at: new Date().toISOString()
                                                })
                                                .eq('id', longPressOrder.id);
                                            if (!error) {
                                                toast({ title: '→ Entregue' });
                                                loadOrders();
                                            }
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        Marcar Entregue →
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            const { error } = await supabase
                                                .from('orders')
                                                .update({ status: 'preparing', updated_at: new Date().toISOString() })
                                                .eq('id', longPressOrder.id);
                                            if (!error) {
                                                toast({ title: '← Voltou para Produção' });
                                                loadOrders();
                                            }
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        ← Voltar para Produção
                                    </Button>
                                </>
                            )}
                            {longPressOrder.status === 'delivered' && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={async () => {
                                        const { error } = await supabase
                                            .from('orders')
                                            .update({ status: 'ready', delivered_at: null, updated_at: new Date().toISOString() })
                                            .eq('id', longPressOrder.id);
                                        if (!error) {
                                            toast({ title: '← Voltou para Pronto' });
                                            loadOrders();
                                        }
                                        setLongPressOrder(null);
                                    }}
                                >
                                    ← Voltar para Pronto
                                </Button>
                            )}

                            <div className="pt-2">
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={() => setLongPressOrder(null)}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pedidos;
