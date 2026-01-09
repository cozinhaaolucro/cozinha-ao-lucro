import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added Tabs
import { Plus, Phone, Filter, Pencil, Download, Upload, Copy, Trash2, PackageCheck, ChevronRight } from 'lucide-react';
import { getOrders, deductStockFromOrder, updateOrderStatus, deleteOrder } from '@/lib/database'; // Added updateOrderStatus, deleteOrder
import { exportToExcel, importFromExcel } from '@/lib/excel';
import { supabase } from '@/lib/supabase';
import type { OrderWithDetails } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile'; // Added useIsMobile
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

    const isDrawerOpenRef = useRef(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();


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

        // Scheduling Logic: Hide future pending orders from "To Do" unless explicitly filtered
        if (order.status === 'pending' && order.start_date && !dateFilter.start && !dateFilter.end) {
            const startDate = parseLocalDate(order.start_date);
            startDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate > today) return false;
        }

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

    const handleDeleteOrder = async (id: string) => {
        const { error } = await deleteOrder(id);
        if (!error) {
            toast({ title: 'Pedido excluído' });
            loadOrders();
        } else {
            toast({ title: 'Erro ao excluir pedido', variant: 'destructive' });
        }
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

    const renderColumn = (status: string, config: typeof STATUS_COLUMNS[keyof typeof STATUS_COLUMNS]) => {
        const statusOrders = filteredOrders.filter((o) => o.status === status);

        const isEmpty = statusOrders.length === 0;

        return (
            <div
                key={status}
                className="space-y-3 h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
            >
                {!isMobile && (
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{config.label}</h3>
                        <Badge variant="secondary">{statusOrders.length}</Badge>
                    </div>
                )}

                <div className={isMobile ? "space-y-3 pb-20" : "space-y-2 min-h-[400px]"}>
                    {isEmpty ? (
                        <Card className={`${config.color} border-2 border-dashed h-full min-h-[150px]`}>
                            <CardContent className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center h-full">
                                {isMobile ? "Nenhuem pedido" : "Arraste pedidos aqui"}
                            </CardContent>
                        </Card>
                    ) : (
                        statusOrders.map((order) => (
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
                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                }}
                                onTouchMove={() => {
                                    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                                }}
                                className={`${config.color} border-2 hover:shadow-md transition-all cursor-move group ${draggedOrder === order.id ? 'opacity-50' : ''}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="text-sm flex items-center justify-between">
                                        <div className="font-semibold" onClick={() => handleCustomerClick(order.customer)}>
                                            <span className="hover:underline cursor-pointer text-primary">
                                                {order.customer?.name || 'Cliente não informado'}
                                            </span>
                                            <div className="text-xs text-muted-foreground font-normal">
                                                #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                            </div>
                                        </div>

                                        <div className={isMobile ? "flex gap-1" : "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDuplicate(order);
                                                }}
                                                title="Duplicar Pedido"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingOrder(order);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-red-600 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Excluir este pedido?')) {
                                                        handleDeleteOrder(order.id);
                                                    }
                                                }}
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            {order.customer?.phone && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWhatsApp(order);
                                                    }}
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between">
                                            <span><strong>Entrega:</strong> {formatDate(order.delivery_date)}</span>
                                            <span className="font-bold text-base">R$ {order.total_value.toFixed(2)}</span>
                                        </div>

                                        {order.items && order.items.length > 0 && (
                                            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t text-left">
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <p key={idx} className="line-clamp-1">• {item.product_name} (x{item.quantity})</p>
                                                ))}
                                                {order.items.length > 2 && <p className="text-[10px] italic">+ {order.items.length - 2} itens...</p>}
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
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-sm text-muted-foreground">Visão Macro: Planejamento, Agendamento e Histórico de Todos os Pedidos.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                toast({ title: 'Importação', description: 'Em breve: Importação inteligente de pedidos.' });
                                e.target.value = '';
                            }}
                        />
                        <Button variant="outline" size="icon" title="Importar Excel" className="w-full sm:w-10">
                            <Upload className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleExport} title="Exportar Excel" className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4" />
                    </Button>
                    <Button className="gap-2 flex-[2] sm:flex-none" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Novo
                    </Button>
                </div>
            </div>

            {/* Date Filters */}
            <Card>
                <CardContent className="p-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <Input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                className="h-9 text-xs"
                            />
                            <span className="text-sm text-muted-foreground">até</span>
                            <Input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                className="h-9 text-xs"
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

            {/* Kanban Board - Layout Switch */}
            {isMobile ? (
                <Tabs defaultValue="pending" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {Object.entries(STATUS_COLUMNS).map(([status, config]) => {
                            const count = filteredOrders.filter((o) => o.status === status).length;
                            return (
                                <TabsTrigger key={status} value={status} className="text-xs px-1 h-10 flex flex-row items-center justify-center gap-1 font-medium bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1">
                                    <span>{config.label.split(' ')[0]}</span>
                                    {count > 0 && (
                                        <span className="bg-primary/10 text-primary data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                                            {count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    {Object.entries(STATUS_COLUMNS).map(([status, config]) => (
                        <TabsContent key={status} value={status} className="flex-1 mt-0">
                            {renderColumn(status, config)}
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {Object.entries(STATUS_COLUMNS).map(([status, config]) => renderColumn(status, config))}
                </div>
            )}

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
                onOpenChange={setIsDrawerOpen} // Fixed Prop Name
                onUpdate={loadOrders} // Fixed Prop Name (was missing or inferred)
            />

            <SendMessageDialog
                open={isMessageDialogOpen} // Fixed Prop Name
                onOpenChange={setIsMessageDialogOpen} // Fixed Prop Name
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
                                #{longPressOrder.display_id ? String(longPressOrder.display_id).padStart(4, '0') : (longPressOrder.order_number || longPressOrder.id.slice(0, 4))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {longPressOrder.customer?.name || 'Sem cliente'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Optimized Action Buttons logic using updateOrderStatus */}
                            {longPressOrder.status === 'pending' && (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-500"
                                    onClick={async () => {
                                        await updateOrderStatus(longPressOrder.id, 'preparing', longPressOrder.status);
                                        toast({ title: '→ Em Produção - Estoque Deduzido' });
                                        loadOrders();
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
                                            await updateOrderStatus(longPressOrder.id, 'ready', longPressOrder.status);
                                            toast({ title: '→ Pronto' });
                                            loadOrders();
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        Marcar Pronto →
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            await updateOrderStatus(longPressOrder.id, 'pending', longPressOrder.status);
                                            toast({ title: '← Voltou para A Fazer - Estoque Estornado' });
                                            loadOrders();
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        ← Voltar para A Fazer
                                    </Button>
                                </>
                            )}
                            {/* ... Other status conditions using updateOrderStatus ... */}
                            {longPressOrder.status === 'ready' && (
                                <>
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-500"
                                        onClick={async () => {
                                            await updateOrderStatus(longPressOrder.id, 'delivered', longPressOrder.status);
                                            toast({ title: '→ Entregue' });
                                            loadOrders();
                                            setLongPressOrder(null);
                                        }}
                                    >
                                        Marcar Entregue →
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={async () => {
                                            await updateOrderStatus(longPressOrder.id, 'preparing', longPressOrder.status);
                                            toast({ title: '← Voltou para Produção' });
                                            loadOrders();
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
                                        await updateOrderStatus(longPressOrder.id, 'ready', longPressOrder.status);
                                        toast({ title: '← Voltou para Pronto' });
                                        loadOrders();
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
