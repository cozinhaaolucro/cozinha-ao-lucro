import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Package,
    Users,
    ShoppingCart,
    Calendar,
    Settings,
    ChefHat,
    LayoutDashboard,
    BookOpen,
    ShoppingBag,
    ArrowRight
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    shortcut?: string;
    icon: React.ReactNode;
    action: () => void;
    keywords: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Define all available commands
    const commands: CommandItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            shortcut: 'D',
            icon: <LayoutDashboard className="w-4 h-4" />,
            action: () => navigate('/app/dashboard'),
            keywords: ['home', 'inicio', 'visao', 'metricas'],
        },
        {
            id: 'pedidos',
            label: 'Pedidos',
            shortcut: 'P',
            icon: <ShoppingCart className="w-4 h-4" />,
            action: () => navigate('/app/pedidos'),
            keywords: ['orders', 'vendas', 'encomendas'],
        },
        {
            id: 'painel',
            label: 'Painel de Operações',
            shortcut: 'O',
            icon: <ChefHat className="w-4 h-4" />,
            action: () => navigate('/app/painel'),
            keywords: ['cozinha', 'producao', 'kds', 'kitchen'],
        },
        {
            id: 'produtos',
            label: 'Produtos',
            shortcut: 'R',
            icon: <Package className="w-4 h-4" />,
            action: () => navigate('/app/produtos'),
            keywords: ['receitas', 'fichas', 'itens', 'menu'],
        },
        {
            id: 'clientes',
            label: 'Clientes',
            shortcut: 'C',
            icon: <Users className="w-4 h-4" />,
            action: () => navigate('/app/clientes'),
            keywords: ['customers', 'contatos', 'crm'],
        },
        {
            id: 'agenda',
            label: 'Agenda',
            shortcut: 'A',
            icon: <Calendar className="w-4 h-4" />,
            action: () => navigate('/app/agenda'),
            keywords: ['calendar', 'calendario', 'entregas'],
        },
        {
            id: 'shopping',
            label: 'Lista de Compras',
            shortcut: 'L',
            icon: <ShoppingBag className="w-4 h-4" />,
            action: () => navigate('/app/shopping-list'),
            keywords: ['compras', 'mercado', 'estoque', 'ingredientes'],
        },
        {
            id: 'aprender',
            label: 'Aprender',
            shortcut: 'E',
            icon: <BookOpen className="w-4 h-4" />,
            action: () => navigate('/app/aprender'),
            keywords: ['educacao', 'cursos', 'tutoriais', 'ebook'],
        },
        {
            id: 'settings',
            label: 'Configurações',
            shortcut: 'S',
            icon: <Settings className="w-4 h-4" />,
            action: () => navigate('/app/settings'),
            keywords: ['config', 'perfil', 'conta'],
        },
    ];

    // Filter commands based on search
    const filteredCommands = search
        ? commands.filter(cmd =>
            cmd.label.toLowerCase().includes(search.toLowerCase()) ||
            cmd.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
        )
        : commands;

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    onClose();
                }
                break;
            case 'Escape':
                onClose();
                break;
        }
    }, [filteredCommands, selectedIndex, onClose]);

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [search]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg p-0 overflow-hidden bg-slate-900 border-white/10 shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <Search className="w-5 h-5 text-white/40" />
                    <Input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar comandos..."
                        className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                    />
                    <Badge variant="outline" className="text-white/40 border-white/20 text-xs">
                        ESC
                    </Badge>
                </div>

                {/* Command List */}
                <div className="max-h-72 overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-white/40">
                            Nenhum comando encontrado
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <button
                                key={cmd.id}
                                onClick={() => {
                                    cmd.action();
                                    onClose();
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${index === selectedIndex
                                        ? 'bg-blue-500/20 text-white'
                                        : 'text-white/70 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded ${index === selectedIndex ? 'bg-blue-500/30' : 'bg-white/10'}`}>
                                        {cmd.icon}
                                    </div>
                                    <span className="font-medium">{cmd.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {cmd.shortcut && (
                                        <Badge variant="outline" className="text-white/40 border-white/20 text-xs font-mono">
                                            {cmd.shortcut}
                                        </Badge>
                                    )}
                                    {index === selectedIndex && (
                                        <ArrowRight className="w-4 h-4 text-blue-400" />
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs text-white/40">
                    <span>↑↓ para navegar</span>
                    <span>↵ para selecionar</span>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CommandPalette;
