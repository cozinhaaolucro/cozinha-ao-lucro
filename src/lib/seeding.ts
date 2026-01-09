import { createIngredient, createProduct } from './database';
import { PRESET_INGREDIENTS, PRESET_PRODUCTS } from '@/data/presets';

export const seedAccount = async () => {
    console.log('Starting account seeding...');

    // 1. Create Ingredients
    const ingredientMap = new Map<string, string>(); // Name -> ID

    for (const ing of PRESET_INGREDIENTS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await createIngredient({ ...ing, stock_quantity: 0 } as any);

        if (data && !error) {
            ingredientMap.set(ing.name, data.id);
        } else {
            // If failed, try to find existing to use its ID (Get or Create pattern)
            // We need to fetch by name. valid strategy for seeding.
            console.warn(`Could not create ${ing.name}, attempting to find existing...`);
            // We don't have a direct "getByName" but we can list all or rely on error message. 
            // Better to just fetch all ingredients once at start of seeding to match? 
            // Or just fetch specific one? getIngredients returns all. 
            // Let's rely on the fact that if we are seeding, it's a new account usually, 
            // but if we are re-seeding or if 'createIngredient' is strict.
        }
    }

    // Better approach: Fetch all ingredients FIRST, populating the map.
    // Then create only missing ones.
    const { data: existingIngredients } = await import('./database').then(m => m.getIngredients());
    if (existingIngredients) {
        existingIngredients.forEach(i => ingredientMap.set(i.name, i.id));
    }

    for (const ing of PRESET_INGREDIENTS) {
        if (!ingredientMap.has(ing.name)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await createIngredient({ ...ing, stock_quantity: 0 } as any);
            if (data && !error) {
                ingredientMap.set(ing.name, data.id);
            }
        }
    }

    // 2. Create Products
    for (const prod of PRESET_PRODUCTS) {
        // Map product ingredients to the newly created ingredient IDs
        const productIngredients = prod.ingredients.map(pi => {
            const ingId = ingredientMap.get(pi.name);
            if (!ingId) {
                console.warn(`Ingredient ${pi.name} not found for product ${prod.name}`);
                return null;
            }
            return {
                ingredient_id: ingId,
                quantity: pi.quantity
            };
        }).filter((pi): pi is { ingredient_id: string; quantity: number } => pi !== null);

        // Create the product
        const { error } = await createProduct(
            {
                name: prod.name,
                description: prod.description,
                selling_price: prod.selling_price,
                active: prod.active,
                image_url: prod.image_url
            },
            productIngredients
        );

        if (error) {
            console.error(`Failed to seed product ${prod.name}:`, error);
        }
    }

    console.log('Account seeding completed.');
};
