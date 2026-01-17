import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Phone, Filter, Pencil, Download, Upload, Copy, Trash2, PackageCheck, ChevronRight, ChefHat, FileSpreadsheet, FileDown, FileText, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createStockMovement } from '@/lib/database';
import { StockAlertBadge } from '@/components/orders/StockAlertBadge';
import { getOrders, updateOrderStatus, updateOrderPositions, deleteOrder, createOrder, createCustomer, getProducts, getCustomers, getIngredients } from '@/lib/database';
import { exportToExcel, exportToCSV, importFromExcel, getValue } from '@/lib/excel';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import { supabase } from '@/lib/supabase';
import type { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import confetti from 'canvas-confetti'; // Keep if used or remove if unused, keeping for safety
import { motion, AnimatePresence } from 'framer-motion';
import ClientProfileDrawer from '@/components/crm/ClientProfileDrawer';
import { formatUnit } from '@/lib/utils';
import SendMessageDialog from '@/components/crm/SendMessageDialog';
import { Customer, OrderStatus } from '@/types/database';

// DND Kit Imports
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    TouchSensor,
    MouseSensor,
    useDroppable,
    pointerWithin,
    rectIntersection,
    getFirstCollision,
    CollisionDetection
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableOrderCard = ({ order, statusConfig, isMobile, draggedOrderId, ...props }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: order.id,
        data: {
            type: 'Order',
            order
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Late Check
    const isLate = React.useMemo(() => {
        if (order.status === 'delivered' || order.status === 'cancelled') return false;
        if (!order.delivery_date) return false;
        const delivery = parseLocalDate(order.delivery_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return delivery < today;
    }, [order]);

    // Determine Status Key for classes
    const statusKey = order.status;
    // const isReadyStatus = order.status === 'ready' && !isLate; 

    // Inline styles for dynamic theming using CSS variables
    const cardStyle = {
        backgroundColor: 'hsl(var(--card))', // Clean White/Card BG
        borderLeft: `3px solid hsl(var(--status-${statusKey}-base))`,
        boxShadow: isDragging
            ? '0 10px 15px -3px hsla(var(--shadow-color), 0.1), 0 4px 6px -2px hsla(var(--shadow-color), 0.05)'
            : '0 2px 4px -1px hsla(var(--shadow-color), 0.08), 0 1px 2px -1px hsla(var(--shadow-color), 0.04)',
        color: 'hsl(var(--foreground))',
    };

    // Pass color base for children (badges, icons)
    const baseColor = `hsl(var(--status-${statusKey}-base))`;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-50 p-2"
            >
                <Card
                    className="h-[150px] border border-dashed"
                    style={{
                        backgroundColor: 'hsl(var(--muted)/0.3)',
                        borderColor: `hsl(var(--status-${statusKey}-base))`
                    }}
                />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
            {React.cloneElement(props.children, { isLate, cardStyle, baseColor, statusKey })}
        </div>
    );
};

const STATUS_COLUMNS = {
    pending: { label: 'A Fazer', key: 'pending' },
    preparing: { label: 'Em Produção', key: 'preparing' },
    ready: { label: 'Pronto', key: 'ready' },
    delivered: { label: 'Entregue', key: 'delivered' },
};

const Pedidos = () => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [longPressOrder, setLongPressOrder] = useState<OrderWithDetails | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // CRM States
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [messageOrder, setMessageOrder] = useState<OrderWithDetails | null>(null);
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);

    // Duplicate Stock Alert States
    const [duplicatingOrder, setDuplicatingOrder] = useState<OrderWithDetails | null>(null);
    const [showDuplicateStockAlert, setShowDuplicateStockAlert] = useState(false);
    const [missingIngredientsForDuplicate, setMissingIngredientsForDuplicate] = useState<any[]>([]);
    const [isDuplicateRestocking, setIsDuplicateRestocking] = useState(false);

    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const loadOrders = async () => {
        const { data, error } = await getOrders();
        const { data: pData } = await getProducts();
        const { data: iData } = await getIngredients();

        if (!error && data) {
            setOrders(data);
        }
        if (pData) setProducts(pData as ProductWithIngredients[]);
        if (iData) setIngredients(iData);
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

    const calculateMissingStockForDuplicate = async (order: OrderWithDetails) => {
        const needed = new Map<string, { name: string; qty: number; unit: string }>();
        const ingredientIds = new Set<string>();

        for (const item of order.items) {
            const product = products.find(p => p.id === item.product_id);
            if (product?.product_ingredients) {
                product.product_ingredients.forEach((pi: any) => {
                    const ing = pi.ingredient;
                    if (ing) {
                        const total = (pi.quantity * item.quantity);
                        const existing = needed.get(ing.id) || { name: ing.name, qty: 0, unit: ing.unit };
                        existing.qty += total;
                        needed.set(ing.id, existing);
                        ingredientIds.add(ing.id);
                    }
                });
            }
        }

        if (ingredientIds.size === 0) return [];

        const { data: freshIngredients } = await supabase
            .from('ingredients')
            .select('id, stock_quantity, name, unit')
            .in('id', Array.from(ingredientIds));

        const stockMap = new Map<string, number>();
        freshIngredients?.forEach((ing: any) => {
            stockMap.set(ing.id, ing.stock_quantity);
        });

        const missing: any[] = [];
        needed.forEach((val, key) => {
            const currentStock = stockMap.get(key) || 0;
            if (val.qty > currentStock) {
                missing.push({
                    id: key,
                    name: val.name,
                    missing: val.qty - currentStock,
                    current: currentStock,
                    needed: val.qty,
                    unit: val.unit
                });
            }
        });

        return missing;
    };

    const processDuplicateOrderCreation = async (order: OrderWithDetails) => {
        try {
            const newOrder = {
                customer_id: order.customer_id,
                order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                status: 'pending' as const,
                total_value: order.total_value || 0,
                total_cost: order.total_cost || 0,
                delivery_date: null,
                delivery_time: null,
                delivery_method: order.delivery_method || 'pickup',
                delivery_fee: order.delivery_fee || 0,
                payment_method: order.payment_method || 'pix',
                notes: order.notes,
            };

            const newItems = order.items.map(item => ({
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
                unit_cost: item.unit_cost || 0
            }));

            // @ts-ignore
            const { data, error } = await createOrder(newOrder, newItems);

            if (error) throw error;

            toast({
                title: 'Pedido duplicado',
                description: 'O pedido foi duplicado com sucesso para a aba "A Fazer".',
            });
            loadOrders();
        } catch (error: any) {
            toast({
                title: 'Erro ao duplicar',
                description: `Erro: ${error?.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleDuplicateAutoRestock = async () => {
        if (!duplicatingOrder) return;
        setIsDuplicateRestocking(true);
        try {
            await Promise.all(missingIngredientsForDuplicate.map(async (item) => {
                await createStockMovement({
                    ingredient_id: item.id,
                    type: 'in',
                    quantity: item.missing,
                    reason: `Auto-refill para Duplicação de Pedido`
                });
            }));

            toast({ title: 'Estoque atualizado automaticamente!' });
            setShowDuplicateStockAlert(false);
            await processDuplicateOrderCreation(duplicatingOrder);
            setDuplicatingOrder(null);
        } catch (error) {
            console.error('Auto-restock error', error);
            toast({ title: 'Erro ao atualizar estoque', variant: 'destructive' });
        } finally {
            setIsDuplicateRestocking(false);
        }
    };

    const handleDuplicate = async (order: OrderWithDetails) => {
        if (order.status === 'pending') {
            await processDuplicateOrderCreation(order);
            return;
        }

        const missing = await calculateMissingStockForDuplicate(order);

        if (missing.length > 0) {
            setDuplicatingOrder(order);
            setMissingIngredientsForDuplicate(missing);
            setShowDuplicateStockAlert(true);
        } else {
            await processDuplicateOrderCreation(order);
        }
    };

    const handleCustomerClick = (customer: Customer | null) => {
        if (customer) {
            setSelectedCustomer(customer);
            setIsDrawerOpen(true);
        }
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

    const handleExport = (format: 'excel' | 'csv') => {
        const dataToExport = filteredOrders.map(o => ({
            Status: STATUS_COLUMNS[o.status as keyof typeof STATUS_COLUMNS]?.label || o.status,
            Cliente: o.customer?.name || 'Não informado',
            'Data Entrega': o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('pt-BR') : '-',
            Items: o.items?.map(i => `${i.product_name} (${i.quantity})`).join(', ') || '',
            'Valor Total': Number(o.total_value.toFixed(2)),
            CriadoEm: new Date(o.created_at).toLocaleDateString('pt-BR')
        }));
        if (format === 'csv') {
            exportToCSV(dataToExport, 'pedidos_cozinha_ao_lucro');
        } else {
            exportToExcel(dataToExport, 'pedidos_cozinha_ao_lucro');
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (order.status === 'cancelled') return false;
        if (!dateFilter?.from) return true;
        if (!order.delivery_date) return false;

        const orderDate = parseLocalDate(order.delivery_date);
        orderDate.setHours(0, 0, 0, 0);

        const start = new Date(dateFilter.from);
        start.setHours(0, 0, 0, 0);

        if (orderDate < start) return false;

        if (dateFilter.to) {
            const end = new Date(dateFilter.to);
            end.setHours(23, 59, 59, 999);
            if (orderDate > end) return false;
        }

        return true;
    });

    const customCollisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        return rectIntersection(args);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeOrder = orders.find(o => o.id === activeId);
        const overOrder = orders.find(o => o.id === overId);

        if (!activeOrder) return;

        const activeStatus = activeOrder.status;
        let overStatus: OrderStatus | undefined;

        if (overId in STATUS_COLUMNS) {
            overStatus = overId as OrderStatus;
        } else if (overOrder) {
            overStatus = overOrder.status;
        }

        if (!overStatus || activeStatus === overStatus) return;

        setOrders((prev) => {
            return prev.map(o =>
                o.id === activeId ? { ...o, status: overStatus! } : o
            );
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeOrder = orders.find(o => o.id === activeId);
        if (!activeOrder) return;

        const currentStatus = activeOrder.status;
        const statusOrders = orders
            .filter(o => o.status === currentStatus)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        const oldIndex = statusOrders.findIndex(o => o.id === activeId);
        let newIndex: number;

        if (overId in STATUS_COLUMNS) {
            newIndex = statusOrders.length;
        } else {
            newIndex = statusOrders.findIndex(o => o.id === overId);
            if (newIndex === -1) newIndex = statusOrders.length;
        }

        let reorderedList = statusOrders;
        if (oldIndex !== newIndex) {
            reorderedList = arrayMove(statusOrders, oldIndex, newIndex);
        }

        const updates = reorderedList.map((order, index) => ({
            id: order.id,
            status: currentStatus,
            position: index
        }));

        setOrders(prev => {
            const otherOrders = prev.filter(o => o.status !== currentStatus);
            const updatedReordered = reorderedList.map((o, idx) => ({ ...o, position: idx }));
            return [...otherOrders, ...updatedReordered];
        });

        const { error } = await updateOrderPositions(updates);
        if (error) {
            toast({ title: 'Erro ao salvar ordem', variant: 'destructive' });
            loadOrders();
        }
    };

    const DroppableColumn = ({ status, children }: { status: string, children: React.ReactNode }) => {
        const { setNodeRef } = useDroppable({
            id: status,
        });
        return (
            <div ref={setNodeRef} className="h-full w-full flex-1 min-h-[150px]">
                {children}
            </div>
        );
    };

    const renderColumn = (status: string, config: typeof STATUS_COLUMNS[keyof typeof STATUS_COLUMNS]) => {
        const statusOrders = filteredOrders
            .filter((o) => o.status === status)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
        const isEmpty = statusOrders.length === 0;

        return (
            <DroppableColumn status={status}>
                <div className="h-full flex flex-col space-y-3">
                    {!isMobile && (
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground/80">{config.label}</h3>
                            <Badge variant="secondary" className="bg-muted text-muted-foreground">{statusOrders.length}</Badge>
                        </div>
                    )}
                    <SortableContext
                        id={status}
                        items={statusOrders.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className={isMobile ? "space-y-3 pb-20 min-h-[150px]" : "space-y-2 min-h-[400px]"} >
                            {isEmpty ? (
                                <Card className="border-2 border-dashed h-full min-h-[150px] flex flex-col items-center justify-center p-6 text-center bg-muted/20 border-border/60">
                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                        <PackageCheck className="w-6 h-6 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground/60 leading-tight">
                                        {status === 'pending' && "Tudo limpo por aqui!"}
                                        {status === 'preparing' && "Arraste para produzir."}
                                        {status === 'ready' && "Finalize a produção."}
                                        {status === 'delivered' && "Entregas concluídas."}
                                    </p>
                                </Card>
                            ) : (
                                statusOrders.map((order) => (
                                    <SortableOrderCard
                                        key={order.id}
                                        order={order}
                                        statusConfig={config}
                                        isMobile={isMobile}
                                        draggedOrderId={activeId}
                                    >
                                        <CardWithStyle
                                            activeId={activeId}
                                            loadOrders={loadOrders}
                                            products={products}
                                            ingredients={ingredients}
                                            handleCustomerClick={handleCustomerClick}
                                            handleDuplicate={handleDuplicate}
                                            setEditingOrder={setEditingOrder}
                                            handleDeleteOrder={handleDeleteOrder}
                                            handleWhatsApp={handleWhatsApp}
                                            setLongPressOrder={setLongPressOrder}
                                            isMobile={isMobile}
                                            longPressTimerRef={longPressTimerRef}
                                            formatDate={formatDate}
                                            order={order}
                                        />
                                    </SortableOrderCard>
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>
            </DroppableColumn>
        );
    };

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
                        <p className="text-sm text-muted-foreground">Visão Macro: Planejamento, Agendamento e Histórico de Todos os Pedidos.</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="file"
                            id="pedidos-import-input"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                    const data: any[] = await importFromExcel(file);
                                    const { data: existingCustomers } = await getCustomers();
                                    const { data: existingProducts } = await getProducts();
                                    let successCount = 0;
                                    let errorCount = 0;

                                    for (const row of data) {
                                        const customerName = getValue(row, ['Cliente', 'name', 'Customer', 'cliente', 'Nome']);
                                        if (!customerName || customerName === 'Não informado') continue;

                                        let customerId = existingCustomers?.find(c => c.name.toLowerCase() === customerName.toLowerCase())?.id;
                                        if (!customerId) {
                                            const { data: newCust, error: custError } = await createCustomer({
                                                name: customerName,
                                                email: null, phone: null, address: null, notes: null, last_order_date: null
                                            });
                                            if (newCust && !custError) {
                                                customerId = newCust.id;
                                                existingCustomers?.push(newCust);
                                            } else {
                                                errorCount++; continue;
                                            }
                                        }

                                        const statusLabel = getValue(row, ['Status', 'status', 'Estado', 'Situacao']);
                                        const statusKey = Object.keys(STATUS_COLUMNS).find(key =>
                                            STATUS_COLUMNS[key as keyof typeof STATUS_COLUMNS].label === statusLabel ||
                                            key === statusLabel?.toLowerCase()
                                        ) || 'pending';

                                        const itemsString = getValue(row, ['Items', 'items', 'Itens', 'Produtos', 'products']) || '';
                                        const items: any[] = [];
                                        if (itemsString) {
                                            const itemParts = itemsString.split(',').map((s: string) => s.trim());
                                            for (const part of itemParts) {
                                                const match = part.match(/^(.*)\s\((\d+)\)$/);
                                                const pName = match ? match[1].trim() : part;
                                                const qty = match ? parseInt(match[2]) : 1;
                                                const product = existingProducts?.find(p => p.name.toLowerCase() === pName.toLowerCase());
                                                if (product) {
                                                    items.push({
                                                        product_id: product.id,
                                                        product_name: product.name,
                                                        quantity: qty,
                                                        unit_price: product.selling_price,
                                                        subtotal: product.selling_price * qty
                                                    });
                                                }
                                            }
                                        }

                                        const deliveryDateVal = getValue(row, ['Data Entrega', 'delivery_date', 'Data', 'Date', 'Entrega']);
                                        const deliveryDate = deliveryDateVal ? new Date(deliveryDateVal).toISOString() : null;

                                        const orderData = {
                                            customer_id: customerId,
                                            status: statusKey as OrderStatus,
                                            delivery_date: deliveryDate,
                                            delivery_time: null,
                                            total_value: items.reduce((acc, item) => acc + item.subtotal, 0),
                                            notes: 'Importado via Excel',
                                            order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
                                        };

                                        if (items.length > 0) {
                                            // @ts-ignore
                                            const { error } = await createOrder({ ...orderData, total_cost: 0, display_id: 0, delivery_method: 'pickup', delivery_fee: 0, payment_method: 'pix', google_event_id: null, production_started_at: null, production_completed_at: null, production_duration_minutes: null, delivered_at: null, start_date: null }, items);
                                            if (!error) successCount++;
                                            else errorCount++;
                                        } else {
                                            errorCount++;
                                        }
                                    }
                                    toast({
                                        title: 'Importação Concluída',
                                        description: `${successCount} pedidos criados. ${errorCount} erros/ignorados.`,
                                        variant: successCount > 0 ? 'default' : 'destructive'
                                    });
                                    loadOrders();
                                } catch (err) {
                                    console.error("Import error", err);
                                    toast({ title: 'Erro na importação', description: 'Falha ao ler arquivo', variant: 'destructive' });
                                }
                                e.target.value = '';
                            }}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            title="Importar Excel"
                            className="flex-1 sm:flex-none sm:w-10"
                            onClick={() => document.getElementById('pedidos-import-input')?.click()}
                        >
                            <Upload className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="flex-1 sm:flex-none" title="Exportar / Baixar Modelo">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Planilha</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleExport('excel')}>
                                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    <FileText className="w-4 h-4 mr-2" /> CSV (.csv)
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Template</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => import('@/lib/excel').then(mod => mod.downloadTemplate(['Cliente', 'Status', 'Data Entrega', 'Items', 'Valor Total'], 'pedidos'))}>
                                    <FileDown className="w-4 h-4 mr-2" /> Modelo de Importação
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="gap-2 flex-[2] sm:flex-none" onClick={() => setIsDialogOpen(true)}>
                            <Plus className="w-4 h-4" />
                            Novo
                        </Button>
                    </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/50 shadow-sm w-fit border-l-4 border-l-primary/50">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
                    </div>
                    <DateRangePicker
                        date={dateFilter}
                        setDate={setDateFilter}
                        className="w-[250px]"
                    />
                    {(dateFilter?.from) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDateFilter(undefined)}
                        >
                            Limpar
                        </Button>
                    )}
                </div>

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
                    onOpenChange={setIsDrawerOpen}
                    onUpdate={loadOrders}
                />

                <SendMessageDialog
                    open={isMessageDialogOpen}
                    onOpenChange={setIsMessageDialogOpen}
                    order={messageOrder}
                />

                {/* Duplicate Order Stock Alert */}
                <AlertDialog open={showDuplicateStockAlert} onOpenChange={setShowDuplicateStockAlert}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                                <AlertCircle className="h-5 w-5" />
                                Estoque Insuficiente
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Os seguintes ingredientes não têm estoque suficiente para este pedido:
                                <ul className="mt-2 text-sm space-y-2 bg-muted/50 p-3 rounded max-h-[200px] overflow-auto">
                                    {missingIngredientsForDuplicate.map(item => (
                                        <li key={item.id} className="space-y-1 pb-2 border-b border-muted last:border-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">{item.name}</span>
                                                <span className="font-bold text-red-500">
                                                    Falta: {item.missing.toFixed(2)} {formatUnit(item.missing, item.unit)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex gap-4">
                                                <span>Disponível: {Math.max(0, item.current).toFixed(2)}</span>
                                                <span>Este pedido: {item.needed.toFixed(2)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-3 font-medium">
                                    Deseja adicionar a quantidade faltante ao estoque automaticamente e prosseguir?
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="sm:justify-between">
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    setShowDuplicateStockAlert(false);
                                    if (duplicatingOrder) {
                                        processDuplicateOrderCreation(duplicatingOrder);
                                        setDuplicatingOrder(null);
                                    }
                                }}
                                disabled={isDuplicateRestocking}
                            >
                                Desconsiderar e criar
                            </Button>

                            <div className="flex gap-2">
                                <AlertDialogCancel
                                    disabled={isDuplicateRestocking}
                                    onClick={() => setDuplicatingOrder(null)}
                                >
                                    Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDuplicateAutoRestock();
                                    }}
                                    className="bg-amber-600 hover:bg-[hsl(182,16%,55%)] hover:text-white"
                                    disabled={isDuplicateRestocking}
                                >
                                    {isDuplicateRestocking ? 'Atualizando...' : 'Regularizar e Criar'}
                                </AlertDialogAction>
                            </div>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

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
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setLongPressOrder(null);
                                        setEditingOrder(longPressOrder);
                                    }}
                                >
                                    <Pencil className="w-4 h-4 mr-2" /> Editar
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 text-destructive hover:bg-red-50"
                                    onClick={() => {
                                        if (confirm('Excluir?')) handleDeleteOrder(longPressOrder.id);
                                        setLongPressOrder(null);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <DragOverlay>
                    {activeOrder ? (
                        <div className="opacity-90 rotate-3 cursor-grabbing scale-105">
                            <CardWithStyle
                                activeId={activeId}
                                loadOrders={loadOrders}
                                products={products}
                                ingredients={ingredients}
                                handleCustomerClick={handleCustomerClick}
                                handleDuplicate={handleDuplicate}
                                setEditingOrder={setEditingOrder}
                                handleDeleteOrder={handleDeleteOrder}
                                handleWhatsApp={handleWhatsApp}
                                setLongPressOrder={setLongPressOrder}
                                isMobile={isMobile}
                                longPressTimerRef={longPressTimerRef}
                                formatDate={formatDate}
                                order={activeOrder}
                                // Props for styling in overlay
                                isLate={activeOrder.status !== 'delivered' && activeOrder.status !== 'cancelled' && activeOrder.delivery_date ? parseLocalDate(activeOrder.delivery_date) < (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })() : false}
                                cardStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderLeft: `3px solid hsl(var(--status-${activeOrder.status === 'delivered' || activeOrder.status === 'cancelled' ? activeOrder.status : (activeOrder.delivery_date && parseLocalDate(activeOrder.delivery_date) < new Date(new Date().setHours(0, 0, 0, 0)) ? 'late' : activeOrder.status)}-base))`,
                                    boxShadow: '0 10px 15px -3px hsla(var(--shadow-color), 0.1), 0 4px 6px -2px hsla(var(--shadow-color), 0.05)'
                                }}
                                baseColor={`hsl(var(--status-${activeOrder.status}-base))`} // Approximation
                                statusKey={activeOrder.status}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

// Sub-component for the card content 
const CardWithStyle = ({
    isLate,
    cardStyle,
    baseColor,
    statusKey,
    order,
    activeId,
    loadOrders,
    products,
    ingredients,
    handleCustomerClick,
    handleDuplicate,
    setEditingOrder,
    handleDeleteOrder,
    handleWhatsApp,
    setLongPressOrder,
    isMobile,
    longPressTimerRef,
    formatDate
}: any) => {
    return (
        <Card
            className={`transition-all cursor-move group relative border border-border/40 rounded-lg hover:border-border/80 ${activeId === order.id ? 'opacity-30' : ''}`}
            style={cardStyle}
            onTouchStart={() => {
                longPressTimerRef.current = setTimeout(() => {
                    setLongPressOrder(order);
                }, 500);
            }}
            onTouchEnd={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
            onTouchMove={() => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }}
        >
            <StockAlertBadge
                order={order}
                products={products}
                ingredients={ingredients}
                onStockUpdate={loadOrders}
            />
            <CardHeader className="pb-1 pt-2.5 pl-4 pr-3">
                <div className="text-sm flex items-start justify-between">
                    <div className="font-semibold flex flex-col gap-0.5" onClick={() => handleCustomerClick(order.customer)}>
                        <span
                            className="hover:underline cursor-pointer text-sm font-medium tracking-tight"
                            style={{ color: 'hsl(var(--foreground))' }} // Text Main
                        >
                            {order.customer?.name || 'Cliente não informado'}
                        </span>
                        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                        </div>
                    </div>

                    <div className={isMobile ? "flex gap-0.5" : "flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"}>
                        <ActionIcon Icon={Copy} onClick={(e: any) => { e.stopPropagation(); handleDuplicate(order); }} color={baseColor} title="Duplicar" />
                        <ActionIcon Icon={Pencil} onClick={(e: any) => { e.stopPropagation(); setEditingOrder(order); }} color={baseColor} title="Editar" />
                        <ActionIcon Icon={Trash2} onClick={(e: any) => { e.stopPropagation(); if (confirm('Excluir?')) handleDeleteOrder(order.id); }} color={baseColor} title="Excluir" />
                        {order.customer?.phone && (
                            <ActionIcon Icon={Phone} onClick={(e: any) => { e.stopPropagation(); handleWhatsApp(order); }} color={baseColor} title="WhatsApp" />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-2 pl-4 pr-3">
                <div className="grid gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            {order.delivery_date ? formatDate(order.delivery_date) : 'Sem data'}
                        </span>
                        <span className="font-medium text-sm tracking-normal" style={{ color: baseColor }}>
                            R$
                            <span style={{ marginLeft: '4px' }}>
                                {order.total_value.toFixed(2)}
                            </span>
                        </span>
                    </div>

                    <div className="flex gap-1.5 flex-wrap items-center">
                        {/* Badge Pill Logic - More Professional Look */}
                        <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 h-auto rounded-md border border-opacity-20 font-medium bg-opacity-10"
                            style={{
                                backgroundColor: `hsla(var(--status-${statusKey}-base), 0.08)`,
                                borderColor: `hsla(var(--status-${statusKey}-base), 0.25)`,
                                color: baseColor
                            }}
                        >
                            {order.payment_method === 'credit_card' && 'Crédito'}
                            {order.payment_method === 'debit_card' && 'Débito'}
                            {order.payment_method === 'pix' && 'Pix'}
                            {order.payment_method === 'cash' && 'Dinheiro'}
                            {!order.payment_method && 'Pix'}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 h-auto rounded-md font-medium bg-muted text-muted-foreground hover:bg-muted"
                        >
                            {order.delivery_method === 'delivery' ? 'Delivery' : 'Retirada'}
                        </Badge>
                        {isLate && (
                            <Badge className="text-[10px] px-2 py-0.5 h-auto rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-50">
                                Atrasado
                            </Badge>
                        )}
                    </div>

                    {order.items && order.items.length > 0 && (
                        <div className="text-xs mt-1 pt-1.5 border-t border-border/40 text-left" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {order.items.slice(0, 3).map((item: any, idx: number) => (
                                <p key={idx} className="line-clamp-1 flex items-center gap-1.5 py-0.5">
                                    <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0"></span>
                                    <span className="font-medium text-foreground/80">{item.product_name}</span>
                                    <span className="opacity-60 text-[10px]">(x{item.quantity})</span>
                                </p>
                            ))}
                            {order.items.length > 3 && <p className="text-[10px] italic opacity-50 pl-2.5 mt-0.5">+ {order.items.length - 3} itens...</p>}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const ActionIcon = ({ Icon, onClick, color, title }: any) => (
    <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-muted rounded-full transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClick}
        title={title}
    >
        <Icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" style={{ color: color, strokeWidth: 1.5 }} />
    </Button>
);

export default Pedidos;
