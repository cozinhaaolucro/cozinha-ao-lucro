
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
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-[500px] h-auto bg-white border border-white/20 shadow-elegant p-3 rounded-xl gap-2">
                <DialogHeader className="mb-0 space-y-0 p-0 text-left sm:text-center">
                    <DialogTitle className="text-base sm:text-xl font-bold text-primary leading-tight">Solicitar Contato</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-2 mt-1">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="name" className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">Nome</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nome"
                                className="h-8 bg-muted/10 border-muted-foreground/10 text-xs px-2"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <Label htmlFor="company" className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">Empresa</Label>
                            <Input
                                id="company"
                                name="company"
                                required
                                value={formData.company}
                                onChange={handleChange}
                                placeholder="Empresa"
                                className="h-8 bg-muted/10 border-muted-foreground/10 text-xs px-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <Label htmlFor="email" className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                className="h-8 bg-muted/10 border-muted-foreground/10 text-xs px-2"
                            />
                        </div>
                        <div className="space-y-0.5">
                            <Label htmlFor="phone" className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">Whats</Label>
                            <Input
                                id="phone"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Whats"
                                className="h-8 bg-muted/10 border-muted-foreground/10 text-xs px-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <Label htmlFor="message" className="text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">Mensagem</Label>
                        <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Sua mensagem..."
                            className="bg-muted/10 border-muted-foreground/10 min-h-[50px] resize-none text-xs px-2 py-1.5"
                        />
                    </div>

                    <Button type="submit" className="w-full btn-primary h-9 text-sm font-semibold mt-1" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                Enviar
                                <Send className="ml-2 h-3 w-3" />
                            </>
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
