# Estratégia de Testes Automatizados (E2E)

Este documento explica como garantimos a qualidade do **Cozinha ao Lucro** através de testes automatizados que simulam o comportamento real dos seus usuários.

## O que são testes E2E (End-to-End)?

Diferente de testes unitários (que testam uma única função isolada), os testes **E2E (Ponta-a-Ponta)** testam o sistema inteiro funcionando junto.

Imagine um robô que:
1.  Abre o navegador (Chrome).
2.  Acessa `cozinhaaolucro.com.br`.
3.  Digita o login e senha.
4.  Clica em "Criar Pedido".
5.  Verifica se o saldo do estoque diminuiu.

Se o robô conseguir fazer tudo isso sem erro, sabemos que **Banco de Dados**, **API**, **Frontend** e **Regras de Negócio** estão todos conversando perfeitamente.

## Nossa Cobertura de Testes

Estamos implementando testes para cobrir 100% dos fluxos críticos do seu negócio:

### 1. Autenticação e Segurança 🔐
*   **Cenário:** Usuário consegue fazer Login?
*   **Cenário:** Usuário consegue recuperar senha?
*   **Cenário:** Usuário não autenticado é bloqueado de ver o Dashboard?

### 2. Fluxo de Pedidos (O Coração do App) 📋
*   **Cenário Crítico:** Criar um pedido -> Mover para "Em Produção" -> Verificar se o estoque dos ingredientes foi baixado automaticamente.
*   **Cenário:** Duplicar um pedido existente e garantir que o estoque seja validado novamente.

### 3. Gestão de Produtos e Fichas Técnicas 🍰
*   **Cenário:** Criar um produto "Bolo de Cenoura".
*   **Cenário:** Adicionar ingredientes (Cenoura, Trigo, Ovo).
*   **Validação:** O sistema calculou o custo total corretamente baseado no preço dos ingredientes?

### 4. Inteligência de Estoque (SmartList) 🛒
*   **Cenário:** Tenho 3 pedidos de "Bolo" para sexta-feira. Não tenho ovo suficiente.
*   **Validação:** A "Lista Inteligente" gerou automaticamente uma compra de "30 Ovos"?

## Como rodar os testes

Você pode executar os testes a qualquer momento para verificar a saúde do projeto.

No seu terminal, rode:

```bash
npm run test:e2e
```

Isso abrirá um relatório HTML mostrando quais funcionalidades passaram e quais falharam (se houver bugs).

---

**Tecnologia Utilizada:** [Playwright](https://playwright.dev/) - A ferramenta mais moderna e confiável para testes de navegador atualmente.
