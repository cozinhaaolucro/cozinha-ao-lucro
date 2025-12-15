// Database types matching Supabase schema

export type Profile = {
    id: string;
    business_name: string | null;
    phone: string | null;
    logo_url?: string | null;
    description?: string | null;
    banner_url?: string | null;
    color_theme?: string | null;
    created_at: string;
    updated_at: string;
};

export type Ingredient = {
    id: string;
    user_id: string;
    name: string;
    unit: 'kg' | 'litro' | 'unidade' | 'grama' | 'ml';
    cost_per_unit: number;
    stock_quantity: number;
    created_at: string;
    updated_at: string;
};

export type Product = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    selling_price: number | null;
    image_url: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
};

export type ProductIngredient = {
    id: string;
    product_id: string;
    ingredient_id: string;
    quantity: number;
};

export type ProductWithCost = Product & {
    total_cost: number;
    profit_margin: number;
    ingredients: Array<{
        ingredient: Ingredient;
        quantity: number;
    }>;
};

export type ProductIngredientWithDetails = ProductIngredient & {
    ingredient: Ingredient;
};

export type ProductWithIngredients = Product & {
    product_ingredients?: ProductIngredientWithDetails[];
};

export type Customer = {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    last_order_date: string | null;
    total_orders: number;
    total_spent: number;
    created_at: string;
    updated_at: string;
    birth_date?: string | null;
    internal_notes?: string | null;
    ltv_value?: number;
    email?: string | null;
};

export type MessageTemplate = {
    id: string;
    user_id: string;
    title: string;
    body_content: string;
    trigger_status: OrderStatus | null;
    created_at: string;
    updated_at: string;
};

export type InteractionLog = {
    id: string;
    user_id: string;
    order_id: string | null;
    customer_id: string | null;
    message_type: 'whatsapp' | 'email';
    sent_at: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type Order = {
    id: string;
    user_id: string;
    customer_id: string | null;
    order_number: string | null;
    status: OrderStatus;
    total_value: number;
    delivery_date: string | null;
    delivery_time: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type OrderItem = {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
};

export type OrderWithDetails = Order & {
    customer: Customer | null;
    items: Array<OrderItem & { product: Product | null }>;
};
