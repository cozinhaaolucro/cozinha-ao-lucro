import { supabase } from './supabase';
import { createIngredient, createProduct, getIngredients, getProducts } from './database';
import { PRESET_INGREDIENTS, PRESET_PRODUCTS } from '@/data/presets';

export const seedAccount = async () => {
    console.log('Checking if seeding is needed...');

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log('No user logged in, skipping seeding');
        return;
    }

    // 2. Check if this account has already been seeded (DB-level lock)
    const { data: profile } = await supabase
        .from('profiles')
        .select('has_seeded')
        .eq('id', user.id)
        .single();

    if (profile?.has_seeded) {
        console.log('Account already seeded, skipping');
        return;
    }

    // 3. Mark as seeding BEFORE we start (to prevent race conditions)
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_seeded: true })
        .eq('id', user.id);

    if (updateError) {
        console.error('Failed to set has_seeded flag:', updateError);
        // Continue anyway, but log the error
    }

    console.log('Starting account seeding...');

    try {
        // 4. Fetch ALL existing data first to avoid duplicates
        const { data: existingIngredients } = await getIngredients();
        const { data: existingProducts } = await getProducts();

        const ingredientMap = new Map<string, string>(); // Name -> ID
        const existingProductNames = new Set(existingProducts?.map(p => p.name) || []);

        // Populate map with existing ingredients
        if (existingIngredients) {
            existingIngredients.forEach(i => ingredientMap.set(i.name, i.id));
        }

        // 5. Create ONLY missing ingredients
        for (const ing of PRESET_INGREDIENTS) {
            if (ingredientMap.has(ing.name)) {
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await createIngredient({ ...ing, stock_quantity: 0 } as any);

            if (data && !error) {
                ingredientMap.set(ing.name, data.id);
                console.log(`Created ingredient: ${ing.name}`);
            } else if (error) {
                console.warn(`Ingredient ${ing.name} creation issue:`, error.message);
            }
        }

        // 6. Create ONLY missing products
        // [DISABLED] Per user request, products should only be created via Template Library
        /*
        for (const prod of PRESET_PRODUCTS) {
            if (existingProductNames.has(prod.name)) {
                continue;
            }

            const productIngredients = prod.ingredients
                .map(pi => {
                    const ingId = ingredientMap.get(pi.name);
                    if (!ingId) {
                        console.warn(`Ingredient ${pi.name} not found for product ${prod.name}`);
                        return null;
                    }
                    return { ingredient_id: ingId, quantity: pi.quantity };
                })
                .filter((pi): pi is { ingredient_id: string; quantity: number } => pi !== null);

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

            if (!error) {
                console.log(`Created product: ${prod.name}`);
            } else {
                console.error(`Failed to create product ${prod.name}:`, error.message);
            }
        }
        */

        console.log('Account seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
        // Even if seeding fails, we keep has_seeded=true to prevent infinite retry loops
        // User can manually trigger re-seeding if needed
    }
};
