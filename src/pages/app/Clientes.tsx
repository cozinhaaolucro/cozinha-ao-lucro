import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Plus, Search, MessageCircle, Filter, Pencil, Trash2, X, Mail, Download, Upload, Users, FileSpreadsheet, FileDown, FileText, ChevronDown } from 'lucide-react';
import { getCustomers, deleteCustomer, createCustomer } from '@/lib/database';
import { exportToExcel, exportToCSV, importFromExcel, getValue } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/database';
import NewCustomerDialog from '@/components/customers/NewCustomerDialog';
import EditCustomerDialog from '@/components/customers/EditCustomerDialog';
import { Star, Clock, UserPlus } from 'lucide-react';
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
import { useCustomers } from '@/hooks/useQueries';

const Clientes = () => {
    const { toast } = useToast();
    // derived customers from hook
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateRange | undefined>();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    // const [totalCount, setTotalCount] = useState(0); // Derived from hook
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // React Query Hook
    const filters = {
        startDate: dateFilter?.from,
        endDate: dateFilter?.to,
        onlyInactive: showInactive
    };

    const { data: customerData, isLoading: loading, refetch: refetchCustomers } = useCustomers(page, limit, debouncedSearch, filters);

    // Derived Data
    const customers = customerData?.customers || [];
    const totalCount = customerData?.count || 0;

    // Remove manual loadCustomers and effect
    // const loadCustomers = ...
    // useEffect(() => { refetchCustomers() ... }, [...])

    const isInactive = (lastOrderDate: string | null) => {
        if (!lastOrderDate) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(lastOrderDate) < thirtyDaysAgo;
    };

    // Client-side filtering removed in favor of server-side
    const filteredCustomers = customers; // direct reference now

    const toggleSelect = (id: string) => {
        setSelectedClients((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedClients.length === filteredCustomers.length) {
            setSelectedClients([]);
        } else {
            setSelectedClients(filteredCustomers.map((c) => c.id));
        }
    };

    const handleWhatsApp = (phone: string, name: string, inactive: boolean) => {
        const message = inactive
            ? `Olá ${name}! Sentimos sua falta! Temos novidades especiais para você. 🎉`
            : `Olá ${name}! Tudo bem? Estou entrando em contato para...`;
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleBulkMessage = () => {
        const selected = customers.filter((c) => selectedClients.includes(c.id) && c.phone);
        if (selected.length === 0) {
            toast({ title: 'Nenhum cliente selecionado tem telefone cadastrado', variant: 'destructive' });
            return;
        }
        selected.forEach((customer) => {
            handleWhatsApp(customer.phone!, customer.name, isInactive(customer.last_order_date));
        });
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Excluir ${selectedClients.length} clientes?`)) return;

        let successCount = 0;
        for (const id of selectedClients) {
            const { error } = await deleteCustomer(id);
            if (!error) successCount++;
        }

        toast({ title: `${successCount} clientes excluídos` });
        setSelectedClients([]);
        refetchCustomers();
    };

    const handleExport = (format: 'excel' | 'csv') => {
        const dataToExport = customers.map((c) => ({
            Nome: c.name,
            Email: c.email || '',
            Telefone: c.phone || '',
            Endereço: c.address || '',
            Observações: c.notes || '',
            'Total Pedidos': c.total_orders,
            'Total Gasto': c.total_spent,
            'Último Pedido': c.last_order_date || ''
        }));
        if (format === 'csv') {
            exportToCSV(dataToExport, 'clientes');
        } else {
            exportToExcel(dataToExport, 'clientes');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data: any[] = await importFromExcel(file);
            let successCount = 0;
            let errorCount = 0;

            for (const row of data) {
                const name = getValue(row, ['Nome', 'Name', 'name', 'Cliente', 'Customer', 'cliente']);
                if (!name) {
                    console.warn("Row skipped, missing name:", row);
                    continue;
                }

                const { error } = await createCustomer({
                    name: name,
                    email: getValue(row, ['Email', 'email', 'E-mail', 'e-mail']) || null,
                    phone: getValue(row, ['Telefone', 'Phone', 'phone', 'Celular', 'Mobile']) || null,
                    address: getValue(row, ['Endereço', 'Address', 'address', 'Endereco']) || null,
                    notes: getValue(row, ['Observações', 'Notes', 'notes', 'Obs', 'obs']) || null,
                    last_order_date: null
                });

                if (error) errorCount++;
                else successCount++;
            }

            toast({
                title: 'Importação concluída',
                description: `${successCount} clientes importados. ${errorCount > 0 ? `${errorCount} falhas.` : ''}`,
                variant: successCount > 0 ? 'default' : 'destructive'
            });
            refetchCustomers();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro na importação', description: 'Verifique o formato do arquivo.', variant: 'destructive' });
        }

        e.target.value = '';
    };

    return (
        <div className="space-y-6 relative">
            {selectedClients.length > 0 && createPortal(
                <div className="fixed bottom-0 md:bottom-6 left-0 md:left-1/2 md:-translate-x-1/2 z-[100] bg-foreground text-background px-6 py-4 md:py-3 rounded-t-xl md:rounded-full shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in w-full md:w-auto justify-center">
                    <span className="font-medium text-sm whitespace-nowrap">{selectedClients.length} selecionados</span>
                    <div className="h-4 w-px bg-background/20" />
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-background hover:bg-background/20 hover:text-background gap-2 px-2"
                        onClick={handleBulkMessage}
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Enviar Mensagem</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:bg-red-900/30 hover:text-red-300 gap-2 px-2"
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
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleImport}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        title="Importar Excel"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" title="Exportar / Baixar Modelo">
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
                            <DropdownMenuItem onClick={() => import('@/lib/excel').then(mod => mod.downloadTemplate(['Nome', 'Email', 'Telefone', 'Endereço', 'Observações'], 'clientes'))}>
                                <FileDown className="w-4 h-4 mr-2" /> Modelo de Importação
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                        <Plus className="w-4 h-4" />
                        Novo Cliente
                    </Button>
                </div>
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border border-border/50 shadow-sm border-l-4 border-l-primary/50">
                <div className="flex items-center gap-2">
                    <Checkbox
                        checked={selectedClients.length === filteredCustomers.length && filteredCustomers.length > 0}
                        onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">Selecionar Todos</span>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">Último pedido:</span>
                    </div>
                    <DateRangePicker
                        date={dateFilter}
                        setDate={setDateFilter}
                        className="w-full md:w-auto"
                    />
                </div>
            </div>

            <div className="grid gap-3">
                {filteredCustomers.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <Users className="w-12 h-12 text-muted-foreground/20" />
                                <h3 className="font-bold text-lg">{search ? 'Nenhum cliente encontrado' : 'Sua lista de clientes está vazia'}</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                    {search
                                        ? 'Tente buscar por um nome ou telefone diferente.'
                                        : 'Comece cadastrando seus clientes para acompanhar o histórico de compras e fidelidade.'}
                                </p>
                                {!search && (
                                    <Button variant="outline" className="mt-4 gap-2" onClick={() => setIsDialogOpen(true)}>
                                        <Plus className="w-4 h-4" /> Cadastrar Meu Primeiro Cliente
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredCustomers.map((customer) => {
                        const inactive = isInactive(customer.last_order_date);
                        const isSelected = selectedClients.includes(customer.id);

                        return (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                isSelected={isSelected}
                                toggleSelect={toggleSelect}
                                isInactive={inactive}
                                setEditingCustomer={setEditingCustomer}
                                refetchCustomers={refetchCustomers}
                                handleWhatsApp={handleWhatsApp}
                            />
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between border-t pt-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {customers.length} de {totalCount} clientes
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Ant.
                        </Button>
                        <div className="text-sm font-medium min-w-[3rem] text-center">
                            Pág. {page}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={customers.length < limit || (page * limit) >= totalCount || loading}
                        >
                            Próx.
                        </Button>
                    </div>
                </div>
            )}

            <NewCustomerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSuccess={() => {
                    refetchCustomers();
                    setIsDialogOpen(false);
                }}
            />

            <EditCustomerDialog
                customer={editingCustomer}
                open={!!editingCustomer}
                onOpenChange={(open) => !open && setEditingCustomer(null)}
                onSuccess={() => {
                    refetchCustomers();
                    setEditingCustomer(null);
                }}
            />
        </div>
    );
};


const CustomerCard = ({ customer, isSelected, toggleSelect, isInactive, setEditingCustomer, refetchCustomers, handleWhatsApp }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card
            className={`transition-all cursor-pointer border hover:border-border/80 ${isSelected ? 'border-primary bg-primary/5' : ''} group`}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <CardContent className="p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(customer.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-1"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{customer.name}</h4>
                                {(customer.total_orders >= 10 || customer.total_spent >= 500) && (
                                    <Star className="w-3.5 h-3.5 fill-[#C9A34F] text-[#C9A34F] shrink-0" />
                                )}
                            </div>
                            {customer.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {customer.phone && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:text-[#4C9E7C] hover:bg-[#4C9E7C]/10 transition-colors"
                                onClick={() => handleWhatsApp(customer.phone!, customer.name, isInactive)}
                                title="WhatsApp"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 animate-in slide-in-from-top-1 fade-in duration-200">
                        <div className="flex flex-col sm:flex-row gap-y-2 gap-x-6 justify-between items-start sm:items-center text-xs text-muted-foreground">

                            <div className="space-y-1.5 flex-1 min-w-0 w-full">
                                <div className="flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap" title="Total de Pedidos">
                                        <FileText className="w-3.5 h-3.5 opacity-70" />
                                        {customer.total_orders} pedidos
                                    </span>
                                    <span className="flex items-center gap-1.5 whitespace-nowrap" title="Total Gasto">
                                        <span className="font-bold opacity-70">R$</span>
                                        {customer.total_spent.toFixed(2)}
                                    </span>
                                    {customer.last_order_date && (
                                        <span className="flex items-center gap-1.5 whitespace-nowrap" title="Último Pedido">
                                            <Clock className="w-3.5 h-3.5 opacity-70" />
                                            {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>

                                {(customer.email || customer.address) && (
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 opacity-80">
                                        {customer.email && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Mail className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[200px]">{customer.email}</span>
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-center gap-1.5 truncate">
                                                <div className="w-3.5 h-3.5 flex items-center justify-center">📍</div>
                                                <span className="truncate max-w-[250px]">{customer.address}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-1 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCustomer(customer)}
                                    className="h-7 w-7 p-0 hover:bg-muted"
                                    title="Editar"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={async () => {
                                        if (confirm(`Excluir ${customer.name}?`)) {
                                            const { error } = await deleteCustomer(customer.id);
                                            if (!error) refetchCustomers();
                                        }
                                    }}
                                    title="Excluir"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default Clientes;
