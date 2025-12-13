import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomer } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

type NewCustomerDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const NewCustomerDialog = ({ open, onOpenChange, onSuccess }: NewCustomerDialogProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await createCustomer({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            notes: formData.notes || null,
            last_order_date: null,
        });

        if (!error) {
            toast({ title: 'Cliente criado com sucesso!' });
            onSuccess();
            resetForm();
        } else {
            toast({ title: 'Erro ao criar cliente', description: error.message, variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Maria Silva"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="cliente@email.com"
                        />
                    </div>

                    <div>
                        <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(11) 98765-4321"
                        />
                    </div>

                    <div>
                        <Label htmlFor="address">Endereço</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Rua, número, bairro"
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Preferências, restrições alimentares..."
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Criar Cliente</Button>
                        <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewCustomerDialog;
