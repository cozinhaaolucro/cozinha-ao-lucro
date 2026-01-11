// ============================================================================
// COZINHA AO LUCRO - DATABASE TYPES
// ============================================================================
// Tipos TypeScript sincronizados com o schema do Supabase
// Última atualização: 2026-01-11
// ============================================================================

// ============================================================================
// 1. PROFILES (Usuários/Negócios)
// ============================================================================

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';
export type SubscriptionInterval = 'monthly' | 'yearly';

export type Profile = {
    id: string;
    business_name: string | null;
    phone: string | null;
    logo_url: string | null;
    description: string | null;
    banner_url: string | null;
    color_theme: string | null;
    slug: string | null;
    facebook_pixel_id: string | null;
    // Campos de Assinatura
    subscription_status: SubscriptionStatus;
    subscription_plan: string | null;
    subscription_end: string | null;
    subscription_interval: SubscriptionInterval;
    pagarme_customer_id: string | null;
    // Timestamps
    created_at: string;
    updated_at: string;
};

// ============================================================================
// 2. INGREDIENTS (Ingredientes)
// ============================================================================

export type Ingredient = {
    id: string;
    user_id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
    stock_quantity: number;
    min_stock_threshold: number;
    created_at: string;
    updated_at: string;
};

// ============================================================================
// 3. PRODUCTS (Produtos)
// ============================================================================

export type Product = {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    selling_price: number;
    selling_unit: string;
    preparation_time_minutes: number;
    hourly_rate: number;
    image_url: string | null;
    active: boolean;
    is_highlight: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
    // Relacionamento (quando incluído no select)
    product_ingredients?: ProductIngredient[];
};

// ============================================================================
// 4. PRODUCT INGREDIENTS (Ficha Técnica)
// ============================================================================

export type ProductIngredient = {
    id: string;
    product_id: string;
    ingredient_id: string;
    quantity: number;
    // Relacionamento
    ingredient?: Ingredient;
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

// ============================================================================
// 5. CUSTOMERS (Clientes)
// ============================================================================

export type Customer = {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    last_order_date: string | null;
    total_orders: number;
    total_spent: number;
    created_at: string;
    updated_at: string;
};

// ============================================================================
// 6. ORDERS (Pedidos)
// ============================================================================

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type DeliveryMethod = 'pickup' | 'delivery';
export type PaymentMethod = 'cash' | 'pix' | 'card' | 'transfer';

export type Order = {
    id: string;
    user_id: string;
    customer_id: string | null;
    order_number: string | null;
    display_id: number;
    status: OrderStatus;
    total_value: number;
    // Entrega
    delivery_date: string | null;
    delivery_time: string | null;
    delivery_method: DeliveryMethod | null;
    delivery_fee: number;
    // Pagamento
    payment_method: PaymentMethod | null;
    // Notas
    notes: string | null;
    google_event_id: string | null;
    // Timestamps de produção
    production_started_at: string | null;
    production_completed_at: string | null;
    production_duration_minutes: number | null;
    delivered_at: string | null;
    start_date: string | null;
    // Timestamps gerais
    created_at: string;
    updated_at: string;
};

// ============================================================================
// 7. ORDER ITEMS (Itens do Pedido)
// ============================================================================

export type OrderItem = {
    id: string;
    order_id: string;
    product_id: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    // Relacionamento
    product?: Product | null;
};

export type OrderWithDetails = Order & {
    customer: Customer | null;
    items: OrderItem[];
};

// ============================================================================
// 8. ORDER STATUS LOGS (Histórico de Status)
// ============================================================================

export type OrderStatusLog = {
    id: string;
    order_id: string;
    previous_status: OrderStatus | null;
    new_status: OrderStatus;
    user_id: string | null;
    created_at: string;
};

// ============================================================================
// 9. STOCK MOVEMENTS (Movimentações de Estoque)
// ============================================================================

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'loss' | 'sale';

export type StockMovement = {
    id: string;
    user_id: string;
    ingredient_id: string;
    type: StockMovementType;
    quantity: number;
    reason: string | null;
    order_id: string | null;
    created_at: string;
    // Relacionamento
    ingredient?: Ingredient;
};

// ============================================================================
// 10. MESSAGE TEMPLATES (Templates de Mensagem)
// ============================================================================

export type MessageTemplateType = 'whatsapp' | 'email' | 'sms';

export type MessageTemplate = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    type: MessageTemplateType;
    created_at: string;
    updated_at: string;
};

// ============================================================================
// 11. INTERACTION LOGS (Logs de Interação CRM)
// ============================================================================

export type InteractionLog = {
    id: string;
    user_id: string;
    customer_id: string | null;
    order_id: string | null;
    type: string;
    notes: string | null;
    content: string | null; // Alias para notes
    sent_at: string;
};

// ============================================================================
// 12. NOTIFICATIONS (Notificações)
// ============================================================================

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export type Notification = {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    created_at: string;
};

// ============================================================================
// 13. PAYMENT HISTORY (Histórico de Pagamentos)
// ============================================================================

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentHistory = {
    id: string;
    user_id: string;
    pagarme_order_id: string | null;
    amount: number;
    status: PaymentStatus;
    payment_method: string | null;
    paid_at: string | null;
    created_at: string;
};

// ============================================================================
// 14. SYSTEM ERRORS (Logs de Erro do Sistema)
// ============================================================================

export type SystemError = {
    id: string;
    user_id: string | null;
    function_name: string | null;
    error_message: string | null;
    error_details: Record<string, unknown> | null;
    severity: string;
    created_at: string;
};
