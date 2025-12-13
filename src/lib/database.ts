import { supabase } from './supabase';
import type {
    Profile,
    Ingredient,
    Product,
    ProductIngredient,
    Customer,
    Order,
    OrderItem,
    OrderWithDetails,
    ProductWithCost,
    MessageTemplate,
    InteractionLog
} from '@/types/database';

// Profiles
export const getProfile = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single();
    return { data, error };
};

export const updateProfile = async (updates: Partial<Profile>) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
    return { data, error };
};

// Ingredients
export const getIngredients = async () => {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');
    return { data, error };
};

export const createIngredient = async (ingredient: Omit<Ingredient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    console.log('Creating ingredient:', ingredient);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
        console.error('User not authenticated');
        return { data: null, error: new Error('Usuário não autenticado') };
    }

    const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: user.id })
        .select()
        .single();

    if (error) console.error('Error creating ingredient:', error);
    else console.log('Ingredient created:', data);

    return { data, error };
};

export const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteIngredient = async (id: string) => {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);
    return { error };
};

// Products
export const getProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      product_ingredients (
        quantity,
        ingredient:ingredients (*)
      )
    `)
        .eq('active', true)
        .order('name');
    return { data, error };
};

export const createProduct = async (
    product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ingredients: Array<{ ingredient_id: string; quantity: number }>
) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({ ...product, user_id: user.id })
        .select()
        .single();

    if (productError || !productData) {
        console.error('Error creating product:', productError);
        return { data: null, error: productError };
    }
    console.log('Product created:', productData);

    if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
            .from('product_ingredients')
            .insert(
                ingredients.map((ing) => ({
                    product_id: productData.id,
                    ingredient_id: ing.ingredient_id,
                    quantity: ing.quantity,
                }))
            );

        if (ingredientsError) return { data: null, error: ingredientsError };
    }

    return { data: productData, error: null };
};

// Customers
export const getCustomers = async () => {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
    return { data, error };
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'user_id' | 'total_orders' | 'total_spent' | 'created_at' | 'updated_at'>) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, user_id: user.id })
        .select()
        .single();
    return { data, error };
};

// Orders
export const getOrders = async (status?: string) => {
    let query = supabase
        .from('orders')
        .select(`
      *,
      customer:customers (*),
      items:order_items (
        *,
        product:products (*)
      )
    `)
        .order('delivery_date', { ascending: true });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;
    return { data: data as OrderWithDetails[] | null, error };
};

export const createOrder = async (
    order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<OrderItem, 'id' | 'order_id'>>
) => {
    console.log('Creating order:', order, 'Items:', items);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: null, error: new Error('Usuário não autenticado') };

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({ ...order, user_id: user.id })
        .select()
        .single();

    if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        return { data: null, error: orderError };
    }
    console.log('Order created:', orderData);

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
            items.map((item) => ({
                ...item,
                order_id: orderData.id,
            }))
        );

    if (itemsError) return { data: null, error: itemsError };

    return { data: orderData, error: null };
};

export const updateOrderStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteOrder = async (id: string) => {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
    return { error };
};

export const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteCustomer = async (id: string) => {
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
    return { error };
};

// Stock Management
export const deductStockFromOrder = async (orderId: string) => {
    console.log('Deducting stock for order:', orderId);

    // 1. Get Order Items with product ingredients
    const { data: orderitems, error: orderError } = await supabase
        .from('order_items')
        .select(`
            quantity,
            product:products (
                id,
                product_ingredients (
                    quantity,
                    ingredient_id
                )
            )
        `)
        .eq('order_id', orderId);

    if (orderError || !orderitems) {
        console.error('Error fetching order items for stock deduction:', orderError);
        return { error: orderError };
    }

    // 2. Calculate total ingredient usage
    const ingredientUsage = new Map<string, number>();

    orderitems.forEach((item: any) => {
        if (item.product && item.product.product_ingredients) {
            item.product.product_ingredients.forEach((pi: any) => {
                const current = ingredientUsage.get(pi.ingredient_id) || 0;
                ingredientUsage.set(pi.ingredient_id, current + (pi.quantity * item.quantity));
            });
        }
    });

    // 3. Update stock for each ingredient
    const updates = Array.from(ingredientUsage.entries()).map(async ([ingredientId, quantityUsed]) => {
        const { data: ingredient } = await supabase.from('ingredients').select('stock_quantity').eq('id', ingredientId).single();

        if (ingredient) {
            const newStock = Math.max(0, ingredient.stock_quantity - quantityUsed);
            return supabase
                .from('ingredients')
                .update({ stock_quantity: newStock })
                .eq('id', ingredientId);
        }
        return Promise.resolve({ error: null });
    });

    await Promise.all(updates);

    return { error: null };
};

// Message Templates
export const getMessageTemplates = async () => {
    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('title');
    return { data, error };
};

export const createMessageTemplate = async (template: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
        .from('message_templates')
        .insert({ ...template, user_id: user?.id })
        .select()
        .single();
    return { data, error };
};

export const updateMessageTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    return { data, error };
};

export const deleteMessageTemplate = async (id: string) => {
    const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);
    return { error };
};

// Interaction Logs
export const createInteractionLog = async (log: Omit<InteractionLog, 'id' | 'user_id' | 'sent_at'>) => {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
        .from('interaction_logs')
        .insert({ ...log, user_id: user?.id })
        .select()
        .single();
    return { data, error };
};

export const getInteractionLogs = async (customerId?: string, orderId?: string) => {
    let query = supabase
        .from('interaction_logs')
        .select('*')
        .order('sent_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (orderId) query = query.eq('order_id', orderId);

    const { data, error } = await query;
    return { data, error };
};
