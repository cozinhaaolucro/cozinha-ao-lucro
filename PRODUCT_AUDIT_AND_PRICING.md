# Auditoria de Funcionalidades & Estratégia de Precificação

Este documento mapeia as funcionalidades atuais do **Cozinha ao Lucro** contra as dores reais do usuário e define a estratégia de segregação de recursos para o modelo de precificação solicitado.

---

## 1. Auditoria Funcional x Dores do Cliente

Aqui analisamos **por que** o usuário usaria cada módulo existente no código.

### 🍎 Gestão de Produtos & Fichas Técnicas (Módulo `Produtos`)
*   **A Funcionalidade:** Cadastro de ingredientes, cálculo automático de custo por receita e definição de preço de venda baseada na margem.
*   **A Dor do Cliente:** "Eu vendo meus doces, mas no final do mês não sobra dinheiro. Não sei se estou cobrando o preço certo ou tendo prejuízo."
*   **Valor Entregue:** Segurança no preço. O usuário dorme tranquilo sabendo que cada venda gera lucro real.

### 📋 Gestão de Pedidos & Kanban (Módulo `Pedidos`)
*   **A Funcionalidade:** Quadro visual (A Fazer, Produzindo, Pronto), controle de datas de entrega.
*   **A Dor do Cliente:** "Anoto tudo no caderno e no WhatsApp. Às vezes perco o pedido, esqueço de entregar ou entrego atrasado. Minha cozinha é uma bagunça."
*   **Valor Entregue:** Organização mental e operacional. Fim dos pedidos esquecidos.

### 📉 Dashboard Financeiro & Metas (Módulo `Dashboard`)
*   **A Funcionalidade:** Gráficos de receita vs. custo, "Onde vai seu dinheiro", Meta de vendas gamificada.
*   **A Dor do Cliente:** "Trabalho muito mas não vejo a cor do dinheiro. Tenho a sensação de estar patinando."
*   **Valor Entregue:** Clareza e Motivação. O usuário vê o progresso e sabe onde cortar custos.

### 🛒 Lista de Compras Inteligente (Módulo `SmartList`)
*   **A Funcionalidade:** Gera a lista de compras baseada *apenas* no que falta para os pedidos agendados.
*   **A Dor do Cliente:** "Vou no mercado, gasto mais do que devia e chego em casa faltando leite condensado. Tenho que voltar correndo e perco tempo."
*   **Valor Entregue:** Economia de tempo e dinheiro (evita estoque parado e viagens desnecessárias).

### 📱 Cardápio Digital (Módulo `PublicMenu`)
*   **A Funcionalidade:** Link público para o cliente final fazer pedidos.
*   **A Dor do Cliente:** "Passo o dia inteiro respondendo 'quanto custa?' no WhatsApp em vez de estar na cozinha produzindo."
*   **Valor Entregue:** Automação de vendas. O cliente se "autoatende".

### 📦 Controle de Estoque (Módulo `Estoque`/Back-end)
*   **A Funcionalidade:** Abatimento automático de ingredientes ao concluir pedidos.
*   **A Dor do Cliente:** "Aceitei uma encomenda grande e na hora de fazer percebi que não tinha embalagem."
*   **Valor Entregue:** Previsibilidade. Evita furos na produção.

---

## 2. Estratégia de Precificação: Limites de Uso (Usage-Based)

A estratégia definida é a **Paridade de Funcionalidades, Diferenciação por Volume**. Ambos os planos acessam **todas** as ferramentas (inclusive Cardápio Digital e I.A.), mas o plano de entrada é limitado para pequenos negócios.

Isso simplifica o desenvolvimento (não precisamos esconder botões) e foca na **escala** do cliente.

### 🥉 Plano INICIAL: "Começando"
**Valor:** R$ 39,90 / mês
**Público:** Quem está validando o negócio ou tem volume baixo.

*   ✅ **Acesso a TUDO** (Cardápio, Estoque, Financeiro).
*   ⚠️ **Limites Operacionais Mensais:**
    *   Até **200 Pedidos** / mês.
    *   Até **20 Produtos** no Cardápio.
    *   Até **150 Clientes** no cadastro.
*   *Racional:* Suficiente para quem fatura até ~R$ 3k/mês. Se passar disso, R$ 79 não será problema.

### 🥇 Plano ILIMITADO: "Sem Barreiras"
**Valor:** R$ 79,90 / mês
**Público:** Quem já opera profissionalmente e não quer se preocupar com contagem.

*   ✅ **Acesso a TUDO**.
*   ♾️ **Operações ILIMITADAS:**
    *   Pedidos infinitos.
    *   Produtos infinitos.
    *   Clientes infinitos.
*   ✨ **Suporte Prioritário**.

### 🛠️ Impacto na Engenharia (Metered Billing)
Essa abordagem é mais simples que "Features Bloqueadas", mas exige contadores.

1.  **Backend:** Precisamos de *Triggers* ou *Counts* no banco que verifiquem antes de inserir:
    *   `BEFORE INSERT ON orders -> IF count > 50 AND plan == 'basic' -> RAISE EXCEPTION`.
2.  **Frontend:** Avisos visuais de consumo: "Você usou 45/50 pedidos este mês. Faça upgrade para continuar vendendo."
3.  **Vantagem:** O cliente vê valor imediato. Ele bloqueia porque **vendeu muito** (sucesso), não porque a ferramenta é "capada". O upgrade é celebrado, não sentido como uma "taxa extra".
