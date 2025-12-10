import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, UserPlus } from 'lucide-react';
import { getCustomers, getProducts, createOrder, createCustomer } from '@/lib/database';
import type { Customer, Product, OrderStatus } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

type NewOrderDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const NewOrderDialog = ({ open, onOpenChange, onSuccess }: NewOrderDialogProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        delivery_date: '',
        delivery_time: '',
        notes: '',
        status: 'pending' as OrderStatus,
    });
    const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
    const [showNewCustomer, setShowNewCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: '',
    });
    const [creatingCustomer, setCreatingCustomer] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        const [customersRes, productsRes] = await Promise.all([
            getCustomers(),
            getProducts(),
        ]);
        if (customersRes.data) setCustomers(customersRes.data);
        if (productsRes.data) setProducts(productsRes.data);
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerData.name.trim()) {
            toast({ title: 'Digite o nome do cliente', variant: 'destructive' });
            return;
        }

        setCreatingCustomer(true);
        const { data, error } = await createCustomer({
            name: newCustomerData.name,
            phone: newCustomerData.phone || null,
            address: newCustomerData.address || null,
            notes: newCustomerData.notes || null,
            last_order_date: null,
        });

        if (!error && data) {
            toast({ title: 'Cliente criado com sucesso!' });
            setCustomers([...customers, data]);
            setFormData({ ...formData, customer_id: data.id });
            setShowNewCustomer(false);
            setNewCustomerData({ name: '', phone: '', address: '', notes: '' });
        } else {
            toast({ title: 'Erro ao criar cliente', description: error?.message, variant: 'destructive' });
        }
        setCreatingCustomer(false);
    };

    const addItem = () => {
        if (products.length === 0) {
            toast({ title: 'Cadastre produtos primeiro!', variant: 'destructive' });
            return;
        }
        setItems([...items, { product_id: products[0].id, quantity: 1 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            const product = products.find((p) => p.id === item.product_id);
            return total + (product?.selling_price || 0) * item.quantity;
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            toast({ title: 'Adicione pelo menos um produto', variant: 'destructive' });
            return;
        }

        const orderItems = items.map((item) => {
            const product = products.find((p) => p.id === item.product_id)!;
            return {
                product_id: item.product_id,
                product_name: product.name,
                quantity: item.quantity,
                unit_price: product.selling_price || 0,
                subtotal: (product.selling_price || 0) * item.quantity,
            };
        });

        const { error } = await createOrder(
            {
                customer_id: formData.customer_id || null,
                delivery_date: formData.delivery_date || null,
                delivery_time: formData.delivery_time || null,
                notes: formData.notes || null,
                status: formData.status,
                total_value: calculateTotal(),
                order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            },
            orderItems
        );

        if (!error) {
            toast({ title: 'Pedido criado com sucesso!' });
            onSuccess();
            resetForm();
        } else {
            console.error('Erro detalhado ao criar pedido:', error);
            toast({
                title: 'Erro ao criar pedido',
                description: error.message || 'Verifique o console para mais detalhes.',
                variant: 'destructive'
            });
        }
    };

    const resetForm = () => {
        setFormData({ customer_id: '', delivery_date: '', delivery_time: '', notes: '', status: 'pending' });
        setItems([]);
        setShowNewCustomer(false);
        setNewCustomerData({ name: '', phone: '', address: '', notes: '' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Pedido</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer">Cliente (opcional)</Label>
                            {!showNewCustomer ? (
                                <div className="flex gap-2">
                                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Selecione o cliente" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowNewCustomer(true)}
                                        title="Criar novo cliente"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Novo Cliente</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setShowNewCustomer(false)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Nome do cliente *"
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Telefone (WhatsApp)"
                                        value={newCustomerData.phone}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Endereço"
                                        value={newCustomerData.address}
                                        onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCreateCustomer}
                                        disabled={creatingCustomer}
                                        className="w-full"
                                    >
                                        {creatingCustomer ? 'Criando...' : 'Criar e Selecionar'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value as OrderStatus })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">A Fazer</SelectItem>
                                    <SelectItem value="preparing">Em Produção</SelectItem>
                                    <SelectItem value="ready">Pronto</SelectItem>
                                    <SelectItem value="delivered">Entregue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="delivery_date">Data de Entrega</Label>
                            <Input
                                id="delivery_date"
                                type="date"
                                value={formData.delivery_date}
                                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="delivery_time">Horário</Label>
                            <Input
                                id="delivery_time"
                                type="time"
                                value={formData.delivery_time}
                                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Detalhes adicionais do pedido..."
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Itens do Pedido</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Adicionar Produto
                            </Button>
                        </div>

                        {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum item adicionado
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {items.map((item, index) => {
                                    const product = products.find((p) => p.id === item.product_id);
                                    return (
                                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                            <Select
                                                value={item.product_id}
                                                onValueChange={(value) => updateItem(index, 'product_id', value)}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} - R$ {(p.selling_price || 0).toFixed(2)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-20"
                                            />
                                            <span className="text-sm font-medium w-24 text-right">
                                                R$ {((product?.selling_price || 0) * item.quantity).toFixed(2)}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(index)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                                <div className="flex justify-end font-bold text-lg pt-2 border-t">
                                    Total: R$ {calculateTotal().toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Criar Pedido</Button>
                        <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewOrderDialog;

