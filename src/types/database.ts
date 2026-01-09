// Database types matching Supabase schema

export type Profile = {
    id: string;
    business_name: string | null;
    phone: string | null;
    logo_url?: string | null;
    description?: string | null;
    banner_url?: string | null;
    color_theme?: string | null;
    slug?: string | null;
    facebook_pixel_id?: string | null;
    created_at: string;
    updated_at: string;
};

export type Ingredient = {
    id: string;
    user_id: string;
    name: string;
    unit: string;
    cost_per_unit: number; // calculated or manual
    stock_quantity: number;
    min_stock_threshold?: number;
    created_at?: string;
    updated_at?: string;
};

export type ProductIngredient = {
    id?: string;
    product_id: string;
    ingredient_id: string;
    quantity: number;
    ingredient?: Ingredient;
};

export type Product = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    selling_price: number;
    image_url: string | null;
    active?: boolean;
    is_highlight?: boolean;
    category?: string | null; // Added new field
    preparation_time_minutes?: number;
    hourly_rate?: number;
    created_at: string;
    updated_at: string;
    product_ingredients?: ProductIngredient[];
};

export type ProductIngredientWithDetails = ProductIngredient & {
    ingredient: Ingredient | null;
};

export type ProductWithIngredients = Product & {
    product_ingredients: ProductIngredientWithDetails[];
};

export type ProductWithCost = Product & {
    total_cost: number;
    margin: number;
};

export type Customer = {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    total_orders?: number;
    total_spent?: number;
    created_at?: string;
    updated_at?: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type Order = {
    id: string;
    user_id: string;
    customer_id: string | null;
    order_number: string | null;
    display_id?: number;
    status: OrderStatus;
    total_value: number;
    delivery_date: string | null;
    delivery_time: string | null;
    delivery_method?: 'pickup' | 'delivery' | null;
    payment_method?: 'cash' | 'pix' | 'card' | null;
    delivery_fee?: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    delivered_at?: string | null;
    production_started_at?: string | null;
    production_completed_at?: string | null;
    production_duration_minutes?: number | null;
    start_date?: string | null;
};

export type OrderStatusLog = {
    id: string;
    order_id: string;
    previous_status: string | null;
    new_status: string;
    created_at: string;
    user_id: string | null;
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

export type MessageTemplate = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    type: 'whatsapp' | 'email' | 'sms';
    created_at?: string;
    updated_at?: string;
};

export type InteractionLog = {
    id: string;
    user_id: string;
    customer_id: string | null;
    order_id: string | null;
    type: string;
    content: string;
    sent_at: string;
};
