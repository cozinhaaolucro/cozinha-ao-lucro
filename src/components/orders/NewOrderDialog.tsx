import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import { getCustomers, getProducts, createOrder } from '@/lib/database';
import type { Customer, Product } from '@/types/database';
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
        status: 'pending' as const,
    });
    const [items, setItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
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
        if (productsRes.data) setProducts(productsRes.data as any);
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
                order_number: null,
            },
            orderItems
        );

        if (!error) {
            toast({ title: 'Pedido criado com sucesso!' });
            onSuccess();
            resetForm();
        } else {
            toast({ title: 'Erro ao criar pedido', variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({ customer_id: '', delivery_date: '', delivery_time: '', notes: '', status: 'pending' });
        setItems([]);
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
                        <div>
                            <Label htmlFor="customer">Cliente (opcional)</Label>
                            <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
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
