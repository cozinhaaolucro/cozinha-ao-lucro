
import {
    Drumstick,
    Beef,
    Coffee,
    Utensils,
    Trees,      // Brocolis
    Component,  // Granulado
    Salad,      // Greens
    Fish,       // Fish
    Pizza,      // Catch-all
    Cherry,     // Sweets
    Citrus,
    Apple,
    Upload      // Baking Powder
} from 'lucide-react';

import {
    IconCondensedMilk,
    IconMilkCarton,
    IconCreamBox,
    IconNutellaJar,
    IconFlourSack,
    IconSugar,
    IconButter,
    IconChocolateBar,
    IconPowder,
    IconEgg,
    IconChantilly,
    IconPackaging
} from '@/components/icons/CustomIngredientIcons';

export const getIngredientIcon = (name: string) => {
    const lowerName = name.toLowerCase();

    // --- Custom Specific Icons ---
    if (lowerName.includes('leite condensado')) return IconCondensedMilk;
    if (lowerName.includes('creme de leite')) return IconCreamBox;
    if (lowerName.includes('leite integral')) return IconMilkCarton;
    if (lowerName.includes('leite') && !lowerName.includes('pó')) return IconMilkCarton;

    if (lowerName.includes('nutella') || lowerName.includes('avelã')) return IconNutellaJar;

    if (lowerName.includes('farinha') || lowerName.includes('trigo')) return IconFlourSack;

    if (lowerName.includes('açúcar') || lowerName.includes('acucar')) return IconSugar;

    if (lowerName.includes('manteiga') || lowerName.includes('margarina')) return IconButter;

    if (lowerName.includes('chocolate') && (lowerName.includes('barra') || lowerName.includes('nobre'))) return IconChocolateBar;

    if (lowerName.includes('chocolate em pó') || lowerName.includes('cacau') || lowerName.includes('pó')) return IconPowder;

    if (lowerName.includes('ovo')) return IconEgg;

    if (lowerName.includes('chantilly')) return IconChantilly;

    // Packing
    if (lowerName.includes('embalagem') || lowerName.includes('pote') || lowerName.includes('copo') ||
        lowerName.includes('saco') || lowerName.includes('saquinho') ||
        lowerName.includes('forminha') || lowerName.includes('caixa') || lowerName.includes('marmita')) return IconPackaging;


    // --- Lucide Fallbacks for others ---
    if (lowerName.includes('granulado')) return Component;

    // Fruits
    if (lowerName.includes('morango') || lowerName.includes('fruta')) return Cherry;
    if (lowerName.includes('limão') || lowerName.includes('laranja')) return Citrus;
    if (lowerName.includes('maçã') || lowerName.includes('banana')) return Apple;

    // Meats/Savory
    if (lowerName.includes('frango')) return Drumstick;
    if (lowerName.includes('carne') || lowerName.includes('bovino') || lowerName.includes('moída')) return Beef;
    if (lowerName.includes('peixe') || lowerName.includes('camarão')) return Fish;

    // Veggies
    if (lowerName.includes('brócolis') || lowerName.includes('brocolis')) return Trees;
    if (lowerName.includes('salada') || lowerName.includes('folha')) return Salad;

    // Baking
    if (lowerName.includes('fermento') || lowerName.includes('bicarbonato')) return Upload;

    return Utensils;
};
