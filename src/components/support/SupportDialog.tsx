import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SupportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
    const { user } = useAuth();
    const [topic, setTopic] = useState<string>("erro");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error("Por favor, descreva o problema ou sugestão.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('support_tickets').insert({
                user_id: user?.id,
                email: user?.email,
                topic,
                message,
                technical_info: {
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                    screen: `${window.screen.width}x${window.screen.height}`,
                    timestamp: new Date().toISOString()
                }
            });

            if (error) throw error;

            toast.success("Feedback enviado com sucesso!");
            setMessage("");
            onOpenChange(false);
        } catch (error) {
            console.error('Error sending feedback:', error);
            toast.error("Erro ao enviar feedback. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Central de Ajuda
                    </DialogTitle>
                    <DialogDescription>
                        Encontrou um erro ou tem uma sugestão? Conte para nós.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Sobre o que você quer falar?</Label>
                        <Select value={topic} onValueChange={setTopic}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="erro">Reportar um Erro</SelectItem>
                                <SelectItem value="sugestao">Sugestão de Melhoria</SelectItem>
                                <SelectItem value="duvida">Dúvida de Uso</SelectItem>
                                <SelectItem value="financeiro">Assinatura / Financeiro</SelectItem>
                                <SelectItem value="outro">Outro Assunto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Textarea
                            placeholder="Descreva detalhadamente o que aconteceu..."
                            className="min-h-[120px]"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={isSubmitting} className="bg-primary text-primary-foreground">
                        {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
