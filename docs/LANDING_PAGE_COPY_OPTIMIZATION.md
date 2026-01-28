# Otimização de Copy: Landing Page

Este documento propõe melhorias na copy (textos) da Landing Page para aumentar a conversão, baseando-se na análise de mercado e no perfil do público-alvo (confeiteiras/os autônomos).

## Estratégia Geral
Focar na transformação imediata: sair do prejuízo/amadorismo para o lucro/profissionalismo. Usar gatilhos de **Autoridade** (método validado), **Escassez** (tempo perdido) e **Prova Social**.

---

## 1. Hero Section (A Promessa)
**Arquivo:** `src/components/sections/HeroSection.tsx`

| Elemento | Texto Atual | Sugestão de Otimização | Motivo |
|---|---|---|---|
| **Headline (H1)** | "Transforme sua cozinha em um Negócio Lucrativo" | "Pare de Pagar para Trabalhar: Transforme sua Cozinha em uma Empresa Lucrativa" | Ataca a dor imediata (prejuízo desconhecido) e promete profissionalização. |
| **Subheadline** | "Controlando custos, precificando certo e eliminando desperdícios em tempo real." | "Acabe com a dúvida no preço do seu bolo. Precifique com segurança, controle seu estoque e veja a cor do dinheiro no fim do mês." | Mais coloquial e conectado com a realidade da usuária (ver a cor do dinheiro). |
| **CTA Principal** | "Testar grátis por 7 dias" | "Começar Teste Grátis Agora" | Mais ação. O "Testar" pode soar passivo. "Começar" indica início imediato. |
| **CTA Secundário** | "Ver como funciona" | "Ver o Sistema em Ação" | "Sistema" passa mais autoridade que "como funciona". |

## 2. Pain Points (A Dor)
**Arquivo:** `src/components/sections/PainPointsSection.tsx`

| Elemento | Texto Atual | Sugestão de Otimização | Motivo |
|---|---|---|---|
| **Título (H2)** | "Cansada de contar moedas no fim do mês?" | "Você ama cozinhar, mas odeia cobrar?" | Conecta com a paixão pela cozinha vs. a dificuldade financeira/vendas. |
| **Intro** | "Se você sonha em dar uma vida melhor..." | "A maioria das confeiteiras quebra por um motivo: não sabem quanto custa o próprio produto. Se você se sente assim, não é culpa sua:" | Tira a culpa da usuária e aponta o inimigo comum (falta de gestão). |
| **Bullet 1** | "Quer transformar sua habilidade..." | "Vende, vende, vende e não sobra dinheiro?" | Mais direto e doloroso. |
| **Bullet 2** | "Busca estratégias práticas..." | "Sente insegurança na hora de passar o preço para o cliente?" | Faca na ferida da insegurança. |

## 3. Benefits Section (A Solução)
**Arquivo:** `src/components/sections/BenefitsSection.tsx`

| Elemento | Texto Atual | Sugestão de Otimização | Motivo |
|---|---|---|---|
| **Título (H2)** | "Por que este método funciona para você?" | "O Fim da Planilha de Papel" | Promessa de modernização e facilidade. |
| **Card 1 (Preço)** | "Precificação Estratégica" | "Preço Certo = Lucro Certo" | Simplificação. "Estratégica" pode soar complexo. |
| **Desc 1** | "Aprenda métodos para definir preços..." | "Nossa Inteligência calcula tudo. Você só diz os ingredientes, nós dizemos o preço." | Foca no *benefício* (nós fazemos), não no *trabalho* (você aprende). |
| **Card 3 (Rotina)** | "Organizar sua Rotina" | "Cozinha Organizada, Mente Tranquila" | Benefício emocional. |

## 4. App Showcase (A Prova)
**Arquivo:** `src/components/sections/AppShowcase.tsx`

*Sugestão: Adicionar legendas nas imagens focadas no resultado.*
*   Ex: Na imagem da ficha técnica -> "Nunca mais erre o preço de um brigadeiro."
*   Ex: Na imagem do dashboard -> "Seu salário definido no começo do mês."

## 5. Pricing Section (A Oferta)
**Arquivo:** `src/components/sections/PricingSection.tsx`

| Elemento | Texto Atual | Sugestão de Otimização | Motivo |
|---|---|---|---|
| **Título (H2)** | "Planos que crescem com você" | "Invista menos que o valor de um bolo por mês" | Ancoragem de preço. O custo do sistema é irrisório perto do produto dela. |
| **Subtítulo** | "Escolha o plano ideal..." | "Se o sistema te ajudar a não errar UM pedido, ele já se pagou." | Justificativa racional implacável. |
| **Plano Pro** | "Plano PRO" | "Plano Confeiteira Profissional" | Identidade. Ela quer ser profissional. |
| **Plano Premium** | "Premium" | "Plano Gestão Total" | Passa ideia de controle absoluto. |

---

## Próximos Passos
1.  Aprovar estas alterações.
2.  Aplicar nos arquivos listados.
3.  Testar a responsividade dos novos textos (que podem ser mais longos).
