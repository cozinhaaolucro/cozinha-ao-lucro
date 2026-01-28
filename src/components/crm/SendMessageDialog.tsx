import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderWithDetails, MessageTemplate } from '@/types/database';
import { parseMessageTemplate, generateWhatsAppLink, getDefaultTemplateForStatus } from '@/lib/crm';
import { getMessageTemplates, createInteractionLog } from '@/lib/database';
import { toast } from 'sonner';
import { Send, MessageSquare } from 'lucide-react';

interface SendMessageDialogProps {
    order: OrderWithDetails | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SendMessageDialog = ({ order, open, onOpenChange }: SendMessageDialogProps) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && order) {
            loadTemplates();
            // Set default message based on status
            const defaultMsg = getDefaultTemplateForStatus(order.status);
            const parsed = parseMessageTemplate(defaultMsg, order, order.customer);
            setMessage(parsed);
        }
    }, [open, order]);

    const loadTemplates = async () => {
        const { data } = await getMessageTemplates();
        if (data) setTemplates(data);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        if (templateId === 'default') {
            const defaultMsg = getDefaultTemplateForStatus(order!.status);
            setMessage(parseMessageTemplate(defaultMsg, order, order?.customer));
            return;
        }

        const template = templates.find(t => t.id === templateId);
        if (template) {
            setMessage(parseMessageTemplate(template.body_content, order, order?.customer));
        }
    };

    const handleSend = async () => {
        if (!order?.customer?.phone) {
            toast.error('Cliente sem telefone cadastrado');
            return;
        }

        setLoading(true);

        // Open WhatsApp
        const link = generateWhatsAppLink(order.customer.phone, message);
        window.open(link, '_blank');

        // Log interaction
        await createInteractionLog({
            order_id: order.id,
            customer_id: order.customer_id,
            message_type: 'whatsapp'
        });

        setLoading(false);
        onOpenChange(false);
        toast.success('WhatsApp aberto e interação registrada!');
    };

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Enviar Mensagem
                    </DialogTitle>
                    <DialogDescription>
                        Para: {order.customer?.name} ({order.customer?.phone})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Modelo de Mensagem</Label>
                        <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Padrão (Status: {order.status})</SelectItem>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Mensagem (Editável)</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[150px] font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Variáveis como {'{client_name}'} já foram substituídas.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Send className="w-4 h-4" />
                        Enviar no WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendMessageDialog;
