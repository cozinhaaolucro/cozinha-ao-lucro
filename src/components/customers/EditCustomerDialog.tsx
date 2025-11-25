import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/types/database';

type EditCustomerDialogProps = {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
};

const EditCustomerDialog = ({ customer, open, onOpenChange, onSuccess }: EditCustomerDialogProps) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        notes: '',
    });
    const { toast } = useToast();

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                phone: customer.phone || '',
                address: customer.address || '',
                notes: customer.notes || '',
            });
        }
    }, [customer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;

        const { error } = await supabase
            .from('customers')
            .update({
                name: formData.name,
                phone: formData.phone || null,
                address: formData.address || null,
                notes: formData.notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', customer.id);

        if (!error) {
            toast({ title: 'Cliente atualizado com sucesso!' });
            onSuccess();
            onOpenChange(false);
        } else {
            toast({
                title: 'Erro ao atualizar cliente',
                description: error.message,
                variant: 'destructive'
            });
        }
    };

    if (!customer) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
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
                        <Button type="submit" className="flex-1">Salvar</Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditCustomerDialog;
