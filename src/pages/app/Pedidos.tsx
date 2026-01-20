import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download, Upload, FileSpreadsheet, FileDown, FileText, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createStockMovement } from '@/lib/database';
import { updateOrderStatus, deleteOrder, createOrder, createCustomer, getProducts, getCustomers } from '@/lib/database'; // Helper fns
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
import type { OrderWithDetails, OrderStatus, Customer, ProductIngredientWithDetails, Ingredient } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';
import NewOrderDialog from '@/components/orders/NewOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { formatUnit } from '@/lib/utils';
import ClientProfileDrawer from '@/components/crm/ClientProfileDrawer';
import SendMessageDialog from '@/components/crm/SendMessageDialog';
import { useKanbanOrders, useProducts, useIngredients } from '@/hooks/useQueries';
import { KanbanBoard } from '@/components/orders/kanban/KanbanBoard';
import { STATUS_COLUMNS } from '@/components/orders/kanban/constants';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useQueries';

const Pedidos = () => {
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
    const [missingIngredientsForDuplicate, setMissingIngredientsForDuplicate] = useState<{ id: string; name: string; needed: number; stock: number; unit: string; missing: number; current: number }[]>([]);
    const [isDuplicateRestocking, setIsDuplicateRestocking] = useState(false);

    const { toast } = useToast();
    const isMobile = useIsMobile();
    const queryClient = useQueryClient();

    // React Query Hooks
    const { data: serverOrders, refetch: refetchOrders, isLoading } = useKanbanOrders(dateFilter);
    const { data: productsData } = useProducts();
    const { data: ingredientsData } = useIngredients();

    // Local state for DnD (synced with server)
    const [orders, setOrders] = useState<OrderWithDetails[]>(serverOrders || []);

    // Aliases
    const products = productsData?.products || [];
    const ingredients = ingredientsData?.ingredients || [];

    useEffect(() => {
        if (serverOrders) {
            setOrders(serverOrders);
        }
    }, [serverOrders]);

    // Force refetch on mount to ensure fresh data every time we enter the page
    useEffect(() => {
        refetchOrders();
    }, []);

    const onOptimisticUpdate = (orderId: string, newStatus: OrderStatus) => {
        setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: newStatus } : o
        ));
    };

    const handleWhatsApp = (order: OrderWithDetails) => {
        setMessageOrder(order);
        setIsMessageDialogOpen(true);
    };

    const calculateMissingStockForDuplicate = async (order: OrderWithDetails) => {
        const needed = new Map<string, { name: string; qty: number; unit: string }>();
        const ingredientIds = new Set<string>();

        const items = order.items || [];
        for (const item of items) {
            const product = products.find(p => p.id === item.product_id);
            if (product?.product_ingredients) {
                product.product_ingredients.forEach((pi: ProductIngredientWithDetails) => {
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
            refetchOrders();
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
            refetchOrders();
            // Invalidate queries to ensure fresh stock/dashboard data
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ingredients] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
        } else {
            toast({ title: 'Erro ao excluir pedido', variant: 'destructive' });
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter((order) => {
        if (order.status === 'cancelled') return false;
        // Date filtering is handled server-side in refetchOrders, but we also filter locally for optimistic updates if needed
        // but since we replace local state with server state, local filter is redundant for dates unless we want client-side filtering on top.
        // Effectively this just filters out cancelled orders.
        return true;
    });

    const handleExport = async (format: 'excel' | 'csv') => {
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
            await exportToExcel(dataToExport, 'pedidos_cozinha_ao_lucro');
        }
    };

    return (
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
                                const { data: existingCustomers } = await getCustomers() as { data: Customer[] | null; error: any };
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
                                refetchOrders();
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

            {(isLoading && orders.length === 0) ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground animate-pulse">Carregando pedidos...</p>
                    </div>
                </div>
            ) : (
                <KanbanBoard
                    orders={orders}
                    setOrders={setOrders}
                    filteredOrders={filteredOrders}
                    isMobile={isMobile}
                    products={products}
                    ingredients={ingredients}
                    refetchOrders={refetchOrders}
                    handleCustomerClick={handleCustomerClick}
                    handleDuplicate={handleDuplicate}
                    setEditingOrder={setEditingOrder}
                    handleDeleteOrder={handleDeleteOrder}
                    handleWhatsApp={handleWhatsApp}
                    setLongPressOrder={setLongPressOrder}
                    longPressTimerRef={longPressTimerRef}
                    onOptimisticUpdate={onOptimisticUpdate}
                />
            )}

            {isDialogOpen && (
                <NewOrderDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={refetchOrders}
                />
            )}

            {editingOrder && (
                <EditOrderDialog
                    order={editingOrder}
                    open={!!editingOrder}
                    onOpenChange={(open) => !open && setEditingOrder(null)}
                    onSuccess={refetchOrders}
                />
            )}

            <ClientProfileDrawer
                customer={selectedCustomer}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onUpdate={refetchOrders}
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
                        <AlertDialogTitle className="flex items-center gap-2" style={{ color: '#C76E60' }}>
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
                                className="hover:text-white transition-colors"
                                style={{
                                    backgroundColor: '#2e5b60',
                                    color: 'white'
                                }}
                                disabled={isDuplicateRestocking}
                            >
                                {isDuplicateRestocking ? 'Atualizando...' : 'Regularizar e Criar'}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Pedidos;
