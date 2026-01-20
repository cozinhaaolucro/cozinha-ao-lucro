import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/hooks/useQueries';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    TouchSensor,
    useDroppable,
    pointerWithin,
    rectIntersection,
    CollisionDetection
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { parseLocalDate } from '@/lib/dateUtils';
import { OrderWithDetails, OrderStatus, Customer, ProductWithIngredients, Ingredient } from '@/types/database';
import { updateKanbanPositions, updateOrderStatus } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { STATUS_COLUMNS } from './constants';

interface KanbanBoardProps {
    orders: OrderWithDetails[];
    setOrders: React.Dispatch<React.SetStateAction<OrderWithDetails[]>>;
    filteredOrders: OrderWithDetails[];
    isMobile: boolean;
    products: ProductWithIngredients[];
    ingredients: Ingredient[];
    refetchOrders: () => void;
    handleCustomerClick: (customer: Customer | null) => void;
    handleDuplicate: (order: OrderWithDetails) => void;
    setEditingOrder: (order: OrderWithDetails) => void;
    handleDeleteOrder: (id: string) => void;
    handleWhatsApp: (order: OrderWithDetails) => void;
    setLongPressOrder: (order: OrderWithDetails | null) => void;
    longPressTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
    onOptimisticUpdate: (orderId: string, newStatus: OrderStatus) => void;
}

export const KanbanBoard = ({
    orders,
    setOrders,
    filteredOrders,
    isMobile,
    products,
    ingredients,
    refetchOrders,
    handleCustomerClick,
    handleDuplicate,
    setEditingOrder,
    handleDeleteOrder,
    handleWhatsApp,
    setLongPressOrder,
    longPressTimerRef,
    onOptimisticUpdate
}: KanbanBoardProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

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

        const { error } = await updateKanbanPositions(updates);
        if (error) {
            console.error("Erro ao atualizar Kanban:", error);
            toast({
                title: 'Erro ao salvar ordem',
                description: (error as any).message || 'Detalhes desconhecidos',
                variant: 'destructive'
            });
            refetchOrders();
        } else {
            // Update cache silently to ensure navigation consistency
            refetchOrders();
            // Invalidate other queries to ensure data freshness in Stock and Dashboard
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ingredients] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
        }
    };

    const renderColumn = (status: string, config: typeof STATUS_COLUMNS[keyof typeof STATUS_COLUMNS]) => {
        const statusOrders = filteredOrders
            .filter((o) => o.status === status)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        return (
            <KanbanColumn
                key={status}
                status={status}
                label={config.label}
                orders={statusOrders}
                isMobile={isMobile}
                activeId={activeId}
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
            {isMobile ? (
                <Tabs defaultValue="pending" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        {Object.entries(STATUS_COLUMNS).map(([status, config]) => {
                            const count = filteredOrders.filter((o) => o.status === status).length;
                            return (
                                <TabsTrigger key={status} value={status} className="group text-xs px-1 min-h-10 h-auto py-2 flex flex-row items-center justify-center gap-1.5 font-medium bg-muted/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1 text-center whitespace-normal leading-tight">
                                    <span>{config.label}</span>
                                    {count > 0 && (
                                        <span className="bg-primary/10 text-primary group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
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

            <DragOverlay>
                {activeOrder ? (
                    <div className="opacity-90 rotate-3 cursor-grabbing scale-105">
                        <KanbanCard
                            order={activeOrder}
                            isMobile={isMobile}
                            activeId={activeId}
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
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
