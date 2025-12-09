import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Customer, OrderWithDetails } from '@/types/database';
import { updateCustomer, getOrders } from '@/lib/database';
import { formatLocalDate } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { Phone, Calendar, DollarSign, ShoppingBag, Save } from 'lucide-react';

interface ClientProfileDrawerProps {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const ClientProfileDrawer = ({ customer, open, onOpenChange, onUpdate }: ClientProfileDrawerProps) => {
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                phone: customer.phone,
                internal_notes: customer.internal_notes,
                birth_date: customer.birth_date
            });
            loadCustomerHistory();
        }
    }, [customer]);

    const loadCustomerHistory = async () => {
        if (!customer) return;
        const { data } = await getOrders();
        if (data) {
            // Filter orders for this customer (in a real app, use a DB filter)
            const customerOrders = data.filter(o => o.customer_id === customer.id);
            setOrders(customerOrders);
        }
    };

    const handleSave = async () => {
        if (!customer) return;
        setLoading(true);
        const { error } = await updateCustomer(customer.id, formData);
        setLoading(false);

        if (error) {
            toast.error('Erro ao atualizar cliente');
        } else {
            toast.success('Cliente atualizado com sucesso!');
            onUpdate();
        }
    };

    if (!customer) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl flex items-center gap-2">
                        {customer.name}
                        <Badge variant="outline" className="ml-2 text-xs font-normal">
                            {orders.length} pedidos
                        </Badge>
                    </SheetTitle>
                    <SheetDescription>
                        Cliente desde {new Date(customer.created_at).toLocaleDateString()}
                    </SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Dados & Notas</TabsTrigger>
                        <TabsTrigger value="history">Histórico de Pedidos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="flex-1 overflow-y-auto py-4 space-y-6">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">WhatsApp</Label>
                                <div className="relative">
                                    <Input
                                        id="phone"
                                        value={formData.phone || ''}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-10"
                                    />
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="birth">Aniversário</Label>
                                <div className="relative">
                                    <Input
                                        id="birth"
                                        type="date"
                                        value={formData.birth_date || ''}
                                        onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="pl-10"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notas Internas</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Preferências, alergias, etc..."
                                    value={formData.internal_notes || ''}
                                    onChange={e => setFormData({ ...formData, internal_notes: e.target.value })}
                                    className="min-h-[150px]"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4 py-4">
                                {orders.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</p>
                                ) : (
                                    orders.map(order => (
                                        <div key={order.id} className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-bold flex items-center gap-2">
                                                        #{order.order_number || order.id.slice(0, 6)}
                                                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {order.status}
                                                        </Badge>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {order.delivery_date ? formatLocalDate(order.delivery_date) : 'Data indefinida'}
                                                    </p>
                                                </div>
                                                <p className="font-bold text-green-600">
                                                    R$ {order.total_value.toFixed(2)}
                                                </p>
                                            </div>
                                            {order.items && (
                                                <div className="text-xs text-muted-foreground">
                                                    {order.items.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <SheetFooter className="pt-4 border-t mt-auto">
                    <Button onClick={handleSave} disabled={loading} className="w-full">
                        {loading ? 'Salvando...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default ClientProfileDrawer;
