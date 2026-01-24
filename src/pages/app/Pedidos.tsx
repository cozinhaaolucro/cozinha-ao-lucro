import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Download, Upload, FileSpreadsheet, FileDown, FileText, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { updateOrderStatus, deleteOrder, getCustomers } from '@/lib/database';
import { useOrderOperations } from '@/hooks/useOrderOperations';
import { useOrderImport } from '@/hooks/useOrderImport';
import { exportToExcel, exportToCSV } from '@/lib/excel';
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

    // Duplicate Stock Alert States -> Managed by useOrderOperations hook

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

    // Hook for complex order operations
    const {
        duplicatingOrder,
        showDuplicateStockAlert,
        setShowDuplicateStockAlert,
        missingIngredientsForDuplicate,
        isDuplicateRestocking,
        setDuplicatingOrder,
        handleDuplicate,
        handleDuplicateAutoRestock,
        handleDeleteOrder,
        confirmDuplicate
    } = useOrderOperations({
        products,
        onSuccess: refetchOrders
    });

    const { handleImport, isImporting } = useOrderImport(refetchOrders);

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

    const handleCustomerClick = (customer: Customer | null) => {
        if (customer) {
            setSelectedCustomer(customer);
            setIsDrawerOpen(true);
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
                            await handleImport(file);
                            e.target.value = '';
                        }}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        title="Importar Excel"
                        className="flex-1 sm:flex-none sm:w-10"
                        onClick={() => document.getElementById('pedidos-import-input')?.click()}
                        disabled={isImporting}
                    >
                        {isImporting ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="w-4 h-4" />}
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
                <div className="flex-1 flex items-center justify-center pb-40">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground animate-pulse">Carregando pedidos...</p>
                    </div>
                </div>
            ) : (
                <div className="pb-40">
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
                </div>
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
                                    confirmDuplicate(duplicatingOrder);
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
