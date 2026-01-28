# Relatório de Auditoria de Escalabilidade e Capacidade (Plano Grátis)

Este documento analisa a capacidade da infraestrutura atual (Vercel Hobby + Supabase Free) para suportar o crescimento do **Cozinha ao Lucro**.

## 1. Resumo Executivo: "Até onde vai o Grátis?"

Para o modelo de negócios do Cozinha ao Lucro (SaaS B2B onde o usuário mantém a aba aberta na cozinha por longos períodos), o gargalo **não será o banco de dados**, mas sim as **Conexões Realtime** e a **Política de Uso Comercial**.

*   **Estimativa de Capacidade Segura:** Entre **50 a 100 clientes ativos simultâneos** (cozinhas operando ao mesmo tempo).
*   **Primeiro Gargalo Técnico:** Limite de 200 conexões simultâneas no Supabase Realtime.
*   **Primeiro Gargalo Operacional:** Risco de "Sleep" (Pausa) do banco de dados após inatividade e Termos de Uso da Vercel.

---

## 2. Análise Detalhada dos Limites

### 2.1 Supabase (Plano Free)

O Supabase é o coração do sistema. As limitações do plano gratuito ($0/mês) são as mais críticas para sua operação *live*.

| Recurso | Limite Grátis | Impacto no Cozinha ao Lucro | Criticidade |
| :--- | :--- | :--- | :--- |
| **Banco de Dados** | 500 MB | **Médio.** Um pedido ocupa ~2KB. 500MB comportam aprox. **250.000 pedidos**. Com 100 clientes fazendo 20 pedidos/dia, o banco enche em cerca de 4-5 meses. | 🟡 Atenção em 6 meses |
| **Realtime (Conexões)** | 200 Simultâneas | **Alto.** Se cada cliente tiver 1 computador no balcão e 1 tablet na cozinha, você suporta apenas **100 clientes ativos**. | 🔴 Gargalo Imediato |
| **Egress (Saída de Dados)** | 2 GB / mês | **Baixo/Médio.** Se otimizar imagens, dura muito. Apenas dados de texto (JSON) consomem pouco. | 🟢 Seguro |
| **Auth (MAU)** | 50.000 Usuários | **Baixo.** Para um B2B, chegar a 50k usuários ativos mensais demora muito. | 🟢 Seguro |
| **Pausa de Projeto** | 1 Semana Inativo | **Crítico.** Se ninguém usar o app por uma semana, o Supabase "desliga" o banco. O primeiro acesso demora ~30s para acordar. | 🔴 Risco de UX |

### 2.2 Vercel (Plano Hobby)

A Vercel hospeda o Frontend. O plano Hobby é excelente tecnicamente, mas restritivo contratualmente.

| Recurso | Limite Grátis | Impacto | Criticidade |
| :--- | :--- | :--- | :--- |
| **Uso Comercial** | **Proibido** | A Vercel **proíbe explicitamente** o uso do plano Hobby para sites que geram lucro direto (SaaS pago). Eles podem suspender a conta sem aviso se detectarem escala comercial. | 🔴 Risco Legal/Ops |
| **Bandwidth** | 100 GB | Suficiente para milhares de acessos mensais. A maior parte do tráfego pesado (imagens/banco) vai direto pro Supabase, não passa pela Vercel. | 🟢 Seguro |
| **Serverless Functions** | 10s Timeout | Se você migrar lógicas complexas para o backend (API Routes), pode ter problemas de timeout. Como é SPA, impacta pouco agora. | 🟢 Seguro |

---

## 3. Cenário de Ruptura (Onde quebra?)

Imagine que você atingiu **150 Clientes Pagantes**.

1.  **Cenário Realtime:** É sexta-feira à noite. 120 cozinhas estão abertas. Cada uma tem o painel aberto no PC (Balcão) e no Celular (Cozinheiro).
    *   *Total de conexões:* 240.
    *   *Resultado:* O limite de 200 é estourado. As cozinhas #101 em diante **não recebem pedidos em tempo real**. Elas precisam dar F5 na página. Isso gera reclamações de "O sistema não tocou".

2.  **Cenário Armazenamento:** Seus clientes estão adorando e inserindo fotos em todos os produtos.
    *   Se cada cliente tem 20 produtos com fotos de 500KB (não otimizadas).
    *   150 clientes x 20 produtos x 0.5MB = 1.5GB de Storage.
    *   *Resultado:* O limite de 1GB do plano Free do Supabase Storage é atingido. Uploads começam a falhar.

## 4. Recomendações de Crescimento

### Fase 1: Até 50 Clientes (Custo: R$ 0)
*   Mantenha a infraestrutura atual.
*   **Ação:** Otimize imagens antes do upload (reduza para max 100KB).
*   **Ação:** Remova logs excessivos para economizar banda.

### Fase 2: De 50 a 500 Clientes (Custo: ~$50 USD/mês)
*   **Upgrade Supabase ($25/mês):** Remove o limite de conexões realtime (vai par 500+) e aumenta banco para 8GB. Remove o risco de pausa.
*   **Upgrade Vercel ($20/mês):** Migre para o plano Pro para ficar em conformidade com os termos comerciais e garantir suporte.

### Fase 3: Otimização de Arquitetura (Long Term)
*   Se o Realtime virar um gargalo de custo (o Supabase cobra caro por muitas conexões), implemente uma lógica de "Polling Inteligente" (buscar pedidos a cada 30s) em vez de manter Websocket aberto 100% do tempo para usuários inativos.
