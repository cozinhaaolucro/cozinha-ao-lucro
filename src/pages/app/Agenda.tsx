import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon, Trash2, MessageCircle, RefreshCw } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-picker";
import { getOrders, deleteOrder } from '@/lib/database';
import type { OrderWithDetails } from '@/types/database';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { generateWhatsAppLink, getDefaultTemplateForStatus, parseMessageTemplate } from '@/lib/crm';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useOrders } from '@/hooks/useQueries';


const Agenda = () => {
    // const [orders, setOrders] = useState<OrderWithDetails[]>([]); // Derived
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    // React Query Hook
    // Agenda typically needs ALL orders for the calendar view (or at least for the current month).
    // The current pagination/filtering hook might be limiting if not careful.
    // Ideally we fetch by range (current month).
    // For now, let's just fetch "all" (or large limit) via the hook without strict filters, 
    // OR implementation smart month-based fetching. 
    // Simplest step forward: Fetch all active/recent via basic hook call, but user expects *calendar* data.
    // We already have `getOrders` fetching everything by default if no args.
    // The `useOrders` hook takes filters. 

    // Let's pass year/month filters if possible? 
    // The current `useOrders` only takes specific date range. 
    // Let's just use it without filters for now (Fetch World pattern replacement with Cache World) 
    // maximizing cache hit chance with other pages.
    const { data: ordersData, refetch: refetchOrders } = useOrders();

    const orders = (ordersData || []).filter(o => o.status !== 'cancelled');

    // Remove loadOrders
    // const loadOrders = async () ...

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este pedido?')) {
            const { error } = await deleteOrder(id);
            if (error) {
                toast({
                    title: "Erro ao excluir",
                    description: "Não foi possível excluir o pedido.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Pedido excluído",
                    description: "O pedido foi removido com sucesso."
                });
                refetchOrders();
            }
        }
    };

    const handleWhatsApp = (order: OrderWithDetails) => {
        if (!order.customer?.phone) {
            toast({
                title: "Sem telefone",
                description: "O cliente não possui telefone cadastrado.",
                variant: "destructive"
            });
            return;
        }

        const template = getDefaultTemplateForStatus(order.status);
        const message = parseMessageTemplate(template, order, order.customer);
        const link = generateWhatsAppLink(order.customer.phone, message);
        window.open(link, '_blank');
    };

    // useEffect(() => { refetchOrders(); }, []); -> Removed

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const getOrderDate = (order: OrderWithDetails) => {
        if (order.start_date) return parseLocalDate(order.start_date);
        if (order.delivery_date) return parseLocalDate(order.delivery_date);
        return new Date(order.created_at);
    };

    const getOrdersForDate = (date: Date) => {
        return orders.filter(order => {
            const orderDate = getOrderDate(order);
            const isSameDate = orderDate.toDateString() === date.toDateString();
            if (!isSameDate) return false;

            if (selectedStatus) {
                if (selectedStatus === 'late') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (order.status === 'delivered') return false;
                    return orderDate < today;
                }
                return order.status === selectedStatus;
            }
            return true;
        });
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const isInRange = (date: Date) => {
        if (!dateFilter?.from || !dateFilter?.to) return false;
        const start = dateFilter.from < dateFilter.to ? dateFilter.from : dateFilter.to;
        const end = dateFilter.from < dateFilter.to ? dateFilter.to : dateFilter.from;
        // Reset hours for accurate comparison
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        const e = new Date(end); e.setHours(0, 0, 0, 0);
        return d >= s && d <= e;
    };

    const isRangeBoundary = (date: Date) => {
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        const from = dateFilter?.from ? new Date(dateFilter.from) : null;
        if (from) from.setHours(0, 0, 0, 0);
        const to = dateFilter?.to ? new Date(dateFilter.to) : null;
        if (to) to.setHours(0, 0, 0, 0);

        return (from && d.getTime() === from.getTime()) ||
            (to && d.getTime() === to.getTime());
    };

    const changeMonth = (increment: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };

    const handleDateClick = (date: Date) => {
        if (!dateFilter?.from || (dateFilter.from && dateFilter.to)) {
            setSelectedStatus(null);
            setDateFilter({ from: date, to: undefined });
        } else {
            const from = dateFilter.from;
            const to = date;
            const start = from < to ? from : to;
            const end = from < to ? to : from;
            setDateFilter({ from: start, to: end });
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-[#C9A34F]',
            preparing: 'bg-[#68A9CA]',
            ready: 'bg-[#4C9E7C]',
            delivered: 'bg-[#5F98A1]',
            late: 'bg-[#C76E60]',
            cancelled: 'bg-[#C76E60]'
        };
        return colors[status as keyof typeof colors] || 'bg-muted-foreground/40';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            pending: 'A Fazer',
            preparing: 'Produção',
            ready: 'Pronto',
            delivered: 'Entregue',
        };
        return labels[status as keyof typeof labels] || status;
    };

    const getFilteredOrders = () => {
        let filtered = orders;

        if (dateFilter?.from) {
            filtered = filtered.filter(order => {
                const orderDate = getOrderDate(order);
                orderDate.setHours(0, 0, 0, 0);

                const start = new Date(dateFilter.from!);
                start.setHours(0, 0, 0, 0);

                if (orderDate < start) return false;

                if (dateFilter.to) {
                    const end = new Date(dateFilter.to);
                    end.setHours(23, 59, 59, 999);
                    if (orderDate > end) return false;
                }
                return true;
            });
        }

        if (selectedStatus === 'late') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(order => {
                if (order.status === 'delivered' || order.status === 'cancelled') return false;
                const orderDate = getOrderDate(order);
                return orderDate < today;
            });
        } else if (selectedStatus) {
            filtered = filtered.filter(order => order.status === selectedStatus);
        }

        return filtered.sort((a, b) => {
            const dateA = getOrderDate(a).getTime();
            const dateB = getOrderDate(b).getTime();
            if (dateA !== dateB) return dateA - dateB;

            if (!a.delivery_time) return 1;
            if (!b.delivery_time) return -1;
            return a.delivery_time.localeCompare(b.delivery_time);
        });
    };

    const days = getDaysInMonth(currentDate);
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const displayOrders = getFilteredOrders();

    const getLateOrders = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return orders.filter(o => {
            if (!o.delivery_date || o.status === 'delivered') return false;
            const deliveryDate = parseLocalDate(o.delivery_date);
            return deliveryDate < today;
        }).length;
    };

    const handleStatusClick = (status: string) => {
        if (selectedStatus === status) {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(status);
            setDateFilter(undefined);
        }
    };

    const clearFilters = () => {
        setSelectedStatus(null);
        setDateFilter(undefined);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agenda</h1>
                    <p className="text-sm text-muted-foreground">
                        {dateFilter?.from && !dateFilter?.to ? 'Clique na data final do período' : 'Gerencie suas entregas'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <DateRangePicker
                        date={dateFilter}
                        setDate={(range) => {
                            setDateFilter(range);
                            if (range) setSelectedStatus(null);
                        }}
                    />
                    {(selectedStatus || dateFilter?.from) && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 h-9">
                            <X className="w-4 h-4" />
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
                <div className="space-y-4">
                    <Card className="overflow-hidden bg-white shadow-elegant border border-border/60 h-fit">
                        <CardHeader className="pb-3 px-4 pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold capitalize">
                                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 max-h-[600px] overflow-y-auto">
                            <div className="grid grid-cols-7 gap-1">
                                {weekDays.map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-muted-foreground h-7 flex items-center justify-center">
                                        {day}
                                    </div>
                                ))}
                                {days.map((date, idx) => {
                                    if (!date) {
                                        return <div key={`empty-${idx}`} className="aspect-square" />;
                                    }

                                    const dayOrders = getOrdersForDate(date);
                                    const todayDate = isToday(date);
                                    const inRange = isInRange(date);
                                    const isBoundary = isRangeBoundary(date);

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleDateClick(date)}
                                            className={`
                      relative aspect-square p-1 rounded-lg text-sm font-medium transition-all
                      ${todayDate ? 'ring-2 ring-[#5F98A1] ring-offset-1 text-[#5F98A1] font-bold' : ''}
                      ${isBoundary ? 'bg-[#5F98A1] text-white scale-105 shadow-md' : ''}
                      ${inRange && !isBoundary ? 'bg-[#5F98A1]/20 text-[#5F98A1]' : ''}
                      ${!inRange && !isBoundary && !todayDate ? 'hover:bg-muted' : ''}
                    `}
                                        >
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <span className="leading-none">{date.getDate()}</span>
                                                {dayOrders.length > 0 && (
                                                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                                                        {dayOrders.slice(0, 3).map((order, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(order.status)}`}
                                                            />
                                                        ))}
                                                        {dayOrders.length > 3 && (
                                                            <span className="text-[9px] ml-0.5">+{dayOrders.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Pills Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleStatusClick('pending')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border shadow-sm ${selectedStatus === 'pending' ? 'bg-[#C9A34F] text-white border-[#C9A34F]' : 'bg-white text-[#C9A34F] border-[#C9A34F]/30 hover:border-[#C9A34F] hover:bg-[#C9A34F]/5'}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            A Fazer
                            <span className="font-bold ml-1">{orders.filter(o => o.status === 'pending').length}</span>
                        </button>
                        <button
                            onClick={() => handleStatusClick('preparing')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border shadow-sm ${selectedStatus === 'preparing' ? 'bg-[#68A9CA] text-white border-[#68A9CA]' : 'bg-white text-[#68A9CA] border-[#68A9CA]/30 hover:border-[#68A9CA] hover:bg-[#68A9CA]/5'}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Produção
                            <span className="font-bold ml-1">{orders.filter(o => o.status === 'preparing').length}</span>
                        </button>
                        <button
                            onClick={() => handleStatusClick('ready')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border shadow-sm ${selectedStatus === 'ready' ? 'bg-[#4C9E7C] text-white border-[#4C9E7C]' : 'bg-white text-[#4C9E7C] border-[#4C9E7C]/30 hover:border-[#4C9E7C] hover:bg-[#4C9E7C]/5'}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Prontos
                            <span className="font-bold ml-1">{orders.filter(o => o.status === 'ready').length}</span>
                        </button>
                        <button
                            onClick={() => handleStatusClick('late')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border shadow-sm ${selectedStatus === 'late' ? 'bg-[#C76E60] text-white border-[#C76E60]' : 'bg-white text-[#C76E60] border-[#C76E60]/30 hover:border-[#C76E60] hover:bg-[#C76E60]/5'}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Atrasados
                            <span className="font-bold ml-1">{getLateOrders()}</span>
                        </button>
                    </div>
                </div>

                <Card className="bg-white shadow-elegant border border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>
                                {dateFilter?.from && dateFilter?.to &&
                                    `${new Date(dateFilter.from).toLocaleDateString('pt-BR')} - ${new Date(dateFilter.to).toLocaleDateString('pt-BR')} • `}
                                {selectedStatus && `${getStatusLabel(selectedStatus)} • `}
                                {displayOrders.length} {displayOrders.length === 1 ? 'pedido' : 'pedidos'}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                        {displayOrders.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhum pedido encontrado</p>
                                <p className="text-xs mt-1">
                                    {dateFilter?.from && !dateFilter?.to ? 'Clique na data final' : 'Selecione um período ou status'}
                                </p>
                            </div>
                        ) : (
                            displayOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={`bg-white border border-border/60 rounded-lg p-2.5 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3 ${order.status === 'pending' ? 'border-l-4 border-l-[#C9A34F]' :
                                        order.status === 'preparing' ? 'border-l-4 border-l-[#68A9CA]' :
                                            order.status === 'ready' ? 'border-l-4 border-l-[#4C9E7C]' :
                                                order.status === 'delivered' ? 'border-l-4 border-l-[#5F98A1]' :
                                                    'border-l-4 border-l-muted-foreground/40'
                                        }`}
                                    onClick={() => setEditingOrder(order)}
                                >
                                    {/* Main content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h4 className="font-medium text-sm truncate">{order.customer?.name || 'Sem cliente'}</h4>
                                                {/* Status indicator removed */}
                                            </div>
                                            <div className="text-sm font-bold shrink-0" style={{ color: '#2FBF71' }}>R$ {order.total_value.toFixed(2)}</div>
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            {order.delivery_date && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatLocalDate(order.delivery_date)}
                                                    {order.delivery_time && ` ${order.delivery_time}`}
                                                </span>
                                            )}
                                            {order.items && order.items.length > 0 && (
                                                <span className="text-muted-foreground/70">
                                                    {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action icons */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleWhatsApp(order);
                                            }}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(order.id);
                                            }}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status Pills */}
            {/* Status Pills removed from here */}

            <EditOrderDialog
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                order={editingOrder}
                onSuccess={refetchOrders}
            />
        </div >
    );
};

export default Agenda;
