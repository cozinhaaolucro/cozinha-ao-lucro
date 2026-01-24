import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Phone, Pencil, Copy, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { StockAlertBadge } from '@/components/orders/StockAlertBadge';
import { useToast } from '@/hooks/use-toast';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { formatUnit } from '@/lib/utils';
import { OrderWithDetails, ProductWithIngredients, Ingredient, Customer, OrderStatus } from '@/types/database';
import { updateOrderStatus } from '@/lib/database';
import { useSortable } from '@dnd-kit/sortable';
import { STATUS_COLUMNS } from './constants';

import { CSS } from '@dnd-kit/utilities';

interface KanbanCardProps {
    order: OrderWithDetails;
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

const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return formatLocalDate(date);
};

interface ActionIconProps {
    Icon: React.ElementType;
    onClick: (e: React.MouseEvent) => void;
    color: string;
    title: string;
}

const ActionIcon = ({ Icon, onClick, color, title }: ActionIconProps) => (
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

const KanbanCardContent = ({
    order,
    isMobile,
    activeId,
    refetchOrders,
    products,
    ingredients,
    handleCustomerClick,
    handleDuplicate,
    setEditingOrder,
    handleDeleteOrder,
    handleWhatsApp,
    isLate,
    cardStyle,
    baseColor,
    onOptimisticUpdate
}: KanbanCardProps & { isLate: boolean; cardStyle: React.CSSProperties; baseColor: string }) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const { toast } = useToast();

    const rightDragOpacity = useTransform(x, [0, 50], [0, 1]);
    const rightDragScale = useTransform(x, [0, 50], [0.8, 1]);

    const handleDragEnd = async (_: unknown, info: import('framer-motion').PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const threshold = 80;

        if (offset > threshold || (offset > 20 && velocity > 200)) {
            // Swipe Right -> Advance
            const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'];
            const currentIndex = STATUS_FLOW.indexOf(order.status);
            if (currentIndex < STATUS_FLOW.length - 1) {
                const nextStatus = STATUS_FLOW[currentIndex + 1] as OrderStatus;
                await controls.start({ x: 200, opacity: 0 });
                onOptimisticUpdate(order.id, nextStatus);
                await updateOrderStatus(order.id, nextStatus, order.status);
                const statusKey = nextStatus as keyof typeof STATUS_COLUMNS;
                toast({ title: `Avançou para ${STATUS_COLUMNS[statusKey]?.label}` });
                refetchOrders();
            } else {
                controls.start({ x: 0 });
            }
        } else if (offset < -threshold || (offset < -20 && velocity < -200)) {
            // Swipe Left -> Back
            const STATUS_FLOW = ['pending', 'preparing', 'ready', 'delivered'];
            const currentIndex = STATUS_FLOW.indexOf(order.status);
            if (currentIndex > 0) {
                const prevStatus = STATUS_FLOW[currentIndex - 1] as OrderStatus;
                await controls.start({ x: -200, opacity: 0 });
                onOptimisticUpdate(order.id, prevStatus);
                await updateOrderStatus(order.id, prevStatus, order.status);
                const statusKey = prevStatus as keyof typeof STATUS_COLUMNS;
                toast({ title: `Voltou para ${STATUS_COLUMNS[statusKey]?.label}` });
                refetchOrders();
            } else {
                controls.start({ x: 0 });
            }
        } else {
            controls.start({ x: 0 });
        }
    };

    if (isMobile) {
        return (
            <div className="relative w-full touch-pan-y">
                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-0 overflow-hidden rounded-lg">
                    <motion.div style={{ opacity: rightDragOpacity, scale: rightDragScale }} className="flex items-center text-primary font-bold gap-1 p-2 bg-primary/10 rounded-full">
                        <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                    </motion.div>
                </div>
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={handleDragEnd}
                    style={{ x, touchAction: 'pan-y' }}
                    animate={controls}
                    className="relative z-10"
                >
                    <Card
                        className={`transition-all cursor-move group relative border border-border/40 rounded-lg hover:border-border/80 ${activeId === order.id ? 'opacity-30' : ''}`}
                        style={cardStyle}
                    >
                        <StockAlertBadge
                            order={order}
                            products={products}
                            ingredients={ingredients}
                            onStockUpdate={refetchOrders}
                        />
                        <CardHeader className="pb-1 pt-2.5 pl-4 pr-3">
                            <div className="text-sm flex items-start justify-between">
                                <div className="font-semibold flex flex-col gap-0.5" onClick={() => handleCustomerClick(order.customer)}>
                                    <div className="flex items-center gap-1">
                                        <span className="hover:underline cursor-pointer text-sm font-medium tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                            {order.customer?.name || 'Cliente não informado'}
                                        </span>
                                        {order.customer?.phone && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-5 w-5 hover:bg-muted rounded-full transition-colors"
                                                onPointerDown={(e) => e.stopPropagation()}
                                                onClick={(e) => { e.stopPropagation(); handleWhatsApp(order); }}
                                                title="WhatsApp"
                                            >
                                                <Phone className="w-3 h-3 text-[#2FBF71]" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    <ActionIcon Icon={Copy} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDuplicate(order); }} color="#9ca3af" title="Duplicar" />
                                    <ActionIcon Icon={Pencil} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingOrder(order); }} color="#9ca3af" title="Editar" />
                                    <ActionIcon Icon={Trash2} onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (confirm('Excluir?')) handleDeleteOrder(order.id); }} color="#9ca3af" title="Excluir" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pb-2 pl-4 pr-3">
                            <CardBody order={order} baseColor={baseColor} isLate={isLate} />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <Card
            className={`transition-all cursor-move group relative border border-border/40 rounded-lg hover:border-border/80 ${activeId === order.id ? 'opacity-30' : ''}`}
            style={cardStyle}
        >
            <StockAlertBadge
                order={order}
                products={products}
                ingredients={ingredients}
                onStockUpdate={refetchOrders}
            />
            <CardHeader className="pb-1 pt-2.5 pl-4 pr-3">
                <div className="text-sm flex items-start justify-between">
                    <div className="font-semibold flex flex-col gap-0.5" onClick={() => handleCustomerClick(order.customer)}>
                        <div className="flex items-center gap-1">
                            <span className="hover:underline cursor-pointer text-sm font-medium tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                                {order.customer?.name || 'Cliente não informado'}
                            </span>
                            {order.customer?.phone && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 hover:bg-muted rounded-full transition-colors"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleWhatsApp(order); }}
                                    title="WhatsApp"
                                >
                                    <Phone className="w-3 h-3 text-[#2FBF71]" />
                                </Button>
                            )}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            #{order.display_id ? String(order.display_id).padStart(4, '0') : (order.order_number || order.id.slice(0, 4))}
                        </div>
                    </div>
                    <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <ActionIcon Icon={Copy} onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDuplicate(order); }} color="#9ca3af" title="Duplicar" />
                        <ActionIcon Icon={Pencil} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingOrder(order); }} color="#9ca3af" title="Editar" />
                        <ActionIcon Icon={Trash2} onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (confirm('Excluir?')) handleDeleteOrder(order.id); }} color="#9ca3af" title="Excluir" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-2 pl-4 pr-3">
                <CardBody order={order} baseColor={baseColor} isLate={isLate} />
            </CardContent>
        </Card>
    );
};

const CardBody = ({ order, baseColor, isLate }: { order: OrderWithDetails, baseColor: string, isLate: boolean }) => (
    <div className="grid gap-1.5">
        <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: baseColor }}></span>
                {order.delivery_date ? formatDate(order.delivery_date) : 'Sem data'}
            </span>
            <span className="font-medium text-sm tracking-normal" style={{ color: '#2FBF71' }}>
                R$
                <span style={{ marginLeft: '4px' }}>
                    {order.total_value.toFixed(2)}
                </span>
            </span>
        </div>

        <div className="flex gap-1.5 flex-wrap items-center">
            <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 h-auto rounded-md border border-opacity-20 font-medium bg-opacity-10"
                style={{
                    color: 'hsl(var(--muted-foreground))',
                    borderColor: 'hsl(var(--border))'
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
                <Badge
                    className="text-[10px] px-2 py-0.5 h-auto rounded-md border"
                    style={{
                        backgroundColor: 'transparent',
                        borderColor: '#C76E60',
                        color: '#C76E60'
                    }}
                >
                    Atrasado
                </Badge>
            )}
        </div>

        {order.items && order.items.length > 0 && (
            <div className="text-xs mt-1 pt-1.5 border-t border-border/40 text-left" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {order.items.slice(0, 3).map((item, idx: number) => (
                    <p key={idx} className="line-clamp-1 flex items-center gap-1.5 py-0.5">
                        <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: baseColor }}></span>
                        <span className="font-medium text-foreground/80">{item.product_name}</span>
                        <span className="opacity-60 text-[10px]">(x{item.quantity})</span>
                    </p>
                ))}
                {order.items.length > 3 && <p className="text-[10px] italic opacity-50 pl-2.5 mt-0.5">+ {order.items.length - 3} itens...</p>}
            </div>
        )}
    </div>
);

export const KanbanCard = (props: KanbanCardProps) => {
    const { order, isMobile } = props;
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
        },
        disabled: isMobile
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isLate = React.useMemo(() => {
        if (order.status === 'delivered' || order.status === 'cancelled') return false;
        if (!order.delivery_date) return false;
        const delivery = parseLocalDate(order.delivery_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return delivery < today;
    }, [order]);

    const statusKey = order.status;
    const cardStyle = {
        backgroundColor: 'hsl(var(--card))',
        borderLeft: `3px solid hsl(var(--status-${statusKey}-base))`,
        boxShadow: isDragging
            ? '0 10px 15px -3px hsla(var(--shadow-color), 0.1), 0 4px 6px -2px hsla(var(--shadow-color), 0.05)'
            : '0 2px 4px -1px hsla(var(--shadow-color), 0.08), 0 1px 2px -1px hsla(var(--shadow-color), 0.04)',
        color: 'hsl(var(--foreground))',
    };

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
            <KanbanCardContent
                {...props}
                isLate={isLate}
                cardStyle={cardStyle}
                baseColor={baseColor}
            />
        </div>
    );
};
