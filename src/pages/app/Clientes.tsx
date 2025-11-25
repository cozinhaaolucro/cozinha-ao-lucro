import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, Plus, Search, MessageCircle, Filter, Pencil } from 'lucide-react';
import { getCustomers } from '@/lib/database';
import type { Customer } from '@/types/database';
import NewCustomerDialog from '@/components/customers/NewCustomerDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';

const Clientes = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    const loadCustomers = async () => {
        const { data, error } = await getCustomers();
        if (!error && data) {
            setCustomers(data);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const isInactive = (lastOrderDate: string | null) => {
        if (!lastOrderDate) return true;
        const daysSinceOrder = Math.floor((Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceOrder > 30;
    };

    const filteredCustomers = customers.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesInactiveFilter = !showInactive || isInactive(c.last_order_date);

        let matchesDateFilter = true;
        if (dateFilter.start || dateFilter.end) {
            if (!c.last_order_date) {
                matchesDateFilter = false;
            } else {
                const lastOrderDate = new Date(c.last_order_date);
                const start = dateFilter.start ? new Date(dateFilter.start) : null;
                const end = dateFilter.end ? new Date(dateFilter.end) : null;

                if (start && lastOrderDate < start) matchesDateFilter = false;
                if (end && lastOrderDate > end) matchesDateFilter = false;
            }
        }

        return matchesSearch && matchesInactiveFilter && matchesDateFilter;
    });

    const handleWhatsApp = (phone: string, name: string, inactive: boolean) => {
        const message = inactive
            ? `Olá ${name}! Sentimos sua falta! 😊 Temos nov idades deliciosas pra você!`
            : `Olá ${name}! Tudo bem? 😊`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">Gerencie sua base de clientes</p>
                </div>
                <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                </Button>
            </div>

            <div className="flex gap-4 items-center flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clientes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant={showInactive ? "default" : "outline"}
                    onClick={() => setShowInactive(!showInactive)}
                >
                    {showInactive ? 'Mostrar Todos' : 'Mostrar Inativos (30+ dias)'}
                </Button>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Último pedido entre:</span>
                        <div className="flex items-center gap-2 flex-1">
                            <Input
                                type="date"
                                value={dateFilter.start}
                                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                className="max-w-xs"
                            />
                            <span className="text-sm text-muted-foreground">e</span>
                            <Input
                                type="date"
                                value={dateFilter.end}
                                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                className="max-w-xs"
                            />
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
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-3">
                {filteredCustomers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredCustomers.map((customer) => {
                        const inactive = isInactive(customer.last_order_date);

                        return (
                            <Card key={customer.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium">{customer.name}</h4>
                                            {inactive && (
                                                <Badge variant="destructive" className="text-xs">Inativo</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-0.5">
                                            {customer.phone && (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="w-3 h-3" />
                                                    {customer.phone}
                                                </p>
                                            )}
                                            <p className="text-xs">
                                                {customer.total_orders} pedidos • R$ {customer.total_spent.toFixed(2)} total
                                            </p>
                                            {customer.last_order_date && (
                                                <p className="text-xs">
                                                    Último pedido: {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingCustomer(customer)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        {customer.phone && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => handleWhatsApp(customer.phone!, customer.name, inactive)}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                WhatsApp
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <NewCustomerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => {
                    loadCustomers();
                    setIsDialogOpen(false);
                }}
            />

            <EditCustomerDialog
                customer={editingCustomer}
                open={!!editingCustomer}
                onOpenChange={(open) => !open && setEditingCustomer(null)}
                onSuccess={() => {
                    loadCustomers();
                    setEditingCustomer(null);
                }}
            />
        </div>
    );
};

export default Clientes;
