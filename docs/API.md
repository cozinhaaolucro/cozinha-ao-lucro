# 📚 API Documentation

## Database Functions (`src/lib/database.ts`)

Este arquivo contém todas as funções de CRUD para interagir com o Supabase.

---

## 👤 Profiles

### `getProfile()`
Busca o perfil do usuário autenticado.

```typescript
const { data, error } = await getProfile();

// Response
data: Profile | null
error: Error | null
```

### `updateProfile(updates)`
Atualiza o perfil do usuário.

```typescript
await updateProfile({
  business_name: 'Minha Doceria',
  phone: '11999999999',
});
```

---

## 🥕 Ingredients

### `getIngredients()`
Lista todos os ingredientes do usuário.

```typescript
const { data, error } = await getIngredients();

// Response: Ingredient[]
```

### `createIngredient(ingredient)`
Cria um novo ingrediente.

```typescript
await createIngredient({
  name: 'Farinha de Trigo',
  unit: 'kg',
  cost_per_unit: 5.50,
  stock_quantity: 10,
  min_stock_threshold: 2,
});
```

### `updateIngredient(id, updates)`
Atualiza um ingrediente.

```typescript
await updateIngredient('uuid', {
  stock_quantity: 15,
  cost_per_unit: 6.00,
});
```

### `deleteIngredient(id)`
Exclui um ingrediente.

```typescript
await deleteIngredient('uuid');
```

---

## 🍰 Products

### `getProducts()`
Lista produtos com ingredientes.

```typescript
const { data } = await getProducts();

// Response: ProductWithIngredients[]
// Includes: product_ingredients[].ingredient
```

### `createProduct(product, ingredients)`
Cria produto com ficha técnica.

```typescript
await createProduct(
  {
    name: 'Bolo de Chocolate',
    selling_price: 45.00,
    category: 'Bolos',
    preparation_time_minutes: 60,
  },
  [
    { ingredient_id: 'uuid1', quantity: 0.5 },  // 500g farinha
    { ingredient_id: 'uuid2', quantity: 3 },    // 3 ovos
  ]
);
```

### `updateProduct(id, updates, ingredients)`
Atualiza produto e ingredientes.

```typescript
await updateProduct(
  'uuid',
  { selling_price: 50.00 },
  [{ ingredient_id: 'uuid1', quantity: 0.6 }]
);
```

### `deleteProduct(id)`
Exclui um produto.

```typescript
await deleteProduct('uuid');
```

---

## 👥 Customers

### `getCustomers()`
Lista todos os clientes.

```typescript
const { data } = await getCustomers();

// Response: Customer[]
```

### `createCustomer(customer)`
Cria um novo cliente.

```typescript
await createCustomer({
  name: 'Maria Silva',
  phone: '11999999999',
  email: 'maria@email.com',
  address: 'Rua das Flores, 123',
});
```

### `updateCustomer(id, updates)`
Atualiza um cliente.

```typescript
await updateCustomer('uuid', {
  notes: 'Cliente VIP',
});
```

### `deleteCustomer(id)`
Exclui um cliente.

```typescript
await deleteCustomer('uuid');
```

---

## 📦 Orders

### `getOrders(status?, startDate?, endDate?)`
Lista pedidos com filtros opcionais.

```typescript
// Todos os pedidos
const { data } = await getOrders();

// Filtrado por status
const { data } = await getOrders('pending');

// Filtrado por período
const { data } = await getOrders(null, '2026-01-01', '2026-01-31');

// Response: OrderWithDetails[]
// Includes: customer, items[].product
```

### `createOrder(order, items)`
Cria um novo pedido.

```typescript
await createOrder(
  {
    customer_id: 'uuid',
    delivery_date: '2026-01-15',
    delivery_time: '14:00',
    status: 'pending',
    total_value: 150.00,
    notes: 'Entregar na portaria',
  },
  [
    {
      product_id: 'uuid1',
      product_name: 'Bolo de Chocolate',
      quantity: 2,
      unit_price: 45.00,
      subtotal: 90.00,
    },
  ]
);
```

### `updateOrderStatus(orderId, newStatus, previousStatus?)`
Atualiza status do pedido. **Triggers automáticos são executados.**

```typescript
await updateOrderStatus('uuid', 'preparing', 'pending');

// Automações (via SQL triggers):
// - Deduz estoque quando status = 'preparing'
// - Restaura estoque se voltar para 'pending' ou 'cancelled'
// - Atualiza estatísticas do cliente
```

### `deleteOrder(id)`
Exclui um pedido.

```typescript
await deleteOrder('uuid');
```

---

## 📊 Stock Movements

### `getStockMovements(ingredientId?, limit?)`
Lista movimentações de estoque.

```typescript
// Todas as movimentações
const { data } = await getStockMovements();

// De um ingrediente específico
const { data } = await getStockMovements('ingredient-uuid', 20);

// Response: StockMovement[]
// Includes: ingredient
```

### `createStockMovement(movement)`
Cria movimentação e atualiza estoque automaticamente.

```typescript
await createStockMovement({
  ingredient_id: 'uuid',
  type: 'in',        // 'in' | 'out' | 'adjustment' | 'loss'
  quantity: 5,
  reason: 'Compra semanal',
});
```

---

## 🔔 Notifications

### `getNotifications(unreadOnly?)`
Lista notificações.

```typescript
// Todas
const { data } = await getNotifications();

// Apenas não lidas
const { data } = await getNotifications(true);
```

### `markNotificationAsRead(id)`
Marca como lida.

```typescript
await markNotificationAsRead('uuid');
```

### `markAllNotificationsAsRead()`
Marca todas como lidas.

```typescript
await markAllNotificationsAsRead();
```

### `getUnreadNotificationCount()`
Conta não lidas.

```typescript
const { count } = await getUnreadNotificationCount();
// count: number
```

---

## 📝 Message Templates

### `getMessageTemplates()`
Lista templates de mensagem.

```typescript
const { data } = await getMessageTemplates();
```

### `createMessageTemplate(template)`
Cria novo template.

```typescript
await createMessageTemplate({
  title: 'Confirmação de Pedido',
  content: 'Olá {nome}, seu pedido #{numero} foi confirmado!',
  category: 'order_confirmation',
});
```

### `updateMessageTemplate(id, updates)`
Atualiza template.

```typescript
await updateMessageTemplate('uuid', { content: 'Nova mensagem...' });
```

### `deleteMessageTemplate(id)`
Exclui template.

```typescript
await deleteMessageTemplate('uuid');
```

---

## 📈 Analytics (via Services)

### `AnalyticsService.calculateMetrics(orders, products)`
Calcula métricas do dashboard.

```typescript
import { AnalyticsService } from '@/services/analytics.service';

const metrics = AnalyticsService.calculateMetrics(orders, products);

// Response:
{
  revenue: 1500.00,
  cost: 600.00,
  profit: 900.00,
  margin: 60.0,
  orders: 15,
  avgTicket: 100.00,
  pendingOrders: 3,
  preparingOrders: 2,
  deliveredOrders: 10,
}
```

### `AnalyticsService.analyzeStockDemand(orders, products, ingredients)`
Analisa estoque vs demanda.

```typescript
const analysis = AnalyticsService.analyzeStockDemand(orders, products, ingredients);

// Response: StockDemandAnalysis[]
[
  {
    ingredient: { id: 'uuid', name: 'Farinha', ... },
    stock: 10,
    demand: 5,
    reserved: 3,
    balance: 2,
    status: 'low',  // 'sufficient' | 'low' | 'critical' | 'unused'
  },
]
```

### `AnalyticsService.getChartData(orders, products, days)`
Gera dados para gráfico de revenue.

```typescript
const chartData = AnalyticsService.getChartData(orders, products, 7);

// Response: ChartDataPoint[]
[
  { date: '2026-01-07', label: '07/01', revenue: 200, cost: 80, profit: 120, orders: 3 },
  { date: '2026-01-08', label: '08/01', revenue: 150, cost: 60, profit: 90, orders: 2 },
  ...
]
```

---

## 🪝 Hooks

### `useDashboardMetrics(filters)`
Hook principal do Dashboard.

```typescript
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

function Dashboard() {
  const {
    metrics,
    stockAnalysis,
    chartData,
    productPerformance,
    isLoading,
    error,
    refetch,
  } = useDashboardMetrics({ period: '7' });

  if (isLoading) return <Skeleton />;
  
  return <MetricsCards metrics={metrics} />;
}
```

### `useStockAnalysis()`
Hook simplificado para estoque.

```typescript
const {
  stockAnalysis,
  criticalItems,
  lowItems,
  isLoading,
} = useStockAnalysis();
```

### `useRevenueChart(period)`
Hook para dados do gráfico.

```typescript
const { chartData, isLoading } = useRevenueChart('30');
```

---

## 📦 Stock Service

### `StockService.validateStock(items, products, ingredients)`
Valida se há estoque suficiente.

```typescript
import { StockService } from '@/services/stock.service';

const validation = await StockService.validateStock(
  [{ product_id: 'uuid', quantity: 2 }],
  products,
  ingredients
);

// Response:
{
  isValid: false,
  missingItems: [
    {
      id: 'uuid',
      name: 'Farinha',
      unit: 'kg',
      current: 2,
      reserved: 1,
      needed: 3,
      missing: 2,
    },
  ],
}
```

### `StockService.autoRestock(missingItems, reason?)`
Adiciona estoque automaticamente.

```typescript
const result = await StockService.autoRestock(
  validation.missingItems,
  'Reposição para pedido #0015'
);

// Response: { success: true } | { success: false, error: Error }
```

---

## 🔄 Realtime Subscriptions

### `subscribeToOrders(userId, callbacks)`
Inscreve-se para atualizações de pedidos.

```typescript
import { subscribeToOrders } from '@/lib/supabase';

const channel = subscribeToOrders(
  user.id,
  (payload) => console.log('New order:', payload),
  (payload) => console.log('Update:', payload),
  (payload) => console.log('Delete:', payload)
);

// Cleanup
channel?.unsubscribe();
```

### `subscribeToIngredientStockChanges(userId, callback)`
Inscreve-se para mudanças de estoque.

```typescript
const channel = subscribeToIngredientStockChanges(
  user.id,
  (payload) => {
    if (payload.new.stock_quantity < payload.new.min_stock_threshold) {
      showLowStockAlert(payload.new);
    }
  }
);
```

---

## 📋 Types Reference

Veja definições completas em `src/types/database.ts`:

- `Profile`
- `Ingredient`
- `Product`
- `ProductWithIngredients`
- `Customer`
- `Order`
- `OrderWithDetails`
- `OrderItem`
- `StockMovement`
- `Notification`
- `MessageTemplate`
- `InteractionLog`
- `PaymentHistory`
- `OrderStatusLog`
