import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageCheck } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import { OrderWithDetails, Customer, OrderStatus, ProductWithIngredients, Ingredient } from '@/types/database';

interface KanbanColumnProps {
    status: string;
    label: string;
    orders: OrderWithDetails[];
    isMobile: boolean;
    activeId: string | null;
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

export const KanbanColumn = ({
    status,
    label,
    orders,
    isMobile,
    activeId,
    // Pass-through props
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
}: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({
        id: status,
    });

    const isEmpty = orders.length === 0;

    return (
        <div ref={setNodeRef} className="h-full w-full flex-1 min-h-[150px]">
            <div className="h-full flex flex-col space-y-3">
                {!isMobile && (
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground/80">{label}</h3>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">{orders.length}</Badge>
                    </div>
                )}
                <SortableContext
                    id={status}
                    items={orders.map(o => o.id)}
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
                            orders.map((order) => (
                                <KanbanCard
                                    key={order.id}
                                    order={order}
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
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};
