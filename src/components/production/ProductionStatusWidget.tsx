
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

    // totalRealizedMinutes - recalculated when progressData updates (every second)
    const totalRealizedMinutes = activeOrders.reduce((acc, order) => {
        if (!order.production_started_at) return acc;
        const elapsed = Math.floor((Date.now() - new Date(order.production_started_at).getTime()) / 60000);
        return acc + Math.max(0, elapsed);
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
                    </div>
                </div>

                {/* Expanded State */}
                <div className={`p-5 h-full flex flex-col transition-opacity duration-300 ${isHovered ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <ChefHat className="text-blue-400 w-5 h-5" />
                            Produção Atual
                        </h3>
                        <div className="text-xs text-neutral-400 bg-neutral-800 px-2 py-1 rounded">
                            {formatHours(totalEstimatedTime)} est.
                        </div>
                    </div>

                    {/* Mini Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-neutral-800/50 p-2 rounded border border-white/5">
                            <span className="text-[10px] text-neutral-400 uppercase block">Trabalho</span>
                            <span className="text-sm font-bold text-blue-400">{formatHours(totalRealizedMinutes)}</span>
                        </div>
                        <div className="bg-neutral-800/50 p-2 rounded border border-white/5">
                            <span className="text-[10px] text-neutral-400 uppercase block">Fila</span>
                            <span className="text-sm font-bold text-white">{pendingCount} aguardando</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                        {activeOrders.length > 0 ? (
                            activeOrders.map(order => {
                                const pData = progressData.find(p => p.id === order.id);
                                const progress = pData?.progress || 0;
                                const isOverdue = pData?.isOverdue || false;

                                return (
                                    <div key={order.id} className="bg-neutral-800/40 p-3 rounded-lg border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-medium text-white">#{order.order_number || order.id.slice(0, 4)}</span>
                                            <span className="text-xs text-neutral-400">{order.customer?.name?.split(' ')[0]}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isOverdue ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-neutral-500 text-sm py-8">
                                Nenhum pedido no fogo
                            </div>
                        )}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/app/painel');
                        }}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group"
                    >
                        Abrir Painel Completo
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ProductionStatusWidget;
