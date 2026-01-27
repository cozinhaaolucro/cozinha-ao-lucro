import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductFormData } from './types';
import { CATEGORY_PRESETS } from './constants';

interface ProductBasicInfoProps {
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    imagePreview: string | null;
    handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    availableCategories: string[];
}

export const ProductBasicInfo = ({ formData, setFormData, imagePreview, handleImageSelect, availableCategories }: ProductBasicInfoProps) => {
    const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const suggestions = Array.from(new Set([...CATEGORY_PRESETS, ...availableCategories])).sort();

    return (
        <Card className="border-none shadow-none sm:border sm:shadow-sm">
            <CardContent className="p-0 sm:p-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-base font-semibold">Nome do Produto</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Brigadeiro Gourmet"
                        className="h-11 text-lg"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalhes sobre o produto..."
                        className="resize-none"
                        rows={2}
                    />
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/50">
                    <Switch
                        id="is_highlight"
                        checked={formData.is_highlight}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_highlight: checked })}
                    />
                    <div className="space-y-0.5">
                        <Label htmlFor="is_highlight" className="text-base cursor-pointer">
                            Destaque no Cardápio (Sugestão)
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            Exibe este produto na vitrine de cima do cardápio digital (Modo Vitrine).
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Popover open={openCategoryCombobox} onOpenChange={setOpenCategoryCombobox}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCategoryCombobox}
                                className="w-full justify-between font-normal"
                            >
                                {formData.category || "Selecione ou digite uma categoria..."}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Buscar ou criar categoria..." onValueChange={setCategorySearch} />
                                <CommandList>
                                    <CommandEmpty>
                                        <div className="p-2 text-sm text-center">
                                            <p className="text-muted-foreground mb-2">Nenhuma categoria encontrada.</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => {
                                                    setFormData({ ...formData, category: categorySearch });
                                                    setOpenCategoryCombobox(false);
                                                }}
                                            >
                                                Criar "{categorySearch}"
                                            </Button>
                                        </div>
                                    </CommandEmpty>
                                    <CommandGroup heading="Sugestões">
                                        {suggestions.map((category) => (
                                            <CommandItem
                                                key={category}
                                                value={category}
                                                onSelect={(currentValue) => {
                                                    setFormData({ ...formData, category: currentValue === formData.category ? "" : currentValue });
                                                    setOpenCategoryCombobox(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.category === category ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {category}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Imagem</Label>
                        <label
                            htmlFor="product-image"
                            className="flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <span className="flex items-center gap-2 truncate">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="h-6 w-6 rounded object-cover" />
                                        <span className="text-muted-foreground">Alterar</span>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-4 w-4" />
                                        <span>Adicionar Foto</span>
                                    </>
                                )}
                            </span>
                            <input
                                type="file"
                                id="product-image"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
