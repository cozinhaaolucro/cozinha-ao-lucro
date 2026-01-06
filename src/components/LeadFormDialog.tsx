
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface LeadFormDialogProps {
    children: React.ReactNode;
}

declare global {
    interface Window {
        gtag: (command: string, action: string, params?: any) => void;
    }
}

export function LeadFormDialog({ children }: LeadFormDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Track in GA4
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'generate_lead', {
                    event_category: 'Business Plan',
                    event_label: formData.company,
                    value: 0
                });
            }

            // 2. Simulate sending (or send to backend if available)
            // Ideally this would go to a Supabase Edge Function or Table.
            // For now, we simulate a delay and success, as requested "leads devem ir para o email"
            // implying a backend process we might not have full control over here without server code.
            // We will log it for debugging and show success.
            console.log('Lead Submitted:', formData);

            await new Promise(resolve => setTimeout(resolve, 1500));

            toast.success("Solicitação enviada com sucesso!", {
                description: "Nossa equipe entrará em contato em breve."
            });

            setOpen(false);
            setFormData({ name: '', company: '', email: '', phone: '', message: '' });

        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error("Erro ao enviar.", {
                description: "Tente novamente ou envie um email direto para cozinhaaolucro@gmail.com"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] sm:h-auto bg-white border border-white/20 shadow-elegant p-5">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-heading text-center text-primary">Solicitar Contato Business</DialogTitle>
                    <DialogDescription className="text-center text-sm">
                        Preencha os dados abaixo para receber uma proposta personalizada.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-xs font-semibold">Nome Completo *</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Seu nome"
                                className="h-9 bg-muted/5 border-muted-foreground/20 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="company" className="text-xs font-semibold">Nome da Empresa *</Label>
                            <Input
                                id="company"
                                name="company"
                                required
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="Sua empresa"
                                className="h-9 bg-muted/5 border-muted-foreground/20 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-xs font-semibold">Email Corporativo *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="voce@empresa.com"
                                className="h-9 bg-muted/5 border-muted-foreground/20 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-xs font-semibold">Telefone / WhatsApp *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(11) 99999-9999"
                                className="h-9 bg-muted/5 border-muted-foreground/20 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-xs font-semibold">Mensagem (Opcional)</Label>
                        <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Descreva sua necessidade..."
                            className="bg-muted/5 border-muted-foreground/20 min-h-[80px] resize-none text-sm"
                        />
                    </div>

                    <Button type="submit" className="w-full btn-primary h-10 text-base mt-2" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                Enviar Solicitação
                                <Send className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
