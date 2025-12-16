
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

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 md:left-auto md:top-auto md:bottom-6 md:right-24 md:translate-x-0">
            <motion.div
                layout
                initial={{ width: 60, height: 60, borderRadius: 30 }}
                animate={{
                    width: isHovered ? 320 : (activeOrders.length > 0 ? 80 : 60),
                    height: isHovered ? 450 : (activeOrders.length > 0 ? 80 : 60),
                    borderRadius: isHovered ? 16 : 40,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-black/90 backdrop-blur-md text-white shadow-2xl overflow-hidden cursor-pointer border border-white/10 relative group"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => navigate('/app/painel')}
            >
                {/* Background Progress Bars (Split) */}
                {!isHovered && activeOrders.length > 0 && (
                    <div className="absolute inset-0 flex w-full h-full opacity-30 pointer-events-none">
                        {progressData.map((p, idx) => (
                            <div key={p.id} className="h-full flex-1 flex items-end ml-[1px] first:ml-0 bg-white/5 relative overflow-hidden">
                                <motion.div
                                    className={`w-full ${p.isOverdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${p.progress}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="relative z-10 p-3 flex items-center justify-between h-full w-full">

                    {/* Collapsed State Content */}
                    {!isHovered && (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                            {activeOrders.length > 0 ? (
                                <>
                                    <ChefHat className={`w-6 h-6 ${progressData.some(p => p.isOverdue) ? 'text-red-400 animate-pulse' : 'text-blue-400'}`} />
                                    <span className="font-bold text-xs">{activeOrders.length}</span>
                                    {progressData.some(p => p.isOverdue) && (
                                        <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    )}
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="w-5 h-5 text-yellow-400" />
                                    <span className="font-bold text-xs">{pendingCount}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Expanded State Content */}
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full flex flex-col gap-3 p-1"
                        >
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="font-semibold text-sm">Painel de Produção</span>
                                <ArrowRight className="w-4 h-4 opacity-70" />
                            </div>

                            {/* Active Orders List with Progress */}
                            {activeOrders.length > 0 ? (
                                <div className="space-y-3 h-[360px] overflow-y-auto custom-scrollbar pr-2">
                                    {activeOrders.map(order => {
                                        const p = progressData.find(x => x.id === order.id);
                                        const progress = p?.progress || 0;
                                        const isOverdue = p?.isOverdue || false;

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
