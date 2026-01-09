import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Plus, Search, MessageCircle, Filter, Pencil, Trash2, CheckSquare, Square, X, Mail, Download, Upload } from 'lucide-react';
import { getCustomers, deleteCustomer, createCustomer } from '@/lib/database';
import { exportToExcel, importFromExcel, getValue } from '@/lib/excel';
import type { Customer } from '@/types/database';

// ... (in component)

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
        loadCustomers();
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
                <div className="relative">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleImport}
                        title="Importar Excel"
                    />
                    <Button variant="outline" size="icon" title="Importar Excel">
                        <Upload className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" size="icon" onClick={handleExport} title="Exportar Excel">
                    <Download className="w-4 h-4" />
                </Button>
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

        <Card>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedClients.length === filteredCustomers.length && filteredCustomers.length > 0}
                                onCheckedChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium">Selecionar Todos</span>
                        </div>
                        <div className="hidden md:block h-4 w-px bg-border" />

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium whitespace-nowrap">Último pedido entre:</span>
                            </div>
                            <div className="flex items-center gap-2 flex-1 md:flex-none">
                                <Input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                    className="h-8 w-full md:w-auto min-w-[120px]"
                                />
                                <span className="text-sm text-muted-foreground">e</span>
                                <Input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                    className="h-8 w-full md:w-auto min-w-[120px]"
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
                            className={`hover:shadow-md transition-all group ${isSelected ? 'border-primary bg-primary/5' : ''}`}
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
                                            {customer.email && (
                                                <p className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3" />
                                                    {customer.email}
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

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingCustomer(customer)}
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={async () => {
                                            if (confirm(`Excluir ${customer.name}?`)) {
                                                const { error } = await deleteCustomer(customer.id);
                                                if (!error) {
                                                    toast({ title: 'Cliente excluído' });
                                                    loadCustomers();
                                                }
                                            }
                                        }}
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
                                {/* Mobile: always visible */}
                                <div className="flex gap-2 md:hidden">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingCustomer(customer)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
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
