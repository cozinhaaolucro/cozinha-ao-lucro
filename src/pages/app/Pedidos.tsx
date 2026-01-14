import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Added Tabs
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
import { supabase } from '@/lib/supabase';
import type { OrderWithDetails, ProductWithIngredients, Ingredient } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile'; // Added useIsMobile
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import ClientProfileDrawer from '@/components/crm/ClientProfileDrawer';
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
const SortableOrderCard = ({ order, config, isMobile, draggedOrderId, ...props }: any) => {
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

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 p-2"
            >
                <Card className={`h-[150px] ${config.color} border-2 border-dashed`} />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-manipulation">
            {props.children}
        </div>
    );
};

const STATUS_COLUMNS = {
    pending: { label: 'A Fazer', color: 'bg-yellow-50 border-yellow-200' },
    preparing: { label: 'Em Produção', color: 'bg-blue-50 border-blue-200' },
    ready: { label: 'Pronto', color: 'bg-green-50 border-green-200' },
    delivered: { label: 'Entregue', color: 'bg-gray-50 border-gray-200' },
};

const Pedidos = () => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [products, setProducts] = useState<ProductWithIngredients[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
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
    const [missingIngredientsForDuplicate, setMissingIngredientsForDuplicate] = useState<Array<{ id: string; name: string; missing: number; current: number; needed: number; unit: string }>>([]);
    const [isDuplicateRestocking, setIsDuplicateRestocking] = useState(false);

    const isDrawerOpenRef = useRef(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Delay for touch to allow scrolling
                tolerance: 5,
            },
        })
    );

    const [activeId, setActiveId] = useState<string | null>(null);


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

    // Calculate missing stock for order duplication
    const calculateMissingStockForDuplicate = async (order: OrderWithDetails) => {
        // 1. Identify all needed ingredients for this order
        const needed = new Map<string, { name: string; qty: number; unit: string }>();
        const ingredientIds = new Set<string>();

        // For each item in the order, get the product and its ingredients
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

        // 2. Fetch fresh stock data from database
        const { data: freshIngredients } = await supabase
            .from('ingredients')
            .select('id, stock_quantity, name, unit')
            .in('id', Array.from(ingredientIds));

        const stockMap = new Map<string, number>();
        freshIngredients?.forEach((ing: any) => {
            stockMap.set(ing.id, ing.stock_quantity);
        });

        // 3. Check missing ingredients
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

    // Process duplicate order creation (without stock check)
    const processDuplicateOrderCreation = async (order: OrderWithDetails) => {
        try {
            // Explicitly construct the new order object with only valid fields
            // Only include columns that exist in the orders table
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

            console.log('=== DUPLICATE ORDER DEBUG ===');
            console.log('New Order Object:', JSON.stringify(newOrder, null, 2));
            console.log('New Items:', JSON.stringify(newItems, null, 2));

            // @ts-ignore - bypassing strict Omit checks for easier duplication logic
            const { data, error } = await createOrder(newOrder, newItems);

            console.log('Create Order Result - Data:', data);
            console.log('Create Order Result - Error:', error);

            if (error) {
                console.error('Create Order Error Details:', {
                    message: error.message,
                    details: (error as any).details,
                    hint: (error as any).hint,
                    code: (error as any).code,
                });
                throw error;
            }

            toast({
                title: 'Pedido duplicado',
                description: 'O pedido foi duplicado com sucesso para a aba "A Fazer".',
            });
            loadOrders();
        } catch (error: any) {
            console.error('=== DUPLICATE ERROR ===');
            console.error('Full Error Object:', error);
            console.error('Error Message:', error?.message);
            console.error('Error Details:', error?.details);
            console.error('Error Hint:', error?.hint);
            console.error('Error Code:', error?.code);
            toast({
                title: 'Erro ao duplicar',
                description: `Erro: ${error?.message || 'Verifique o console para mais detalhes.'}`,
                variant: 'destructive',
            });
        }
    };

    // Handle auto restock for duplicate
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

    // Main duplicate handler with stock check
    const handleDuplicate = async (order: OrderWithDetails) => {
        // If order is already in 'pending' status, duplicate directly without stock check
        // (Stock is only deducted when moving to 'preparing', so pending orders are safe)
        if (order.status === 'pending') {
            await processDuplicateOrderCreation(order);
            return;
        }

        // For orders in other statuses, check stock first
        // This ensures user is aware if there's not enough stock for when they move to production
        const missing = await calculateMissingStockForDuplicate(order);

        if (missing.length > 0) {
            // Show stock alert modal
            setDuplicatingOrder(order);
            setMissingIngredientsForDuplicate(missing);
            setShowDuplicateStockAlert(true);
        } else {
            // Stock is sufficient, proceed with duplication
            await processDuplicateOrderCreation(order);
        }
    };

    const handleCustomerClick = (customer: Customer | null) => {
        if (customer) {
            setSelectedCustomer(customer);
            setIsDrawerOpen(true);
        }
    };

    // Helper for Excel Import
    const getValue = (row: any, keys: string[]) => {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null) return row[key];
        }
        return null;
    };

    const filteredOrders = orders.filter((order) => {
        if (order.status === 'cancelled') return false;

        // Scheduling Logic disabled to prevent confusion
        // if (order.status === 'pending' && order.start_date && !dateFilter.start && !dateFilter.end) {
        //     const startDate = parseLocalDate(order.start_date);
        //     startDate.setHours(0, 0, 0, 0);
        //     const today = new Date();
        //     today.setHours(0, 0, 0, 0);
        //     if (startDate > today) return false;
        // }

        if (!dateFilter.start && !dateFilter.end) return true;

        if (!order.delivery_date) return false;
        const orderDate = parseLocalDate(order.delivery_date);
        orderDate.setHours(0, 0, 0, 0);

        const start = dateFilter.start ? new Date(dateFilter.start + 'T00:00:00') : null;
        const end = dateFilter.end ? new Date(dateFilter.end + 'T23:59:59.999') : null;

        if (start && orderDate < start) return false;
        if (end && orderDate > end) return false;
        return true;
    });


    // Custom Collision Detection Strategy
    const customCollisionDetection: CollisionDetection = (args) => {
        const pointerCollisions = pointerWithin(args);

        // If we hit an item natively with pointer, that's our best bet
        if (pointerCollisions.length > 0) {
            return pointerCollisions;
        }

        // If not, check if we are intersecting with a container (Column)
        // This is crucial for empty columns or sparse columns
        const rectCollisions = rectIntersection(args);
        return rectCollisions;
    };


    // DND Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find items
        const activeOrder = orders.find(o => o.id === activeId);
        const overOrder = orders.find(o => o.id === overId);

        if (!activeOrder) return;

        const activeStatus = activeOrder.status;

        // Determine status based on what we are over
        let overStatus: OrderStatus | undefined;

        if (overId in STATUS_COLUMNS) {
            // We are strictly over a column container
            overStatus = overId as OrderStatus;
        } else if (overOrder) {
            // We are over another order
            overStatus = overOrder.status;
        }

        if (!overStatus || activeStatus === overStatus) return;

        // Update local state immediately for visual feedback
        setOrders((prev) => {
            const activeItem = prev.find(i => i.id === activeId);
            if (!activeItem) return prev; // Safety

            // We need to move the item to the new list conceptually
            // We don't worry about exact index in DragOver mostly, just the ephemeral status change
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

        const currentStatus = activeOrder.status; // This SHOULD be the new status from DragOver

        // We assume activeOrder.status is already correct because of DragOver state updates.
        // However, we need to calculate the *exact position* (index) in the new list.

        const statusOrders = orders
            .filter(o => o.status === currentStatus)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        const oldIndex = statusOrders.findIndex(o => o.id === activeId);
        let newIndex: number;

        if (overId in STATUS_COLUMNS) {
            // We dropped on the container column itself.
            // If it's the same column we started in (rare if we have items), go to end?
            // Usually if we drop on container, we append to end.
            newIndex = statusOrders.length;
        } else {
            // We dropped on an item
            newIndex = statusOrders.findIndex(o => o.id === overId);

            // If we are dropping "below" or "above" depends on direction, 
            // but arrayMove handles index based logic. 
            // Generally dnd-kit sortable strategy handles "swapping" indices.

            // NOTE: If we just moved into this column, activeID might be at the end strictly in the array
            // but visually we dropped over overId.

            const isBelow = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
            const modifier = isBelow ? 1 : 0;
            // Actually, arrayMove/findIndex is usually sufficient if the indices are consistent.
            // But since we mutate state in DragOver, the indices might be transient.

            // Simplification: Trust the overId index.
            if (newIndex === -1) newIndex = statusOrders.length;
        }

        let reorderedList = statusOrders;

        // Correct the array move
        if (oldIndex !== newIndex) {
            reorderedList = arrayMove(statusOrders, oldIndex, newIndex);
        }

        // Generate updates for ALL items in this column to ensure consistency
        const updates = reorderedList.map((order, index) => ({
            id: order.id,
            status: currentStatus,
            position: index
        }));

        // Optimistic UI Update
        setOrders(prev => {
            // Remove all from this status
            const otherOrders = prev.filter(o => o.status !== currentStatus);
            // Add back reordered with new position
            const updatedReordered = reorderedList.map((o, idx) => ({ ...o, position: idx }));
            return [...otherOrders, ...updatedReordered];
        });

        // Persist
        const { error } = await updateOrderPositions(updates);
        if (error) {
            toast({ title: 'Erro ao salvar ordem', variant: 'destructive' });
            loadOrders(); // Revert
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
            Status: STATUS_COLUMNS[o.status]?.label || o.status,
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
                            <h3 className="font-semibold">{config.label}</h3>
                            <Badge variant="secondary">{statusOrders.length}</Badge>
                        </div>
                    )}

                    <SortableContext
                        id={status}
                        items={statusOrders.map(o => o.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className={isMobile ? "space-y-3 pb-20 min-h-[150px]" : "space-y-2 min-h-[400px]"} >
                            {isEmpty ? (
                                <Card className={`${config.color} border-2 border-dashed h-full min-h-[150px] flex flex-col items-center justify-center p-6 text-center`}>
                                    <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center mb-3">
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
                                        config={config}
                                        isMobile={isMobile}
                                        draggedOrderId={activeId}
                                    >
                                        <Card
                                            className={`${config.color} border-2 hover:shadow-md transition-all cursor-move group relative ${activeId === order.id ? 'opacity-30' : ''}`}
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
                                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
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
                                                            onPointerDown={(e) => e.stopPropagation()}
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
                                                            onPointerDown={(e) => e.stopPropagation()}
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
                                                                onPointerDown={(e) => e.stopPropagation()}
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
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700">
                                                            {order.payment_method === 'credit_card' && 'Crédito'}
                                                            {order.payment_method === 'debit_card' && 'Débito'}
                                                            {order.payment_method === 'pix' && 'Pix'}
                                                            {order.payment_method === 'cash' && 'Dinheiro'}
                                                            {!order.payment_method && 'Pix'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-orange-200 bg-orange-50 text-orange-700">
                                                            {order.delivery_method === 'delivery' ? 'Delivery' : 'Retirada'}
                                                        </Badge>
                                                    </div>
                                                    {order.start_date && (
                                                        <div className="flex items-center gap-1 text-muted-foreground" title="Data de Produção">
                                                            <ChefHat className="w-3 h-3" />
                                                            <span>{formatDate(order.start_date)}</span>
                                                        </div>
                                                    )}

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
            collisionDetection={customCollisionDetection} // Changed from closestCorners
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pedidos</h1>
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

                                    // Pre-load data for lookups
                                    const { data: existingCustomers } = await getCustomers();
                                    const { data: existingProducts } = await getProducts();

                                    let successCount = 0;
                                    let errorCount = 0;

                                    for (const row of data) {
                                        // 1. Resolve Customer
                                        const customerName = getValue(row, ['Cliente', 'name', 'Customer', 'cliente', 'Nome']);
                                        if (!customerName || customerName === 'Não informado') continue;

                                        let customerId = existingCustomers?.find(c => c.name.toLowerCase() === customerName.toLowerCase())?.id;

                                        if (!customerId) {
                                            // Create new customer if not found
                                            const { data: newCust, error: custError } = await createCustomer({
                                                name: customerName,
                                                email: null,
                                                phone: null,
                                                address: null,
                                                notes: null,
                                                last_order_date: null
                                            });
                                            if (newCust && !custError) {
                                                customerId = newCust.id;
                                                // Update local cache
                                                existingCustomers?.push(newCust);
                                            } else {
                                                console.error("Failed to create customer", customerName);
                                                errorCount++;
                                                continue;
                                            }
                                        }

                                        // 2. Parse Status
                                        const statusLabel = getValue(row, ['Status', 'status', 'Estado', 'Situacao']);
                                        const statusKey = Object.keys(STATUS_COLUMNS).find(key =>
                                            STATUS_COLUMNS[key as keyof typeof STATUS_COLUMNS].label === statusLabel ||
                                            key === statusLabel?.toLowerCase()
                                        ) || 'pending';

                                        // 3. Parse Items
                                        const itemsString = getValue(row, ['Items', 'items', 'Itens', 'Produtos', 'products']) || '';
                                        const items: any[] = [];

                                        if (itemsString) {
                                            // Format: "Product A (2), Product B (1)"
                                            const itemParts = itemsString.split(',').map((s: string) => s.trim());

                                            for (const part of itemParts) {
                                                // Robust regex for "Name (Qty)" or just "Name"
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

                                        // 4. Create Order
                                        const deliveryDateVal = getValue(row, ['Data Entrega', 'delivery_date', 'Data', 'Date', 'Entrega']);
                                        const deliveryDate = deliveryDateVal ? new Date(deliveryDateVal).toISOString() : null;

                                        const orderData = {
                                            customer_id: customerId,
                                            status: statusKey as OrderStatus,
                                            delivery_date: deliveryDate,
                                            delivery_time: null,
                                            total_value: items.reduce((acc, item) => acc + item.subtotal, 0),
                                            notes: 'Importado via Excel',
                                            order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` // Simple random ID
                                        };

                                        if (items.length > 0) {
                                            const { error } = await createOrder({
                                                ...orderData,
                                                total_cost: 0,
                                                display_id: 0,
                                                delivery_method: 'pickup',
                                                delivery_fee: 0,
                                                payment_method: 'pix',
                                                google_event_id: null,
                                                production_started_at: null,
                                                production_completed_at: null,
                                                production_duration_minutes: null,
                                                delivered_at: null,
                                                start_date: null
                                            }, items);
                                            if (!error) successCount++;
                                            else errorCount++;
                                        } else {
                                            console.warn("Skipping order with no valid items");
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
                                                    Falta: {item.missing.toFixed(2)} {item.unit}
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
                                    className="bg-amber-600 hover:bg-amber-700"
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
            <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.5' } }
                })
            }}>
                {activeOrder ? (
                    <Card className="w-[300px] shadow-2xl bg-background border-primary/50 cursor-grabbing rotate-3">
                        <CardHeader className="p-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm">{activeOrder.customer?.name}</CardTitle>
                                <Badge>{activeOrder.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                #{activeOrder.display_id}
                            </div>
                        </CardHeader>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default Pedidos;
