
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { getOrders } from '@/lib/database';
import type { OrderWithDetails } from '@/types/database';

const ProductionStatusWidget = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [activeOrders, setActiveOrders] = useState<OrderWithDetails[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [visible, setVisible] = useState(false);

    // Hover delay logic to prevent accidental expansions
    const hoverTimeout = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        // Clear any closing timeout
        if (hoverTimeout[0]) clearTimeout(hoverTimeout[0]);
        // Set opening timeout
        hoverTimeout[1](setTimeout(() => setIsHovered(true), 150));
    };

    const handleMouseLeave = () => {
        // Clear any opening timeout
        if (hoverTimeout[0]) clearTimeout(hoverTimeout[0]);
        // Set closing timeout (faster close is usually fine, but slight delay helps tracking)
        hoverTimeout[1](setTimeout(() => setIsHovered(false), 300));
    };

    // Stats for progress bars
    const [progressData, setProgressData] = useState<{ id: string, progress: number, isOverdue: boolean, idealTime?: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await getOrders();
            if (data) {
                const preparing = data.filter(o => o.status === 'preparing');
                const pending = data.filter(o => o.status === 'pending').length;

                setActiveOrders(preparing);
                setPendingCount(pending);
                setVisible(preparing.length > 0 || pending > 0);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Faster polling
        return () => clearInterval(interval);
    }, []);

    // Update progress bars every second locally
    useEffect(() => {
        if (activeOrders.length === 0) return;

        const updateProgress = () => {
            const now = new Date().getTime();

            const newProgress = activeOrders.map(order => {
                if (!order.production_started_at) return { id: order.id, progress: 0, isOverdue: false, idealTime: 15 };

                const start = new Date(order.production_started_at).getTime();
                const elapsedMinutes = (now - start) / 1000 / 60;

                // Calculate ideal time
                const idealTimeCallback = order.items.reduce((acc, item) => {
                    return acc + (item.product?.preparation_time_minutes || 0) * item.quantity;
                }, 0);

                // Default to 15 mins if 0/undefined, to show *some* progress visual
                const idealTime = idealTimeCallback > 0 ? idealTimeCallback : 15;

                const progressPercent = Math.min((elapsedMinutes / idealTime) * 100, 100);
                const isOverdue = elapsedMinutes > idealTime && idealTimeCallback > 0;

                return { id: order.id, progress: progressPercent, isOverdue, idealTime };
            });

            setProgressData(newProgress);
        };

        updateProgress();
        const timer = setInterval(updateProgress, 1000);
        return () => clearInterval(timer);
    }, [activeOrders]);



    // Calcs
    const totalEstimatedTime = activeOrders.reduce((acc, order) => {
        const orderPrepTime = order.items.reduce((iAcc, item) => iAcc + (item.product?.preparation_time_minutes || 0) * item.quantity, 0);
        return acc + orderPrepTime;
    }, 0);

    const totalRealizedMinutes = activeOrders.reduce((acc, order) => {
        if (!order.production_started_at) return acc;
        const elapsed = Math.floor((new Date().getTime() - new Date(order.production_started_at).getTime()) / 60000);
        return acc + elapsed;
    }, 0);

    const formatHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 md:left-auto md:top-auto md:bottom-6 md:right-24 md:translate-x-0">
            <motion.div
                layout
                initial={{ width: 60, height: 60, borderRadius: 30 }}
                animate={{
                    width: isHovered ? 340 : (activeOrders.length > 0 ? 80 : 60),
                    height: isHovered ? 500 : (activeOrders.length > 0 ? 80 : 60),
                    borderRadius: isHovered ? 16 : 40,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden relative ${visible ? 'block' : 'hidden'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => !isHovered && navigate('/app/painel')}
            >
                {/* Collapsed State */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 relative z-10">
                            <ChefHat className="text-white w-7 h-7" />
                            {activeOrders.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-neutral-900">
                                    {activeOrders.length}
                                </span>
                            )}
                        </div>

                        return (
                        <div key={order.id} className={`space-y-1 p-2 rounded ${isOverdue ? 'bg-red-500/10 animate-pulse' : ''}`}>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/90 font-medium">#{order.id.slice(0, 4)} - {order.customer?.name?.split(' ')[0] || 'Balcão'}</span>
                                <span className="text-white/60">{order.items.length} itens</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-white/50">
                                <span>{p?.idealTime?.toFixed(0)} min previstos</span>
                            </div>
                            {isOverdue && <span className="text-red-400 font-bold text-[10px]">ATRASADO</span>}

                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className={`h-full ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        )
                                    })}
                    </div>
                    ) : (
                    <div className="text-center text-xs text-white/50 py-2">
                        Nenhum pedido em produção.
                    </div>
                            )}

                    {pendingCount > 0 && (
                        <div className="mt-2 text-xs bg-yellow-500/10 text-yellow-200 p-2 rounded flex items-center gap-2 justify-center border border-yellow-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {pendingCount} pedidos aguardando início
                        </div>
                    )}

                    <div className="text-[10px] text-center text-white/40 pt-1 uppercase tracking-wide">
                        Clique para abrir Painel
                    </div>
            </motion.div>
                    )}
        </div>
            </motion.div >
        </div >
    );
};

export default ProductionStatusWidget;
