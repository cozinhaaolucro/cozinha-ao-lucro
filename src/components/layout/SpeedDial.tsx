
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, ShoppingBag, Users, Package, UtensilsCrossed, X } from 'lucide-react';
import { Button } from '@/components/ui/button';


interface SpeedDialProps {
    onNewOrder: () => void;
    onNewClient: () => void;
    onNewProduct: () => void;
    onNewIngredient: () => void;
}

export const SpeedDial = ({ onNewOrder, onNewClient, onNewProduct, onNewIngredient }: SpeedDialProps) => {
    const [open, setOpen] = useState(false);

    // Actions definition mapped to callbacks
    const actions = [
        { label: 'Novo Pedido', icon: ShoppingBag, onClick: onNewOrder, color: 'bg-[#5F98A1]/90 hover:bg-[#5F98A1] text-white' },
        { label: 'Novo Cliente', icon: Users, onClick: onNewClient, color: 'bg-[#5F98A1]/90 hover:bg-[#5F98A1] text-white' },
        { label: 'Novo Produto', icon: Package, onClick: onNewProduct, color: 'bg-[#5F98A1]/90 hover:bg-[#5F98A1] text-white' },
        { label: 'Novo Ingrediente', icon: UtensilsCrossed, onClick: onNewIngredient, color: 'bg-[#5F98A1]/90 hover:bg-[#5F98A1] text-white' },
    ];

    const toggleOpen = () => setOpen(!open);

    const handleAction = (callback: () => void) => {
        setOpen(false);
        callback();
    };

    return (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
            <AnimatePresence>
                {open && (
                    <div className="flex flex-col items-end gap-3 mb-2">
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className="bg-white/90 backdrop-blur text-xs font-medium py-1 px-2 rounded-md shadow-sm border">
                                    {action.label}
                                </span>
                                <Button
                                    className={`rounded-full shadow-lg w-10 h-10 ${action.color} border-2 transition-colors`}
                                    onClick={() => handleAction(action.onClick)}
                                >
                                    <action.icon className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.2 }}
            >
                <Button
                    size="icon"
                    className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${open ? 'bg-[#2e5b60] hover:bg-[#2e5b60]/90' : 'bg-primary hover:bg-primary/90'} text-white`}
                    onClick={toggleOpen}
                >
                    <Plus className="w-8 h-8" />
                </Button>
            </motion.div>

            {/* Backdrop to close on click outside */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] -z-10"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    );
};
