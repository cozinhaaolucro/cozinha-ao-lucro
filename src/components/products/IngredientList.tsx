import { useState, useEffect } from "react";
import { Plus, Search, FileDown, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
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

// Pagination constants
const ITEMS_PER_PAGE = 50;

export default function IngredientList() {
    const { toast } = useToast();
    const isMobile = useIsMobile();
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');

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

    // Filter Logic
    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'low_stock') return ing.stock_quantity > 0 && ing.stock_quantity < 5; // Simplified Check
        if (filter === 'out_of_stock') return ing.stock_quantity <= 0;

        return true;
    });

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
            Nome: i.name,
            Unidade: i.unit,
            Cost: i.cost_per_unit,
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-lg border border-border/40 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ingredientes..."
                        className="pl-9 bg-background/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex w-full sm:w-auto gap-2 overflow-x-auto pb-2 sm:pb-0">
                    <Button variant="outline" size="sm" onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-secondary' : ''}>
                        Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFilter('out_of_stock')} className={filter === 'out_of_stock' ? 'bg-orange-100 text-orange-900 border-orange-200' : ''}>
                        Em Falta
                    </Button>

                    <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

                    <Button variant="outline" size="icon" onClick={exportToExcel} title="Exportar Excel">
                        <FileDown className="h-4 w-4" />
                    </Button>
                    <Button onClick={openNew} className="gap-2 whitespace-nowrap">
                        <Plus className="h-4 w-4" />
                        Novo Ingrediente
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredIngredients.map(ing => (
                        <IngredientCard
                            key={ing.id}
                            ingredient={ing}
                            demand={demandMap[ing.id] || 0}
                            activeOrdersCount={usageMap[ing.id] || 0}
                            usageLevel={demandMap[ing.id] > ing.stock_quantity ? 'high' : 'low'}
                            isSelected={false}
                            onSelect={() => { }} // Could be used for bulk selection in future
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onRefresh={() => loadIngredients(true)} // Silent refresh
                            isAdmin={true} // Default to true as user is owner
                        />
                    ))}
                    {filteredIngredients.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border/50">
                            <Filter className="h-10 w-10 opacity-20 mb-2" />
                            <p>Nenhum ingrediente encontrado com os filtros atuais.</p>
                            {/* If filter is active, offer to clear */}
                            {(filter !== 'all' || searchTerm) && (
                                <Button variant="link" onClick={() => { setFilter('all'); setSearchTerm(''); }} className="mt-2">
                                    Limpar filtros
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
