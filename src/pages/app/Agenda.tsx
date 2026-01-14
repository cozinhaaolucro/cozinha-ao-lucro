import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Clock, MapPin, X, Calendar as CalendarIcon, Trash2, MessageCircle, RefreshCw } from 'lucide-react';
import { getOrders, deleteOrder } from '@/lib/database';
import type { OrderWithDetails } from '@/types/database';
import { parseLocalDate, formatLocalDate } from '@/lib/dateUtils';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { generateWhatsAppLink, getDefaultTemplateForStatus, parseMessageTemplate } from '@/lib/crm';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';


const Agenda = () => {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [rangeStart, setRangeStart] = useState<Date | null>(null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);



    const loadOrders = async () => {
        const { data, error } = await getOrders();
        if (!error && data) {
            setOrders(data.filter(o => o.status !== 'cancelled'));
        }
    };

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
                loadOrders();
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

    useEffect(() => {
        loadOrders();
    }, []);

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
            return orderDate.toDateString() === date.toDateString();
        });
    };

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const isInRange = (date: Date) => {
        if (!rangeStart || !rangeEnd) return false;
        const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
        const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
        return date >= start && date <= end;
    };

    const isRangeBoundary = (date: Date) => {
        return (rangeStart && date.toDateString() === rangeStart.toDateString()) ||
            (rangeEnd && date.toDateString() === rangeEnd.toDateString());
    };

    const changeMonth = (increment: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };

    const handleDateClick = (date: Date) => {
        if (!rangeStart || (rangeStart && rangeEnd)) {
            setRangeStart(date);
            setRangeEnd(null);
            setSelectedStatus(null);
            setDateFilter({ start: '', end: '' });
        } else {
            setRangeEnd(date);
            const start = rangeStart < date ? rangeStart : date;
            const end = rangeStart < date ? date : rangeStart;
            setDateFilter({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            });
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            pending: 'bg-yellow-500',
            preparing: 'bg-blue-500',
            ready: 'bg-green-500',
            delivered: 'bg-gray-400',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-400';
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

        if (dateFilter.start || dateFilter.end) {
            filtered = filtered.filter(order => {
                const orderDate = getOrderDate(order);
                orderDate.setHours(0, 0, 0, 0);

                const start = dateFilter.start ? parseLocalDate(dateFilter.start + 'T00:00:00') : null;
                const end = dateFilter.end ? parseLocalDate(dateFilter.end + 'T00:00:00') : null;

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
            setRangeStart(null);
            setRangeEnd(null);
            setDateFilter({ start: '', end: '' });
        }
    };

    const clearFilters = () => {
        setRangeStart(null);
        setRangeEnd(null);
        setSelectedStatus(null);
        setDateFilter({ start: '', end: '' });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agenda</h1>
                    <p className="text-sm text-muted-foreground">
                        {rangeStart && !rangeEnd ? 'Clique na data final do período' : 'Gerencie suas entregas'}
                    </p>
                </div>
                <div className="flex gap-2">

                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) => {
                                setDateFilter({ ...dateFilter, start: e.target.value });
                                setRangeStart(null);
                                setRangeEnd(null);
                                setSelectedStatus(null);
                            }}
                            placeholder="Data inicial"
                            className="w-36 h-9 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">até</span>
                        <Input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) => {
                                setDateFilter({ ...dateFilter, end: e.target.value });
                                setRangeStart(null);
                                setRangeEnd(null);
                                setSelectedStatus(null);
                            }}
                            placeholder="Data final"
                            className="w-36 h-9 text-xs"
                        />
                    </div>
                    {(rangeStart || selectedStatus || dateFilter.start || dateFilter.end) && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 h-9">
                            <X className="w-4 h-4" />
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-[360px_1fr] gap-4">
                <Card className="overflow-hidden">
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
                      ${todayDate ? 'ring-2 ring-primary ring-offset-1' : ''}
                      ${isBoundary ? 'bg-primary text-primary-foreground scale-105' : ''}
                      ${inRange && !isBoundary ? 'bg-primary/20' : ''}
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

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span>
                                {dateFilter.start && dateFilter.end &&
                                    `${parseLocalDate(dateFilter.start + 'T00:00:00').toLocaleDateString('pt-BR')} - ${parseLocalDate(dateFilter.end + 'T00:00:00').toLocaleDateString('pt-BR')} • `}
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
                                    {rangeStart && !rangeEnd ? 'Clique na data final' : 'Selecione um período ou status'}
                                </p>
                            </div>
                        ) : (
                            displayOrders.map(order => (
                                <Card
                                    key={order.id}
                                    className={`border-l-4 hover:shadow-md transition-shadow cursor-pointer relative group ${order.status === 'pending' ? 'border-l-yellow-500 bg-yellow-50' :
                                        order.status === 'preparing' ? 'border-l-blue-500 bg-blue-50' :
                                            order.status === 'ready' ? 'border-l-green-500 bg-green-50' :
                                                'border-l-gray-400 bg-gray-50'
                                        }`}
                                    onClick={() => setEditingOrder(order)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-2">
                                            {/* Action icons on the left */}
                                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleWhatsApp(order);
                                                    }}
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(order.id);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {/* Main content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">{order.customer?.name || 'Sem cliente'}</h4>
                                                        <Badge variant="outline" className="text-xs mt-1">
                                                            {getStatusLabel(order.status)}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right flex-shrink-0 ml-2">
                                                        <div className="font-bold text-sm">R$ {order.total_value.toFixed(2)}</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    {order.delivery_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>
                                                                {formatLocalDate(order.delivery_date)}
                                                                {order.delivery_time && ` • ${order.delivery_time}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {order.customer?.address && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="line-clamp-1">{order.customer.address}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {order.items && order.items.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t text-xs space-y-0.5">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between">
                                                                <span className="text-muted-foreground">{item.product_name}</span>
                                                                <span className="font-medium">x{item.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-4 gap-3">
                <Button
                    variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleStatusClick('pending')}
                    className={`h-auto p-3 flex-col items-start border-l-4 border-l-yellow-500 hover:bg-[hsl(182,16%,55%)] hover:text-white ${selectedStatus === 'pending' ? 'bg-[hsl(182,16%,55%)] hover:bg-[hsl(182,16%,50%)] text-white border-[hsl(182,16%,55%)]' : ''}`}
                >
                    <div className="text-2xl font-bold">
                        {orders.filter(o => o.status === 'pending').length}
                    </div>
                    <div className="text-xs">A Fazer</div>
                </Button>
                <Button
                    variant={selectedStatus === 'preparing' ? 'default' : 'outline'}
                    onClick={() => handleStatusClick('preparing')}
                    className={`h-auto p-3 flex-col items-start border-l-4 border-l-blue-500 hover:bg-blue-50 ${selectedStatus === 'preparing' ? 'bg-[hsl(182,16%,55%)] hover:bg-[hsl(182,16%,50%)] text-white border-[hsl(182,16%,55%)]' : ''}`}
                >
                    <div className="text-2xl font-bold">
                        {orders.filter(o => o.status === 'preparing').length}
                    </div>
                    <div className="text-xs">Em Produção</div>
                </Button>
                <Button
                    variant={selectedStatus === 'ready' ? 'default' : 'outline'}
                    onClick={() => handleStatusClick('ready')}
                    className={`h-auto p-3 flex-col items-start border-l-4 border-l-green-500 hover:bg-green-50 ${selectedStatus === 'ready' ? 'bg-[hsl(182,16%,55%)] hover:bg-[hsl(182,16%,50%)] text-white border-[hsl(182,16%,55%)]' : ''}`}
                >
                    <div className="text-2xl font-bold">
                        {orders.filter(o => o.status === 'ready').length}
                    </div>
                    <div className="text-xs">Prontos</div>
                </Button>
                <Button
                    variant={selectedStatus === 'late' ? 'default' : 'outline'}
                    onClick={() => handleStatusClick('late')}
                    className={`h-auto p-3 flex-col items-start border-l-4 border-l-red-500 hover:bg-red-50 ${selectedStatus === 'late' ? 'bg-[hsl(182,16%,55%)] hover:bg-[hsl(182,16%,50%)] text-white border-[hsl(182,16%,55%)]' : ''}`}
                >
                    <div className="text-2xl font-bold">{getLateOrders()}</div>
                    <div className="text-xs">Atrasados</div>
                </Button>
            </div>

            <EditOrderDialog
                open={!!editingOrder}
                onOpenChange={(open) => !open && setEditingOrder(null)}
                order={editingOrder}
                onSuccess={loadOrders}
            />
        </div >
    );
};

export default Agenda;
