
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ShoppingBag, ArrowRight } from 'lucide-react';
import { getOrders } from '@/lib/database';
import type { OrderStatus } from '@/types/database';

const ProductionStatusWidget = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [stats, setStats] = useState({ preparing: 0, pending: 0 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await getOrders();
            if (data) {
                const preparing = data.filter(o => o.status === 'preparing').length;
                const pending = data.filter(o => o.status === 'pending').length;

                setStats({ preparing, pending });
                // Only show if there's activity
                setVisible(preparing > 0 || pending > 0);
            }
        };

        fetchStats();
        // Poll every 10s
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 md:left-auto md:top-auto md:bottom-6 md:right-24 md:translate-x-0">
            <motion.div
                initial={{ width: 40, height: 40, borderRadius: 20 }}
                animate={{
                    width: isHovered ? 280 : (stats.preparing > 0 ? 180 : 140),
                    height: isHovered ? 'auto' : 48,
                    borderRadius: 24,
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="bg-black/80 backdrop-blur-md text-white shadow-2xl overflow-hidden cursor-pointer border border-white/10"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => navigate('/app/painel')}
            >
                <div className="p-3 flex items-center justify-between h-full w-full">
                    {/* Collapsed State Content */}
                    {!isHovered && (
                        <div className="flex items-center gap-3 w-full justify-center">
                            {stats.preparing > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                    </span>
                                    <span className="font-bold text-sm">{stats.preparing} Prod.</span>
                                </motion.div>
                            )}

                            <div className="flex items-center gap-1.5 text-white/70">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="text-sm font-medium">{stats.pending}</span>
                            </div>
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
                                <span className="font-semibold text-sm">Status da Cozinha</span>
                                <ArrowRight className="w-4 h-4 opacity-70" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-blue-500/20 rounded-lg p-2 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-blue-400">{stats.preparing}</span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-70">Produzindo</span>
                                </div>
                                <div className="bg-yellow-500/20 rounded-lg p-2 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-yellow-400">{stats.pending}</span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-70">A Fazer</span>
                                </div>
                            </div>

                            <div className="text-xs text-center text-white/50 pt-1">
                                Clique para abrir o Painel KDS
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ProductionStatusWidget;
