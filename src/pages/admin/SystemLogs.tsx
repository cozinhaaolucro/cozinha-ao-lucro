import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bug, Trash2, RefreshCcw, Smartphone, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SystemError {
    id: string;
    user_id: string | null;
    function_name: string | null;
    error_message: string | null;
    error_details: any;
    severity: 'critical' | 'warning' | 'info';
    created_at: string;
}

const SystemLogs = () => {
    const [logs, setLogs] = useState<SystemError[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('system_errors')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error(error);
            toast.error('Erro ao carregar logs.');
        } else {
            setLogs(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const clearLogs = async () => {
        const { error } = await supabase.from('system_errors').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) toast.error('Erro ao limpar logs');
        else {
            toast.success('Logs limpos!');
            fetchLogs();
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
                        <Bug className="w-8 h-8 text-red-500" />
                        System Logs
                    </h1>
                    <p className="text-muted-foreground">Monitoramento de erros e falhas da aplicação.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button variant="destructive" onClick={clearLogs}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpar Tudo
                    </Button>
                </div>
            </div>

            <Card className="border-red-100 shadow-sm">
                <CardHeader className="bg-red-50/30 border-b border-red-50">
                    <CardTitle className="text-lg text-red-900">Últimos Registros</CardTitle>
                    <CardDescription>Mostrando os últimos 100 erros capturados pelo sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="divide-y divide-gray-100">
                            {logs.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Tudo limpo!</h3>
                                    <p>Nenhum erro registrado no sistema.</p>
                                </div>
                            ) : (
                                logs.map((log) => {
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
                                                <div className="flex items-center gap-2 text-xs text-gray-400" title={log.error_details?.userAgent}>
                                                    {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                                                    {log.user_id ? <span className="text-blue-600 font-medium">User: {log.user_id.slice(0, 8)}...</span> : 'Anon'}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="font-semibold text-gray-800">{log.error_message}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-1">
                                                    at {log.function_name || 'unknown scope'}
                                                </p>
                                            </div>

                                            {log.error_details?.url && (
                                                <div className="text-xs text-gray-400 truncate">
                                                    Path: {log.error_details.url}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default SystemLogs;
