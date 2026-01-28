# 📉 Auditoria "Pés no Chão" (Realistic Audit 2026)

**Data:** 24/01/2026
**Status:** ⚠️ Alertas Técnicos Identificados
**Pontuação Revisada:** 84/100 (Rebaixado de 100/100)

---

Você estava certo. Focamos muito no que *brilha* (Dashboard, Stack Moderna) e ignoramos o que *sustenta* a casa. Abaixo estão os problemas reais que minha auditoria anterior mascarou.

## 1. Segurança de Tipos (A Ilusão do TypeScript)
**Problema:** O compilador está satisfeito, mas nós estamos mentindo para ele.
*   **O "Vício" do `any`:** Encontrei uso recorrente de `any` em arquivos críticos como `useOrderOperations.ts`, `database.ts` e até no recente `useOrderImport.ts`.
*   **`@ts-ignore`:** Existem supressores de erro ativos. Isso desliga a proteção do TypeScript justamente onde ela é mais necessária (ex: tipagem complexa de banco de dados).
*   **Risco:** Um refactor futuro pode quebrar a aplicação em runtime sem que o VS Code avise, pois o "contrato" de tipos foi violado.

## 2. Banco de Dados: A Bomba Relógio de Performance
**Problema:** Tabelas de junção sem Índices (Foreign Keys).
*   **Omissão:** O arquivo `20260118_add_performance_indexes.sql` indexa `user_id`, mas **ESQUECEU** de `product_ingredients`.
*   **Cenário Real:** Toda vez que o sistema calcula o custo de um prato, ele faz uma busca completa (Full Scan) na tabela de ingredientes-produtos.
*   **Impacto:** Com 50 produtos, funciona. Com 5.000 (escala real), o Dashboard vai travar.
*   **Correção Necessária:** `CREATE INDEX idx_product_ingredients_product_id ON product_ingredients(product_id);`

## 3. Acessibilidade (O App é "Mudo")
**Problema:** Exclusão de usuários que usam leitores de tela.
*   **Evidência:** Uma busca por `aria-label` retornou **zero resultados** nos componentes de UI.
*   **Consequência:** Botões como "Lixeira", "Editar" ou "Adicionar" (que são apenas ícones) são lidos como "Botão" vazio para deficientes visuais. Isso viola leis de acessibilidade digital e boas práticas básicas.

## 4. Identidade Nativa (Não é PWA)
**Problema:** O projeto não é instalável na Web.
*   **Evidência:** `index.html` não referencia nenhum `manifest.json`.
*   **Significado:** Usuários Android/iOS que acessam pelo navegador não recebem o prompt "Adicionar à Tela Inicial". Eles dependem 100% de você empacotar o app com Capacitor e publicar nas lojas, perdendo a vantagem da distribuição viral via Web (Link).

---

## 🎯 Novo Plano de Ação (Roadmap de Excelência Real)

Para recuperar a nota 100 (de verdade), precisamos limpar essa sujeira "invisível":

1.  **DB Tuning:** Criar migration para indexar chaves estrangeiras (`product_ingredients`).
2.  **Type Hardening:** Remover `any` de `useOrderOperations` e `useOrderImport`.
3.  **A11y Sprint:** Adicionar `aria-label` em todos os `<Button size="icon">`.
4.  **PWA:** Gerar `manifest.json` básico.

Quer atacar qual destes itens primeiro? Eu sugiro o **Banco de Dados (1)**, pois é o único que causará problemas de performance em curto prazo.
