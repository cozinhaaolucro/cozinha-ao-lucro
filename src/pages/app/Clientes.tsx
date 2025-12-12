import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Plus, Search, MessageCircle, Filter, Pencil, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { getCustomers, deleteCustomer } from '@/lib/database';
import type { Customer } from '@/types/database';
import NewCustomerDialog from '@/components/customers/NewCustomerDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';
import { toast } from '@/components/ui/use-toast';

const Clientes = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [selectedClients, setSelectedClients] = useState<string[]>([]);

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
            ? `Olá ${name}! Sentimos sua falta! 😊 Temos novidades deliciosas pra você!`
            : `Olá ${name}! Tudo bem? 😊`;
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const toggleSelectAll = () => {
        if (selectedClients.length === filteredCustomers.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(filteredCustomers.map(c => c.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(c => c !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const handleBulkDelete = async () => {
        if (confirm(`Tem certeza que deseja excluir ${selectedClients.length} clientes?`)) {
            let successCount = 0;
            for (const id of selectedClients) {
                const { error } = await deleteCustomer(id);
                if (!error) successCount++;
            }
            toast({
                title: "Exclusão em massa",
                description: `${successCount} clientes excluídos com sucesso.`
            });
            setSelectedClients([]);
            loadCustomers();
        }
    };

    const handleBulkMessage = () => {
        const clientsToSend = customers.filter(c => selectedClients.includes(c.id) && c.phone);

        if (clientsToSend.length === 0) {
            toast({ title: "Nenhum telefone", description: "Nenhum dos clientes selecionados possui telefone.", variant: "destructive" });
            return;
        }

        if (confirm(`Isso abrirá ${clientsToSend.length} abas do WhatsApp. Deseja continuar?`)) {
            clientsToSend.forEach((client, index) => {
                setTimeout(() => {
                    const inactive = isInactive(client.last_order_date);
                    handleWhatsApp(client.phone!, client.name, inactive);
                }, index * 500); // Small delay to prevent browser blocking
            });
        }
    };

    return (
        <div className="space-y-6 relative">
            {selectedClients.length > 0 && createPortal(
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in w-[90%] md:w-auto justify-center">
                    <span className="font-medium text-sm">{selectedClients.length} selecionados</span>
                    <div className="h-4 w-px bg-background/20" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-background hover:bg-background/20 hover:text-background gap-2"
                        onClick={handleBulkMessage}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Enviar Mensagem
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300 gap-2"
                        onClick={handleBulkDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-background/50 hover:text-background ml-2"
                        onClick={() => setSelectedClients([])}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>,
                document.body
            )}

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
                    <div className="flex items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedClients.length === filteredCustomers.length && filteredCustomers.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                                <span className="text-sm font-medium">Selecionar Todos</span>
                            </div>
                            <div className="h-4 w-px bg-border" />
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Último pedido entre:</span>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                    className="max-w-xs h-8"
                                />
                                <span className="text-sm text-muted-foreground">e</span>
                                <Input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                    className="max-w-xs h-8"
                                />
                                {(dateFilter.start || dateFilter.end) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDateFilter({ start: '', end: '' })}
                                        className="h-8"
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </div>
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
                        const isSelected = selectedClients.includes(customer.id);

                        return (
                            <Card
                                key={customer.id}
                                className={`hover:shadow-md transition-all ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                            >
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleSelect(customer.id)}
                                        />
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
