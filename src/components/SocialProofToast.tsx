import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const NAMES = [
    "Ana P. de São Paulo", "Mariana S. do Rio", "Carla M. de Minas",
    "Júlia R. do Sul", "Fernanda L. da Bahia", "Patrícia O. de Curitiba",
    "Beatriz C. de Brasília", "Larissa M. de Goiânia", "Sofia T. de Recife",
    "Camila R. de Porto Alegre"
];

const ACTIONS = [
    "acabou de comprar o guia",
    "entrou para a turma",
    "começou a lucrar hoje",
    "baixou a planilha de custos",
    "garantiu sua vaga"
];

const SocialProofToast = () => {
    const [notifications, setNotifications] = useState<{ id: number, name: string, action: string }[]>([]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const scheduleNextNotification = () => {
            // Verificar horário (8h às 23h)
            const currentHour = new Date().getHours();
            if (currentHour < 8 || currentHour >= 23) {
                // Se estiver fora do horário, tenta novamente em 1 minuto
                timeoutId = setTimeout(scheduleNextNotification, 60000);
                return;
            }

            const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
            const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            const newId = Date.now();

            // Adicionar notificação
            setNotifications(prev => [...prev, { id: newId, name: randomName, action: randomAction }]);

            // Remover notificação após 5 segundos
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newId));
            }, 5000);

            // Lógica de "Escadinha" (Burst)
            // 30% de chance de lançar outra notificação logo em seguida (2-4 segundos)
            const isBurst = Math.random() < 0.3;

            if (isBurst) {
                setTimeout(() => {
                    const burstName = NAMES[Math.floor(Math.random() * NAMES.length)];
                    const burstAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
                    const burstId = Date.now() + 1;

                    setNotifications(prev => [...prev, { id: burstId, name: burstName, action: burstAction }]);

                    setTimeout(() => {
                        setNotifications(prev => prev.filter(n => n.id !== burstId));
                    }, 5000);

                }, Math.random() * 2000 + 2000); // 2 a 4 segundos depois
            }

            // Próximo agendamento: Mais espaçado (30 a 60 segundos)
            const nextDelay = Math.random() * 30000 + 30000;
            timeoutId = setTimeout(scheduleNextNotification, nextDelay);
        };

        // Start inicial
        timeoutId = setTimeout(scheduleNextNotification, 5000);

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 50, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-primary/20 p-4 rounded-lg shadow-elegant max-w-sm pointer-events-auto"
                    >
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{notif.name}</p>
                            <p className="text-xs text-muted-foreground">{notif.action}</p>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default SocialProofToast;
