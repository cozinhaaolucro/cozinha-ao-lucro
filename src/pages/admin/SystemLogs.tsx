import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bug, Trash2, RefreshCcw, Smartphone, Monitor, MessageSquare, Mail, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemError {
    id: string;
    user_id: string | null;
    function_name: string | null;
    error_message: string | null;
    error_details: any;
    severity: 'critical' | 'warning' | 'info';
    created_at: string;
}

interface SupportTicket {
    id: string;
    user_id: string | null;
    email: string | null;
    topic: string;
    message: string;
    technical_info: any;
    created_at: string;
    status: string;
}

const SystemLogs = () => {
    const [errors, setErrors] = useState<SystemError[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);

        // Fetch System Errors
        const { data: errorData } = await supabase
            .from('system_errors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (errorData) setErrors(errorData);

        // Fetch Support Tickets
        const { data: ticketData, error: ticketError } = await supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (ticketError) {
            // Silently fail if table doesn't exist yet, or log console error
            console.error("Error fetching support tickets (table might not exist yet):", ticketError);
        } else {
            setTickets(ticketData || []);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const clearErrors = async () => {
        const { error } = await supabase.from('system_errors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) toast.error('Erro ao limpar erros');
        else {
            toast.success('Erros limpos!');
            fetchData();
        }
    };

    const getSeverityColor = (s: string) => {
        switch (s) {
            case 'critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Monitor className="w-8 h-8 text-primary" />
                        System Logs & Support
                    </h1>
                    <p className="text-muted-foreground">Monitoramento de erros e solicitações de suporte.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="tickets" className="w-full">
                <TabsList className="w-full justify-start h-12 bg-muted/50 p-1">
                    <TabsTrigger value="tickets" className="h-10 px-6">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chamados de Suporte
                        {tickets.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20">
                                {tickets.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="errors" className="h-10 px-6">
                        <Bug className="w-4 h-4 mr-2" />
                        Erros do Sistema
                        {errors.length > 0 && (
                            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200">
                                {errors.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tickets" className="mt-6">
                    <Card className="border-primary/10 shadow-sm">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="text-lg text-primary flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Tickets Recentes
                            </CardTitle>
                            <CardDescription>Últimas mensagens enviadas pelos usuários.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <div className="divide-y divide-gray-100">
                                    {tickets.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <MessageSquare className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">Sem chamados</h3>
                                            <p>Nenhuma mensagem de suporte recebida ainda.</p>
                                        </div>
                                    ) : (
                                        tickets.map((ticket) => (
                                            <div key={ticket.id} className="p-4 hover:bg-gray-50 transition flex flex-col gap-3 text-sm group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-2 items-center">
                                                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-semibold">
                                                            {ticket.topic}
                                                        </Badge>
                                                        <span className="font-mono text-xs text-gray-400">
                                                            {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="font-medium text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 text-base">
                                                        "{ticket.message}"
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5" />
                                                            {ticket.email || 'Email não informado'}
                                                        </div>
                                                        <div className="hidden md:flex items-center gap-1.5" title="User ID">
                                                            <User className="w-3.5 h-3.5" />
                                                            <span className="font-mono">{ticket.user_id?.slice(0, 8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="errors" className="mt-6">
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader className="bg-red-50/30 border-b border-red-50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-red-900">Erros do Sistema</CardTitle>
                                <CardDescription>Erros técnicos capturados.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={clearErrors} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Limpar
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <div className="divide-y divide-gray-100">
                                    {errors.length === 0 ? (
                                        <div className="p-12 text-center text-gray-400">
                                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <AlertCircle className="w-8 h-8 text-green-500" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">Tudo limpo!</h3>
                                            <p>Nenhum erro registrado no sistema.</p>
                                        </div>
                                    ) : (
                                        errors.map((log) => {
                                            const isMobile = log.error_details?.userAgent?.toLowerCase().includes('mobile');
                                            return (
                                                <div key={log.id} className="p-4 hover:bg-gray-50 transition flex flex-col gap-3 text-sm">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-2 items-center">
                                                            <Badge className={`${getSeverityColor(log.severity)} border shadow-none`}>
                                                                {log.severity.toUpperCase()}
                                                            </Badge>
                                                            <span className="font-mono text-xs text-gray-400">
                                                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{log.error_message}</p>
                                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                                            at {log.function_name || 'unknown scope'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SystemLogs;
