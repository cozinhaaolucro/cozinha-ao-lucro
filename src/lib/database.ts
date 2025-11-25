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
    ProductWithCost
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
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: user?.id })
        .select()
        .single();
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

    const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({ ...product, user_id: user?.id })
        .select()
        .single();

    if (productError || !productData) return { data: null, error: productError };

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
    const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, user_id: user?.id })
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
    const user = (await supabase.auth.getUser()).data.user;

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({ ...order, user_id: user?.id })
        .select()
        .single();

    if (orderError || !orderData) return { data: null, error: orderError };

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
