# Plano de Negócios e Estratégia de Lançamento 🚀

**Data:** 28/01/2026
**Status do Projeto:** Pronto para Lançamento (Go-Live: Amanhã)

---

## 1. Análise de Mercado e Oportunidade

### O Problema (A Dor do Cliente)
Pequenos empreendedores do ramo alimentício (especialmente confeitaria em casa) sofrem de três dores crônicas:
1.  **Precificação no "Chutômetro"**: A maioria não sabe calcular custos de ingredientes (g/ml) e acaba pagando para trabalhar.
2.  **Desorganização Total**: Pedidos anotados em cadernos, WhatsApp e post-its, gerando esquecimentos e atrasos.
3.  **Falsa Sensação de Lucro**: Misturam caixa da empresa com dinheiro pessoal e não veem a cor do dinheiro no fim do mês.

### A Solução "Cozinha ao Lucro"
Nosso aplicativo ataca diretamente essas dores com funcionalidades que **justificam o investimento** imediato:
*   **Ficha Técnica Inteligente**: Automatiza o cálculo de custo real. O usuário vê instantaneamente que estava vendendo barato demais. (Uau moment).
*   **Dashboard Visual**: Transforma a cozinha em uma "empresa" profissional com metas e gráficos.
*   **CRM Simples**: Histórico de clientes para aumentar a recorrência (LTV).

### Público-Alvo
*   **Perfil**: Confeiteiras(os) autônomos, boleiras, produtores de marmita fit, docerias de bairro.
*   **Comportamento**: Usam muito celular (Mobile First é crucial), têm pouco tempo, buscam profissionalização rápida.

---

## 2. Análise de Viabilidade

### Técnica
*   **Infraestrutura Leve**: O uso de Supabase e Vercel garante custos iniciais próximos de zero, escalando apenas conforme o número de usuários cresce.
*   **Plataforma PWA**: Não requer publicação em lojas de apps (Apple/Google) inicialmente, facilitando atualizações rápidas e contornando taxas de 30%.Acesso fácil via link e instalável na home do celular.

### Econômica
*   **Modelo de Negócio Sugerido**: Freemium ou Trial Gratuito (7 dias) -> Assinatura Mensal (SaaS).
*   **Proposta de Valor**: Se o app ajudar a não perder **um** bolo por erro de pedido ou ajustar o preço de **cinco** brigadeiros, a mensalidade já se paga.

---

## 3. Projeção: Primeiros 3 Meses (Lançamento)

Considerando o lançamento amanhã, o foco deve ser **Aquisição, Retenção e Feedback Rápido**.

### Mês 1: Validação e "Wow Moment" 🏁
**Objetivo**: Garantir que os primeiros usuários configurem seu primeiro produto corretamente e vejam o lucro real.
*   **Foco**: Onboarding sem atrito.
*   **Ação**: Campanha de lançamento focada na dor da precificação ("Você está perdendo dinheiro?").
*   **Métrica Sucesso**: 100 usuários ativos cadastrando pelo menos 3 produtos.
*   **Funcionalidade Chave**: *Ficha Técnica* e *Calculadora de Preço*.

### Mês 2: Retenção e Hábito 🔄
**Objetivo**: Transformar o uso do app em rotina diária.
*   **Foco**: Gestão de Pedidos e Controle de Estoque.
*   **Ação**: Incentivar o uso do Kanban para mover pedidos. "Dica do Especialista" diária para manter o usuário logando.
*   **Métrica Sucesso**: 30% de retenção (usuários que voltam toda semana).
*   **Funcionalidade Chave**: *Kanban de Pedidos* e *Lista de Compras*.

### Mês 3: Crescimento e Monetização 💰
**Objetivo**: Converter usuários gratuitos em assinantes e incentivar o boca-a-boca.
*   **Foco**: Relatórios Financeiros e Fidelização de Clientes (CRM).
*   **Ação**: Mostrar o gráfico de "Lucro Líquido" acumulado e sugerir que eles compartilhem seus resultados.
*   **Métrica Sucesso**: Primeiros 50 assinantes pagantes (conversão de ~5-10% da base).
*   **Funcionalidade Chave**: *Relatórios Financeiros* e *Histórico de Clientes*.

---

## 4. Checklist para o Lançamento (Amanhã)

- [ ] **Monitoramento**: Verificar logs do Supabase para erros de autenticação.
- [ ] **Atendimento**: Canal direto (WhatsApp/Email) para bugs críticos no dia 1.
- [ ] **Onboarding**: Testar se o fluxo de "Primeiro Cadastro de Produto" está liso. É o momento mais crítico.
- [ ] **Backup**: Garantir backups automáticos do banco de dados.

---
*Análise baseada na documentação técnica e funcionalidades atuais do projeto.*
