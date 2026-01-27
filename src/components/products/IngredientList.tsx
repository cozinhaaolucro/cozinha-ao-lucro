import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Filter, Loader2, Package, Milk, Candy, Wheat, Sparkles, Square, Egg, Cloud, CupSoda, Circle, Thermometer, Box, Drumstick, Leaf, Carrot, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { createIngredient, updateIngredient, deleteIngredient } from "@/lib/database";
import { analyzeStockDemand } from "@/lib/stock-logic";
import type { Ingredient } from "@/types/database";
import { IngredientForm } from "@/components/ingredients/IngredientForm";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import * as XLSX from 'xlsx';
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRESET_INGREDIENTS } from "@/data/presets";

// Icon mapping for preset ingredients
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'milk': Milk,
    'candy': Candy,
    'wheat': Wheat,
    'sparkles': Sparkles,
    'square': Square,
    'egg': Egg,
    'cloud': Cloud,
    'package': Package,
    'cup-soda': CupSoda,
    'circle': Circle,
    'thermometer-snowflake': Thermometer,
    'box': Box,
    'drumstick': Drumstick,
    'leaf': Leaf,
    'carrot': Carrot,
    'beef': Beef,
};

// Pagination constants
const ITEMS_PER_PAGE = 50;

export default function IngredientList() {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

    // Dialog/Drawer States
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    // Demand Data
    const [demandMap, setDemandMap] = useState<Record<string, number>>({});
    const [usageMap, setUsageMap] = useState<Record<string, number>>({});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loadingDemand, setLoadingDemand] = useState(false);

    // Initial Load
    useEffect(() => {
        loadIngredients();
    }, []);

    // Load Data
    const loadIngredients = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch ingredients
            const { data: dbData, error } = await supabase
                .from('ingredients')
                .select('*')
                .order('name');

            if (error) throw error;
            const loadedIngredients = dbData || [];

            // Fetch Active Orders for Demand Calculation
            const { data: orders } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .neq('status', 'entregue')
                .neq('status', 'cancelado');

            // Fetch Products with Recipes for Intelligent Stock
            const { data: products } = await supabase
                .from('products')
                .select('*, product_ingredients(*, ingredient:ingredients(*))');

            if (orders && products) {
                const stockStatus = analyzeStockDemand(loadedIngredients, orders, products as any);
                const newMap: Record<string, number> = {};
                stockStatus.forEach(status => {
                    if (status.total_required > 0) {
                        newMap[status.ingredient.id] = status.total_required;
                    }
                });
                setDemandMap(newMap);

                // Calculate Usage Map
                const usage: Record<string, number> = {};
                orders.forEach(order => {
                    if (order.status !== 'preparing') return;
                    const usedIngredients = new Set<string>();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    order.order_items?.forEach((item: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const prod = products.find((p: any) => p.id === item.product_id);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        prod?.product_ingredients?.forEach((pi: any) => {
                            if (pi.ingredient_id) usedIngredients.add(pi.ingredient_id);
                        });
                    });
                    usedIngredients.forEach(ingId => {
                        usage[ingId] = (usage[ingId] || 0) + 1;
                    });
                });
                setUsageMap(usage);
            }

            setIngredients(loadedIngredients);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao carregar ingredientes", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic (Search Only)
    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const toggleSelect = (id: string) => {
        setSelectedIngredients((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIngredients.length === filteredIngredients.length) {
            setSelectedIngredients([]);
        } else {
            setSelectedIngredients(filteredIngredients.map((i) => i.id));
        }
    };

    // CRUD Handlers
    const handleSave = async (formData: any) => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("No user");

            const payload = {
                ...formData,
                user_id: user.id
            };

            if (editingIngredient) {
                await updateIngredient(editingIngredient.id, payload);
                toast({ title: "Ingrediente atualizado!" });
            } else {
                await createIngredient(payload);
                toast({ title: "Ingrediente criado!" });
            }

            setIsDialogOpen(false);
            setEditingIngredient(null);
            loadIngredients();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este ingrediente?")) return;
        try {
            await deleteIngredient(id);
            toast({ title: "Ingrediente removido" });
            loadIngredients();
        } catch (error) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    // Export Logic
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(ingredients.map(i => ({
            ID: i.id,
            Nome: i.name,
            Unidade: i.unit,
            Valor: i.cost_per_unit,
            Estoque: i.stock_quantity,
            "Embalagem (Tamanho)": i.package_size || '-',
            "Embalagem (Unidade)": i.package_unit || '-'
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ingredientes");
        XLSX.writeFile(wb, "ingredientes_cozinha_lucro.xlsx");
    };

    const openNew = () => {
        setEditingIngredient(null);
        setIsDialogOpen(true);
    };

    const openEdit = (ing: Ingredient) => {
        setEditingIngredient(ing);
        setIsDialogOpen(true);
    };

    const addPresetIngredient = async (preset: typeof PRESET_INGREDIENTS[0]) => {
        // Check if ingredient already exists
        const exists = ingredients.some(i => i.name.toLowerCase() === preset.name.toLowerCase());
        if (exists) {
            toast({ title: 'Ingrediente já existe!', variant: 'destructive' });
            return;
        }

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("No user");

            await createIngredient({
                name: preset.name,
                unit: preset.unit as any,
                cost_per_unit: preset.cost_per_unit,
                stock_quantity: preset.stock_quantity
            });
            toast({ title: `${preset.name} adicionado!` });
            loadIngredients();
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao adicionar ingrediente', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            {/* Header Toolbar */}
            <div className="flex items-center gap-4 w-full">
                {/* Selection Trigger */}
                <div
                    className="flex items-center gap-2 cursor-pointer group/select select-none px-3 py-2 rounded-full hover:bg-muted/50 transition-colors shrink-0"
                    onClick={() => setSelectionMode(!selectionMode)}
                    onDoubleClick={(e) => {
                        e.preventDefault();
                        toggleSelectAll();
                    }}
                >
                    <div className={`
                        w-4 h-4 rounded-full border flex items-center justify-center transition-colors
                        ${selectedIngredients.length > 0 ? "border-primary bg-primary" : "border-muted-foreground/70 group-hover/select:border-primary"}
                    `}>
                        {selectedIngredients.length > 0 && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-base text-muted-foreground group-hover/select:text-primary transition-colors font-medium hidden sm:inline">
                        {selectedIngredients.length > 0 ? `${selectedIngredients.length}` : 'Selecionar'}
                    </span>
                </div>

                {/* Search */}
                <div className="relative w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ingredientes..."
                        className="pl-9 h-9 bg-transparent border-muted-foreground/30 focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={exportToExcel} title="Exportar Excel" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                        <FileDown className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-9 px-3 rounded-full font-medium">
                                <Package className="h-4 w-4" />
                                <span className="hidden sm:inline">Modelos</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                            {PRESET_INGREDIENTS.map((preset, idx) => {
                                const IconComponent = ICON_MAP[preset.icon] || Package;
                                return (
                                    <DropdownMenuItem
                                        key={idx}
                                        onClick={() => addPresetIngredient(preset)}
                                        className="flex items-center gap-2"
                                    >
                                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1">{preset.name}</span>
                                        <span className="text-xs text-muted-foreground">{preset.unit}</span>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={openNew} className="gap-2 h-9 px-4 rounded-full font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Novo</span>
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {filteredIngredients.map(ing => (
                        <IngredientCard
                            key={ing.id}
                            ingredient={ing}
                            demand={demandMap[ing.id] || 0}
                            activeOrdersCount={usageMap[ing.id] || 0}
                            usageLevel={demandMap[ing.id] > ing.stock_quantity ? 'high' : 'low'}
                            isSelected={selectedIngredients.includes(ing.id)}
                            onSelect={() => toggleSelect(ing.id)}
                            selectionMode={selectionMode}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onRefresh={() => loadIngredients(true)} // Silent refresh
                            isAdmin={true} // Default to true as user is owner
                        />
                    ))}
                    {filteredIngredients.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
                            <Filter className="h-10 w-10 opacity-20 mb-2" />
                            <p>Nenhum ingrediente encontrado para "{searchTerm}".</p>
                            {/* If filter is active, offer to clear */}
                            {searchTerm && (
                                <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">
                                    Limpar busca
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Responsive Form Container */}
            {isMobile ? (
                <Drawer open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DrawerContent className="max-h-[95vh]">
                        <DrawerHeader className="text-left">
                            <DrawerTitle>{editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DrawerTitle>
                            <DrawerDescription>
                                Configure os detalhes do ingrediente.
                            </DrawerDescription>
                        </DrawerHeader>
                        <ScrollArea className="h-full overflow-y-auto px-4 pb-4">
                            {/* Render form only when dialog is open to reset state properly */}
                            {isDialogOpen && (
                                <IngredientForm
                                    initialData={editingIngredient}
                                    onSave={handleSave}
                                    onCancel={() => setIsDialogOpen(false)}
                                />
                            )}
                            <div className="h-6" /> {/* Spacer */}
                        </ScrollArea>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</DialogTitle>
                            <DialogDescription>
                                Configure os detalhes do ingrediente. O custo será calculado automaticamente para unidade base.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Render form only when dialog is open to reset state properly */}
                        {isDialogOpen && (
                            <IngredientForm
                                initialData={editingIngredient}
                                onSave={handleSave}
                                onCancel={() => setIsDialogOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
