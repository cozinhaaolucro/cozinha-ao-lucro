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
    created_at: string;
    updated_at: string;
};

// ... Ingredient ...

export type Product = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    selling_price: number | null;
    image_url: string | null;
    active?: boolean;
    created_at: string;
    updated_at: string;
};

// ... (Rest of types)

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
    google_event_id?: string | null;
    created_at: string;
    updated_at: string;
    delivered_at?: string | null;
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
