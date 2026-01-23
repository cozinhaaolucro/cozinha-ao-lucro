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
    InteractionLog,
    Notification,
    StockMovement,
    PaymentHistory,
    OrderStatusLog
} from '@/types/database';

import { PLANS, PlanType } from '@/config/plans';

const checkUsageLimits = async (user_id: string, resource: 'products' | 'customers' | 'orders') => {
    // 1. Get Subscription (mocked default to free if missing)
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('user_id', user_id)
        .single();

    const planId = (sub?.plan_id as PlanType) || 'free';
    const plan = PLANS[planId];

    // If limit is infinity, return true immediately
    if (plan.limits[resource] === Infinity) return { allowed: true };

    // 2. Get Count
    // For Orders, we check monthly count. For others, total count.
    let count = 0;
    if (resource === 'orders') {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: c } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .gte('created_at', startOfMonth.toISOString());
        count = c || 0;
    } else {
        const { count: c } = await supabase
            .from(resource) // 'products' or 'customers'
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);
        count = c || 0;
    }

    if (count >= plan.limits[resource]) {
        return { allowed: false, plan: planId, limit: plan.limits[resource] };
    }

    return { allowed: true };
};

// Helper for consistent auth checking
const getAuthenticatedUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return { user: null, error: error || new Error('Usuário não autenticado') };
    }
    return { user, error: null };
};

// Profiles
export const getProfile = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .single();
    return { data, error };
};

export const updateProfile = async (updates: Partial<Profile>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
    return { data, error };
};

// Ingredients
export const getIngredients = async (page?: number, limit?: number) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

    if (page !== undefined && limit !== undefined) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    // Get count for pagination
    let count: number | null = null;
    if (page !== undefined && limit !== undefined) {
        const countRes = await supabase
            .from('ingredients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        count = countRes.count || 0;
    }

    return { data: data as Ingredient[] | null, error, count };
};

export const createIngredient = async (ingredient: Omit<Ingredient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    // Check for duplicates
    const { data: existing } = await supabase
        .from('ingredients')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', ingredient.name)
        .single();

    if (existing) {
        return { data: null, error: new Error('Já existe um ingrediente com esse nome.') };
    }

    const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: user.id })
        .select()
        .single();

    // if (error) console.error('Error creating ingredient:', error);

    return { data, error };
};

export const updateIngredient = async (id: string, updates: Partial<Ingredient>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Security check
        .select()
        .single();
    return { data, error };
};

export const deleteIngredient = async (id: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
    return { error };
};

// Products
export const getProducts = async (page?: number, limit?: number) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    let query = supabase
        .from('products')
        .select(`
      *,
      product_ingredients (
        quantity,
        display_unit,
        ingredient:ingredients (*)
      )
    `)
        .eq('user_id', user.id)
        .order('name');
    if (page !== undefined && limit !== undefined) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;
    // Get count for pagination
    let count: number | null = null;
    if (page !== undefined && limit !== undefined) {
        const countRes = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        count = countRes.count || 0;
    }

    return { data: data as Product[] | null, error, count };
};

export const getProductsCount = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { count: 0, error: authError };
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
    return { count, error };
};

export const createProduct = async (
    product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    ingredients: Array<{ ingredient_id: string; quantity: number; display_unit?: string }>
) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const limitCheck = await checkUsageLimits(user.id, 'products');
    if (!limitCheck.allowed) {
        return { data: null, error: { message: `Limite de produtos atingido no plano ${limitCheck.plan?.toUpperCase()}. Faça upgrade para continuar.` } };
    }



    const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({ ...product, user_id: user.id })
        .select()
        .single();

    if (productError || !productData) {
        // console.error('Error creating product:', productError);
        return { data: null, error: productError };
    }

    if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
            .from('product_ingredients')
            .insert(
                ingredients.map((ing) => ({
                    product_id: productData.id,
                    ingredient_id: ing.ingredient_id,
                    quantity: ing.quantity,
                    display_unit: ing.display_unit
                }))
            );

        if (ingredientsError) return { data: null, error: ingredientsError };
    }

    return { data: productData, error: null };
};

export const updateProduct = async (
    id: string,
    updates: Partial<Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    ingredients: Array<{ ingredient_id: string; quantity: number; display_unit?: string }> | null
) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    // 1. Update product details
    const { data: productData, error: productError } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Security check
        .select()
        .single();

    if (productError) return { data: null, error: productError };

    // 2. Update ingredients if provided (Full Replace Strategy)
    if (ingredients !== null) {
        // Delete existing ingredients
        const { error: deleteError } = await supabase
            .from('product_ingredients')
            .delete()
            .eq('product_id', id); // Logic assumes ownership derived from product, but ideally we check product ownership first.
        // Since we just updated the product with user_id check successfully, we hold ownership.

        if (deleteError) return { data: null, error: deleteError };

        // Insert new ingredients
        if (ingredients.length > 0) {
            const { error: insertError } = await supabase
                .from('product_ingredients')
                .insert(
                    ingredients.map(ing => ({
                        product_id: id,
                        ingredient_id: ing.ingredient_id,
                        quantity: ing.quantity,
                        display_unit: ing.display_unit
                    }))
                );

            if (insertError) return { data: null, error: insertError };
        }
    }

    return { data: productData, error: null };
};

export const deleteProduct = async (id: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
    return { error };
};

// Customers
// Customers
// Customers
export const getCustomers = async (page?: number, limit?: number, search?: string, filters?: { startDate?: Date, endDate?: Date, onlyInactive?: boolean }) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (filters?.startDate) {
        query = query.gte('last_order_date', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
        // End of day
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('last_order_date', end.toISOString());
    }
    if (filters?.onlyInactive) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.lt('last_order_date', thirtyDaysAgo.toISOString());
    }

    if (page !== undefined && limit !== undefined) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    // Get count for pagination
    let count: number | null = null;
    if (page !== undefined && limit !== undefined) {
        let countQuery = supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        if (search) countQuery = countQuery.ilike('name', `%${search}%`);

        if (filters?.startDate) {
            countQuery = countQuery.gte('last_order_date', filters.startDate.toISOString());
        }
        if (filters?.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            countQuery = countQuery.lte('last_order_date', end.toISOString());
        }
        if (filters?.onlyInactive) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            countQuery = countQuery.lt('last_order_date', thirtyDaysAgo.toISOString());
        }

        const countRes = await countQuery;
        count = countRes.count || 0;
    }

    return { data: data as Customer[] | null, error, count };
};

export const getCustomersCount = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { count: 0, error: authError };
    const { count, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
    return { count, error };
};

export const createCustomer = async (customer: Omit<Customer, 'id' | 'user_id' | 'total_orders' | 'total_spent' | 'created_at' | 'updated_at'>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const limitCheck = await checkUsageLimits(user.id, 'customers');
    if (!limitCheck.allowed) {
        return { data: null, error: { message: `Limite de clientes atingido no plano ${limitCheck.plan?.toUpperCase()}. Faça upgrade para continuar.` } };
    }



    const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, user_id: user.id })
        .select()
        .single();
    return { data, error };
};

// Orders
export const getOrders = async (status?: string, startDate?: string, endDate?: string, page?: number, limit?: number) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('orders')
        .select(`
      *,
      customer:customers (*),
      items:order_items (
        *,
        product:products (
            *,
            product_ingredients (
                quantity,
                display_unit,
                ingredient:ingredients (*)
            )
        )
      )
    `)
        .eq('user_id', user.id)
        .order('delivery_date', { ascending: true });

    if (status) {
        query = query.eq('status', status);
    }

    if (startDate) {
        query = query.gte('delivery_date', startDate);
    }

    if (endDate) {
        query = query.lte('delivery_date', endDate);
    }

    if (page !== undefined && limit !== undefined) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
    }

    const { data, error } = await query;

    // Get count if pagination is active
    let count: number | null = null;
    if (page !== undefined && limit !== undefined) {
        let countQuery = supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (status) countQuery = countQuery.eq('status', status);
        if (startDate) countQuery = countQuery.gte('delivery_date', startDate);
        if (endDate) countQuery = countQuery.lte('delivery_date', endDate);

        const countRes = await countQuery;
        count = countRes.count || 0;
    }

    return { data: data as OrderWithDetails[] | null, error, count };
};

export const getOrdersByDateRange = async (startDate: string, endDate: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                *,
                product_id,
                quantity,
                unit_cost,
                subtotal,
                product_name
            )
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .neq('status', 'cancelled');

    return { data: data as OrderWithDetails[] | null, error };
};

export const getActiveOrders = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (
                product_id,
                quantity
            )
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'preparing']);

    return { data: data as OrderWithDetails[] | null, error };
};

export const updateOrderStatus = async (orderId: string, newStatus: string, previousStatus?: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { status: newStatus };

    // Set production_started_at when moving to 'preparing'
    if (newStatus === 'preparing' && previousStatus !== 'preparing') {
        updates.production_started_at = new Date().toISOString();
    }

    // Set production_completed_at when moving to 'ready'
    if (newStatus === 'ready' && previousStatus === 'preparing') {
        updates.production_completed_at = new Date().toISOString();
    }

    // Set delivered_at when moving to 'delivered'
    if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString();
    }

    // 1. Update Order
    const { error: updateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .eq('user_id', user.id); // Security check

    if (updateError) return { error: updateError };

    // 2. Insert Log (Customer stats and stock are now handled by DB triggers)
    const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
            order_id: orderId,
            previous_status: previousStatus,
            new_status: newStatus,
            user_id: user.id
        });

    return { error: logError };
};

export const updateCustomerStats = async (customerId: string) => {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('total_value, status')
        .eq('customer_id', customerId)
        .neq('status', 'cancelled');

    if (error || !orders) return { error };

    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalOrders = orders.length;
    const totalSpent = deliveredOrders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const lastOrderDate = orders.length > 0 ? new Date().toISOString() : null; // Simplificando por enquanto

    return await supabase
        .from('customers')
        .update({
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate,
            updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
};

export const createOrder = async (
    order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<OrderItem, 'id' | 'order_id'>>
) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const limitCheck = await checkUsageLimits(user.id, 'orders');
    if (!limitCheck.allowed) {
        return { data: null, error: { message: `Limite de pedidos atingido no plano ${limitCheck.plan?.toUpperCase()}. Faça upgrade para continuar.` } };
    }

    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({ ...order, user_id: user.id })
        .select()
        .single();

    if (orderError || !orderData) {
        // console.error('Error creating order:', orderError);
        return { data: null, error: orderError };
    }

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

export const deleteOrder = async (id: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
    return { error };
};

export const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Security check
        .select()
        .single();
    return { data, error };
};

export const deleteCustomer = async (id: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
    return { error };
};

// Stock Management - Functions removed as they are now handled by database triggers (fn_handle_stock_on_status_change)
// Manual stock deduction is no longer needed since SQL triggers manage this atomically on status change to 'preparing'.


// Message Templates
export const getMessageTemplates = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('title');
    return { data, error };
};

export const createMessageTemplate = async (template: Omit<MessageTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    const { data, error } = await supabase
        .from('message_templates')
        .insert({ ...template, user_id: user?.id })
        .select()
        .single();
    return { data, error };
};

export const updateMessageTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Security check
        .select()
        .single();
    return { data, error };
};

export const deleteMessageTemplate = async (id: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security check
    return { error };
};

// Interaction Logs
export const createInteractionLog = async (log: Omit<InteractionLog, 'id' | 'user_id' | 'sent_at'>) => {
    const { user } = await getAuthenticatedUser();
    const { data, error } = await supabase
        .from('interaction_logs')
        .insert({ ...log, user_id: user?.id })
        .select()
        .single();
    return { data, error };
};

export const getInteractionLogs = async (customerId?: string, orderId?: string) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('interaction_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

    if (customerId) query = query.eq('customer_id', customerId);
    if (orderId) query = query.eq('order_id', orderId);

    const { data, error } = await query;
    return { data, error };
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const getNotifications = async (unreadOnly = false) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (unreadOnly) {
        query = query.eq('read', false);
    }

    const { data, error } = await query;
    return { data: data as Notification[] | null, error };
};

export const markNotificationAsRead = async (id: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    return { error };
};

export const markAllNotificationsAsRead = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    return { error };
};

export const getUnreadNotificationCount = async () => {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
    return { count: count ?? 0, error };
};

// ============================================================================
// STOCK MOVEMENTS
// ============================================================================

export const getStockMovements = async (ingredientId?: string, limit = 50) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: [], error: authError };

    let query = supabase
        .from('stock_movements')
        .select(`
            *,
            ingredient:ingredients(id, name, unit)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (ingredientId) {
        query = query.eq('ingredient_id', ingredientId);
    }

    const { data, error } = await query;
    return { data: data as StockMovement[] | null, error };
};

export const createStockMovement = async (movement: {
    ingredient_id: string;
    type: 'in' | 'out' | 'adjustment' | 'loss';
    quantity: number;
    reason?: string;
}) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    // 1. Create History Record
    const { data, error } = await supabase
        .from('stock_movements')
        .insert({ ...movement, user_id: user.id })
        .select()
        .single();

    if (error) {
        console.error("Error creating stock movement:", error);
        return { data: null, error };
    }

    // 2. Update via Trigger
    // We rely on the SQL Trigger 'on_stock_movement_insert' to update the stock.
    // If the user reports that stock is NOT updating, it means the trigger is missing.
    // But since they reported "Double", the trigger IS active.
    // So we remove the manual update.

    return { data, error: null };

    return { data, error: null };
};

const updateIngredientStock = async (ingredientId: string, quantityDelta: number) => {
    const { data: ingredient } = await supabase
        .from('ingredients')
        .select('stock_quantity')
        .eq('id', ingredientId)
        .single();

    if (ingredient) {
        const newStock = Math.max(0, ingredient.stock_quantity + quantityDelta);
        await supabase
            .from('ingredients')
            .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
            .eq('id', ingredientId);
    }
};

// ============================================================================
// ORDER STATUS LOGS
// ============================================================================

// ============================================================================
// DASHBOARD RPC
// ============================================================================

export const getDashboardMetrics = async (startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        start_date: startDate,
        end_date: endDate
    });
    return { data, error };
};

export const getOrderStatusLogs = async (orderId: string) => {
    const { data, error } = await supabase
        .from('order_status_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
    return { data: data as OrderStatusLog[] | null, error };
};

// ============================================================================
// PAYMENT HISTORY
// ============================================================================

export const getPaymentHistory = async () => {
    const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false });
    return { data: data as PaymentHistory[] | null, error };
};

// ============================================================================
// LOW STOCK ALERTS
// ============================================================================

export const getLowStockIngredients = async () => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { data: null, error: authError };

    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('user_id', user.id);

    if (error) return { data: null, error };

    // Fallback: filter client-side if raw comparison doesn't work
    const filtered = data?.filter(i => i.stock_quantity < (i.min_stock_threshold ?? 5));

    return { data: filtered as Ingredient[] | null, error };
};


export const updateOrderPositions = async (updates: { id: string, status: string, position: number }[]) => {
    // Legacy support or fallback if needed, but per plan we prefer RPC
    const promises = updates.map(update =>
        supabase
            .from('orders')
            .update({ status: update.status, position: update.position, updated_at: new Date().toISOString() })
            .eq('id', update.id)
    );
    const results = await Promise.all(promises);
    const error = results.find(r => r.error)?.error || null;
    return { error };
};

export const updateKanbanPositions = async (updates: { id: string, status: string, position: number }[]) => {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) return { error: authError };

    const { error } = await supabase.rpc('update_kanban_positions', {
        updates: updates
    });

    return { error };
};
