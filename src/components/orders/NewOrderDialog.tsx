import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, UserPlus, ShoppingCart, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getCustomers, getProducts, createOrder, createCustomer, updateIngredient, createStockMovement } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { Customer, Product, OrderStatus, PaymentMethod, DeliveryMethod } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        start_date: '',
        payment_method: 'pix' as PaymentMethod,
        delivery_method: 'pickup' as DeliveryMethod,
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

    // Stock Alert State
    const [missingIngredients, setMissingIngredients] = useState<Array<{ id: string; name: string; missing: number; current: number; reserved: number; needed: number; unit: string }>>([]);
    const [showStockAlert, setShowStockAlert] = useState(false);
    const [isRestocking, setIsRestocking] = useState(false);
    const [pendingSubmit, setPendingSubmit] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

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
            email: null,
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

    const calculateMissingStock = async () => {
        // 1. Identificar todos os ingredientes necessários para este pedido
        const needed = new Map<string, { name: string; qty: number; unit: string }>();
        const ingredientIds = new Set<string>();

        items.forEach(item => {
            const product = products.find(p => p.id === item.product_id);
            if (product?.product_ingredients) {
                product.product_ingredients.forEach((pi: any) => {
                    const ing = pi.ingredient;
                    if (ing) {
                        const total = (pi.quantity * item.quantity);
                        const existing = needed.get(ing.id) || { name: ing.name, qty: 0, unit: ing.unit };
                        existing.qty += total;
                        needed.set(ing.id, existing);
                        ingredientIds.add(ing.id);
                    }
                });
            }
        });

        if (ingredientIds.size === 0) return [];

        // 2. Buscar dados FRESCOS de estoque do banco para esses ingredientes
        // Isso evita problemas com cache local desatualizado
        const { data: freshIngredients } = await supabase
            .from('ingredients')
            .select('id, stock_quantity, name, unit')
            .in('id', Array.from(ingredientIds));

        const stockMap = new Map<string, number>();
        freshIngredients?.forEach((ing: any) => {
            stockMap.set(ing.id, ing.stock_quantity);
        });

        // 3. Verificar falta comparando Necessidade vs Estoque Fresco
        const missing: any[] = [];
        needed.forEach((val, key) => {
            const currentStock = stockMap.get(key) || 0;

            // Estoque atual já reflete deduções de pedidos em produção (via trigger SQL)
            if (val.qty > currentStock) {
                missing.push({
                    id: key,
                    name: val.name,
                    missing: val.qty - currentStock,
                    current: currentStock,
                    reserved: 0,
                    needed: val.qty,
                    unit: val.unit
                });
            }
        });

        return missing;
    };

    const handleAutoRestock = async () => {
        setIsRestocking(true);
        try {
            // Process all missing ingredients
            await Promise.all(missingIngredients.map(async (item) => {
                // 1. Create Stock Movement (Isso já atualiza o estoque via RPC 'increment_stock' dentro de createStockMovement em database.ts)
                await createStockMovement({
                    ingredient_id: item.id,
                    type: 'in',
                    quantity: item.missing,
                    reason: `Auto-refill para Pedido (Falta: ${item.missing})`
                });
            }));

            toast({ title: 'Estoque atualizado automaticamente!' });
            setShowStockAlert(false);
            // Proceed with order creation
            processOrderCreation();

        } catch (error) {
            console.error('Auto-restock error', error);
            toast({ title: 'Erro ao atualizar estoque', variant: 'destructive' });
        } finally {
            setIsRestocking(false);
        }
    };

    const processOrderCreation = async () => {
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
                start_date: formData.start_date || null,
                order_number: `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            } as any,
            orderItems as any
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (items.length === 0) {
            toast({ title: 'Adicione pelo menos um produto', variant: 'destructive' });
            return;
        }

        // Check Stock First
        const missing = await calculateMissingStock();
        if (missing.length > 0) {
            setMissingIngredients(missing);
            setShowStockAlert(true);
            return;
        }

        processOrderCreation();
    };

    const resetForm = () => {
        setFormData({ customer_id: '', delivery_date: '', delivery_time: '', notes: '', status: 'pending', start_date: '', payment_method: 'pix', delivery_method: 'pickup' });
        setItems([]);
        setShowNewCustomer(false);
        setNewCustomerData({ name: '', phone: '', address: '', notes: '' });
        onOpenChange(false);
    };

    const FormContent = (
        <div className="space-y-6 pb-20 sm:pb-0"> {/* Added pb-20 to prevent content hidden behind button on mobile */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    <h3>Cliente</h3>
                </div>
                <div className="space-y-2">
                    {!showNewCustomer ? (
                        <div className="flex gap-2 items-center px-1">
                            <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                                <SelectTrigger className="flex-1 h-9 min-w-0 text-sm"> {/* Reduced to h-9 and added min-w-0 */}
                                    <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.length === 0 && <SelectItem value="none" disabled>Nenhum cliente cadastrado</SelectItem>}
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
                                className="h-9 w-9 flex-shrink-0" /* Reduced to h-9 w-9 */
                            >
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3 p-4 border rounded-xl bg-muted/30 shadow-inner">
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
                                className="h-11"
                            />
                            <Input
                                placeholder="WhatsApp"
                                value={newCustomerData.phone}
                                onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                                className="h-11"
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateCustomer}
                                disabled={creatingCustomer}
                                className="w-full h-10"
                            >
                                {creatingCustomer ? 'Criando...' : 'Salvar Novo Cliente'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3>Entrega</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="delivery_date">Data de Entrega</Label>
                            <Input
                                id="delivery_date"
                                type="date"
                                value={formData.delivery_date}
                                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label htmlFor="delivery_time">Horário</Label>
                            <Input
                                id="delivery_time"
                                type="time"
                                value={formData.delivery_time}
                                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div>
                            <Label htmlFor="start_date">Data de Produção</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="h-10"
                            />
                        </div>
                    </div>
                </div>



                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                        <div className="w-5 h-5 rounded-full border-2 border-primary" />
                        <h3>Detalhes</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(value: string) => setFormData({ ...formData, status: value as OrderStatus })}>
                                <SelectTrigger className="h-10">
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
                        <div>
                            <Label htmlFor="payment_method">Forma de Pagamento</Label>
                            <Select value={formData.payment_method} onValueChange={(value: string) => setFormData({ ...formData, payment_method: value as PaymentMethod })}>
                                <SelectTrigger className="h-10">
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
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pickup">Retirada no Balcão</SelectItem>
                                    <SelectItem value="delivery">Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h3>Itens</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 h-8">
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </Button>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/10">
                        <p>Nenhum produto adicionado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item, index) => {
                            const product = products.find((p) => p.id === item.product_id);
                            return (
                                <div key={index} className="flex flex-col gap-2 p-3 border rounded-xl bg-card shadow-sm">
                                    <div className="flex gap-2">
                                        <Select
                                            value={item.product_id}
                                            onValueChange={(value) => updateItem(index, 'product_id', value)}
                                        >
                                            <SelectTrigger className="flex-1 h-10 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 border rounded-md p-1 bg-background">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateItem(index, 'quantity', Math.max(1, item.quantity - 1))}>-</Button>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-12 h-8 border-none text-center p-0 focus-visible:ring-0"
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateItem(index, 'quantity', item.quantity + 1)}>+</Button>
                                        </div>
                                        <span className="font-medium text-sm">
                                            R$ {((product?.selling_price || 0) * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    className="min-h-[80px]"
                />
            </div>
        </div >
    );

    const TotalFooter = (
        <div className="flex items-center justify-between w-full gap-4 pt-2 border-t mt-auto bg-background/95 backdrop-blur">
            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Total do Pedido</span>
                <span className="text-xl font-bold text-primary">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={resetForm}>Voltar</Button>
                <Button onClick={() => handleSubmit()} className="px-6">Criar Pedido</Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="h-[90vh] flex flex-col">
                    <DrawerHeader className="border-b pb-4">
                        <DrawerTitle>Novo Pedido</DrawerTitle>
                        <DrawerDescription>Preencha os dados abaixo.</DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="flex-1 overflow-y-auto">
                        <div className="px-4 py-4 w-full max-w-md mx-auto">
                            {FormContent}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t mt-auto">
                        <Button className="w-full text-lg h-12" onClick={() => handleSubmit()}>
                            Criar Pedido - R$ {calculateTotal().toFixed(2)}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2 border-b bg-background z-10 rounded-t-lg">
                    <DialogTitle>Novo Pedido</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 overflow-y-auto">
                    {FormContent}
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 rounded-b-lg">
                    {TotalFooter}
                </div>
            </DialogContent>

            <AlertDialog open={showStockAlert} onOpenChange={setShowStockAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            Estoque Insuficiente
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Os seguintes ingredientes não têm estoque suficiente para este pedido:
                            <ul className="mt-2 text-sm space-y-2 bg-muted/50 p-3 rounded max-h-[200px] overflow-auto">
                                {missingIngredients.map(item => (
                                    <li key={item.id} className="space-y-1 pb-2 border-b border-muted last:border-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="font-bold text-red-500">
                                                Falta: {item.missing.toFixed(2)} {item.unit}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-4">
                                            <span>Disponível: {Math.max(0, item.current).toFixed(2)}</span>
                                            {item.reserved > 0 && (
                                                <span className="text-amber-600">
                                                    Reservado: {item.reserved.toFixed(2)}
                                                </span>
                                            )}
                                            <span>Este pedido: {item.needed.toFixed(2)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-3 font-medium">
                                Deseja adicionar a quantidade faltante ao estoque automaticamente e prosseguir?
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-between">
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                                setShowStockAlert(false);
                                processOrderCreation();
                            }}
                            disabled={isRestocking}
                        >
                            Desconsiderar e criar
                        </Button>

                        <div className="flex gap-2">
                            <AlertDialogCancel disabled={isRestocking}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleAutoRestock();
                                }}
                                className="bg-amber-600 hover:bg-[hsl(182,16%,55%)] hover:text-white"
                                disabled={isRestocking}
                            >
                                {isRestocking ? 'Atualizando...' : 'Regularizar e Criar'}
                            </AlertDialogAction>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    );
};

export default NewOrderDialog;

