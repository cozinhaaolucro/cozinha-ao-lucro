import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2, MessageCircle } from 'lucide-react';
import { getCustomers, getProducts } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Customer, Product, OrderWithDetails, OrderStatus, PaymentMethod, DeliveryMethod } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { ScrollArea } from '@/components/ui/scroll-area';

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
        status: 'pending' as OrderStatus,
        start_date: '',
        payment_method: 'pix' as PaymentMethod,
        delivery_method: 'pickup' as DeliveryMethod,
    });
    const [items, setItems] = useState<Array<{ id?: string; product_id: string; product_name: string; quantity: number; unit_price: number }>>([]);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (open) {
            if (order?.customer) {
                setCustomers([order.customer]);
            }
            loadData();
            if (order) {
                setFormData({
                    customer_id: order.customer_id || '',
                    delivery_date: order.delivery_date || '',
                    delivery_time: order.delivery_time || '',
                    notes: order.notes || '',
                    status: order.status,
                    start_date: order.start_date || '',
                    payment_method: order.payment_method || 'pix',
                    delivery_method: order.delivery_method || 'pickup',
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

        if (customersRes.data) {
            // Ensure the current order's customer is included in the list
            let allCustomers = customersRes.data;
            if (order?.customer && !allCustomers.find(c => c.id === order.customer_id)) {
                allCustomers = [order.customer, ...allCustomers];
            }
            setCustomers(allCustomers);
        }

        if (productsRes.data) setProducts(productsRes.data);
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
                start_date: formData.start_date || null,
                notes: formData.notes || null,
                status: formData.status,
                payment_method: formData.payment_method,
                delivery_method: formData.delivery_method,
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

    const handleDelete = async () => {
        if (!order) return;
        if (!confirm('Tem certeza que deseja EXCLUIR este pedido permanentemente?')) return;

        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', order.id);

        if (error) {
            toast({ title: 'Erro ao excluir pedido', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Pedido excluído com sucesso' });
            onSuccess();
            onOpenChange(false);
        }
    };

    const sendWhatsAppUpdate = (type: 'confirm' | 'dispatch' | 'ready') => {
        const customer = customers.find(c => c.id === formData.customer_id);
        if (!customer?.phone) {
            toast({ title: 'Cliente sem telefone cadastrado', variant: 'destructive' });
            return;
        }

        let message = '';
        const orderId = order?.display_id ? `#${String(order.display_id).padStart(4, '0')}` : `#${order?.id.slice(0, 8)}`;

        switch (type) {
            case 'confirm':
                message = `Olá ${customer.name}! Seu pedido #${orderId} foi confirmado e já está sendo preparado. ${formData.delivery_time ? `Previsão de entrega: ${formData.delivery_time}` : ''}`;
                break;
            case 'dispatch':
                message = `Olá ${customer.name}! Boas notícias: Seu pedido #${orderId} saiu para entrega! 🛵💨`;
                break;
            case 'ready':
                message = `Olá ${customer.name}! Seu pedido #${orderId} está pronto para retirada! 🛍️`;
                break;
        }

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = customer.phone.replace(/\D/g, '');
        const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

        window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, '_blank');
    };

    if (!order) return null;

    const FormFields = (
        <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="customer">Cliente</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder={order?.customer?.name || "Selecione o cliente"} />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select value={formData.payment_method} onValueChange={(value: string) => setFormData({ ...formData, payment_method: value as PaymentMethod })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pix">Pix</SelectItem>
                            <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                            <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="transfer">Transferência</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="delivery_method">Método de Entrega</Label>
                    <Select value={formData.delivery_method} onValueChange={(value: string) => setFormData({ ...formData, delivery_method: value as DeliveryMethod })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pickup">Retirada no Balcão</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Quick Status Updates */}
            <div className="bg-muted/30 p-3 rounded-lg border space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Ações Rápidas (WhatsApp)</Label>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-green-700 border-green-200 bg-green-50 hover:bg-green-100" onClick={() => sendWhatsAppUpdate('confirm')}>
                        <MessageCircle className="w-3.5 h-3.5" /> Confirmar
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={() => sendWhatsAppUpdate('dispatch')}>
                        <MessageCircle className="w-3.5 h-3.5" /> Saiu p/ Entrega
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100" onClick={() => sendWhatsAppUpdate('ready')}>
                        <MessageCircle className="w-3.5 h-3.5" /> Pronto p/ Retirada
                    </Button>
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
            <div className="grid grid-cols-1">
                <div className="space-y-2">
                    <Label htmlFor="start_date">Data de Produção / Início</Label>
                    <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">Pedido aparecerá na fila "A Fazer" nesta data.</p>
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
                        <div key={index} className="flex items-center gap-2 p-2 border rounded bg-background">
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
        </div >
    );

    const ActionButtons = () => (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button type="submit" form="edit-order-form" className="flex-1 h-10">Salvar Alterações</Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10">
                    Cancelar
                </Button>
                {order.status !== 'cancelled' && (
                    <Button type="button" variant="ghost" onClick={handleCancel} className="gap-2 text-destructive hover:bg-destructive/10 h-10">
                        <Trash2 className="w-4 h-4" />
                        Cancelar
                    </Button>

                )}
            </div>
            <div className="flex justify-end">
                <Button type="button" variant="link" onClick={handleDelete} className="text-muted-foreground hover:text-destructive text-xs h-auto p-0">
                    Excluir permanentemente
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[95vh]">
                    <DrawerHeader>
                        <DrawerTitle className="flex items-center justify-between">
                            <span>Editar Pedido {order.display_id ? `#${String(order.display_id).padStart(4, '0')}` : ''}</span>
                            <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>
                                {order.status}
                            </Badge>
                        </DrawerTitle>
                        <DrawerDescription>Edite as informações do pedido.</DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="h-full overflow-y-auto px-4">
                        <form id="edit-order-form" onSubmit={handleSubmit}>
                            {FormFields}
                        </form>
                    </ScrollArea>
                    <DrawerFooter className="pt-2 border-t bg-background z-50">
                        <ActionButtons />
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 sm:overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Editar Pedido {order.display_id ? `#${String(order.display_id).padStart(4, '0')}` : ''}</span>
                        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'default'}>
                            {order.status}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1">
                        <form id="edit-order-form" onSubmit={handleSubmit}>
                            <div className="px-6">
                                {FormFields}
                            </div>
                        </form>
                    </ScrollArea>
                    <div className="shrink-0 border-t bg-background p-6">
                        <ActionButtons />
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default EditOrderDialog;
