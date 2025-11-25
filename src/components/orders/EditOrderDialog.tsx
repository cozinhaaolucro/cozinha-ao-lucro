import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2 } from 'lucide-react';
import { getCustomers, getProducts } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Customer, Product, OrderWithDetails } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

type EditOrderDialogProps = {
    order: OrderWithDetails | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const EditOrderDialog = ({ order, open, onOpenChange, onSuccess }: EditOrderDialogProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        delivery_date: '',
        delivery_time: '',
        notes: '',
        status: 'pending' as const,
    });
    const [items, setItems] = useState<Array<{ id?: string; product_id: string; product_name: string; quantity: number; unit_price: number }>>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadData();
            if (order) {
                setFormData({
                    customer_id: order.customer_id || '',
                    delivery_date: order.delivery_date || '',
                    delivery_time: order.delivery_time || '',
                    notes: order.notes || '',
                    status: order.status as any,
                });
                setItems(order.items?.map(item => ({
                    id: item.id,
                    product_id: item.product_id || '',
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })) || []);
            }
        }
    }, [open, order]);

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
        const firstProduct = products[0];
        setItems([...items, {
            product_id: firstProduct.id,
            product_name: firstProduct.name,
            quantity: 1,
            unit_price: firstProduct.selling_price || 0
        }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
        const updated = [...items];
        if (field === 'product_id') {
            const product = products.find(p => p.id === value);
            if (product) {
                updated[index] = {
                    ...updated[index],
                    product_id: value as string,
                    product_name: product.name,
                    unit_price: product.selling_price || 0
                };
            }
        } else {
            updated[index] = { ...updated[index], quantity: Number(value) };
        }
        setItems(updated);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        const totalValue = calculateTotal();

        const { error: orderError } = await supabase
            .from('orders')
            .update({
                customer_id: formData.customer_id || null,
                delivery_date: formData.delivery_date || null,
                delivery_time: formData.delivery_time || null,
                notes: formData.notes || null,
                status: formData.status,
                total_value: totalValue,
                updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);

        if (orderError) {
            toast({ title: 'Erro ao atualizar pedido', description: orderError.message, variant: 'destructive' });
            return;
        }

        await supabase.from('order_items').delete().eq('order_id', order.id);

        if (items.length > 0) {
            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(items.map(item => ({
                    order_id: order.id,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    subtotal: item.unit_price * item.quantity,
                })));

            if (itemsError) {
                toast({ title: 'Erro ao atualizar itens', description: itemsError.message, variant: 'destructive' });
                return;
            }
        }

        toast({ title: 'Pedido atualizado com sucesso!' });
        onSuccess();
        onOpenChange(false);
    };

    const handleCancel = async () => {
        if (!order) return;
        if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', order.id);

        if (!error) {
            toast({ title: 'Pedido cancelado' });
            onSuccess();
            onOpenChange(false);
        } else {
            toast({ title: 'Erro ao cancelar pedido', variant: 'destructive' });
        }
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Editar Pedido</span>
                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>
                            {order.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customer">Cliente</Label>
                            <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione ou deixe em branco" />
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
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
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
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Itens do Pedido</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                                <Plus className="w-4 h-4" />
                                Adicionar Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item, index) => (
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
                                        R$ {(item.unit_price * item.quantity).toFixed(2)}
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
                            ))}
                            {items.length > 0 && (
                                <div className="flex justify-end font-bold text-lg pt-2 border-t">
                                    Total: R$ {calculateTotal().toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Salvar Alterações</Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        {order.status !== 'cancelled' && (
                            <Button type="button" variant="destructive" onClick={handleCancel} className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                Cancelar Pedido
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditOrderDialog;
