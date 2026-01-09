import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomer } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    const isMobile = useIsMobile();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await createCustomer({
            name: formData.name,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            notes: formData.notes || null,
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

    const FormContent = (
        <form id="new-customer-form" onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-0 px-4 sm:px-0">
            <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    required
                    className="h-10 mt-1.5"
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
                    className="h-10 mt-1.5"
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
                    className="h-10 mt-1.5"
                />
            </div>

            <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                    className="h-10 mt-1.5"
                />
            </div>

            <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Preferências, restrições alimentares..."
                    className="mt-1.5"
                />
            </div>
        </form>
    );

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                        <DrawerTitle>Novo Cliente</DrawerTitle>
                        <DrawerDescription>Preencha os dados do cliente.</DrawerDescription>
                    </DrawerHeader>
                    <ScrollArea className="h-full overflow-y-auto">
                        {FormContent}
                    </ScrollArea>
                    <DrawerFooter className="pt-2 border-t bg-background z-50">
                        <Button size="lg" type="submit" form="new-customer-form" className="w-full">
                            Salvar Cliente
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline" className="w-full">Cancelar</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>

                {FormContent}

                <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit" form="new-customer-form">Criar Cliente</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewCustomerDialog;
