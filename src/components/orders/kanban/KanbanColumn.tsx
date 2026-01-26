// ... imports
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageCheck, Eye, EyeOff } from 'lucide-react'; // Added Eye, EyeOff
import { Button } from '@/components/ui/button'; // Added Button
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

    // Default to collapsed for 'delivered' if there are many items? Or just user toggle? User toggle as requested.
    // Actually, persistence? State resets on remount. Good enough for now.
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isDelivered = status === 'delivered';

    const isEmpty = orders.length === 0;

    return (
        <div ref={setNodeRef} className="h-full w-full flex-1 min-h-[150px]">
            <div className="h-full flex flex-col space-y-3">
                {!isMobile && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground/80">{label}</h3>
                            {isDelivered && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    title={isCollapsed ? "Mostrar pedidos" : "Ocultar pedidos para melhorar performance"}
                                >
                                    {isCollapsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </Button>
                            )}
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">{orders.length}</Badge>
                    </div>
                )}

                {isDelivered && isCollapsed ? (
                    <div className="flex-1 flex flex-col items-center justify-start py-8 border-2 border-dashed border-muted rounded-lg bg-muted/10 text-center animate-in fade-in transition-all">
                        <PackageCheck className="w-8 h-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">{orders.length} pedidos finalizados.</p>
                        <p className="text-xs text-muted-foreground/60 mb-3">Ocultos para performance.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsCollapsed(false)} className="h-7 text-xs">
                            Mostrar Lista
                        </Button>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
};
