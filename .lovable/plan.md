## LP3 — Quiz Funnel Page (`/lp3`)

A gamified, multi-step quiz landing page that guides the visitor through micro-pages, builds engagement, and delivers a personalized CTA at the end.

### Flow Structure

```text
[Welcome Screen] → [Q1] → [Q2] → [Q3] → [Q4] → [Q5] → [Result Screen]
     0%             17%    33%    50%    67%    83%        100%
```

**7 steps total**: 1 intro + 5 questions + 1 result/offer page.

### UX & Visual Design

- **Dark theme** (consistent with LP2), Montserrat font
- **Top progress bar** — animated, fills as user advances (color gradient blue→green)
- **Step counter** — "Pergunta 2 de 5"
- **Micro-page transitions** — smooth fade/slide between steps
- **Gamification elements**: checkmark animations on answer selection, progress percentage display, encouraging micro-copy between steps ("Ótima escolha!", "Quase lá!")
- **Escale white logo** at top of every step
- **No back button** (intentional — keeps forward momentum)

### Quiz Content (5 Questions)

Each question has 3-4 options. Selecting an option auto-advances after a brief animation (500ms).

1. "Qual o maior desafio da sua empresa hoje?" — Gerar leads / Converter vendas / Organizar processos / Comunicar melhor
2. "Sua empresa tem um plano comercial estruturado?" — Sim / Mais ou menos / Não
3. "Você já investiu em tráfego pago?" — Sim, com resultados / Sim, sem resultados / Nunca investi
4. "Sua empresa tem um CRM?" — Sim / Não / Nem sei o que é  
5. Qual seu faturamento? - crie 10 faixas a partir de 20k mensal
  6. "Quanto você estaria disposto a investir para estruturar tudo isso?" — Até R$5k / R$5k-10k / Acima de R$10k

### Result Screen

- Animated "calculating result" loader (2s fake delay for engagement)
- Personalized headline based on answers (e.g., "Sua empresa precisa urgentemente de estrutura comercial")
- Score/diagnosis visual (circular progress or rating)
- Reveal of the Super Pacote Escale as the solution
- Price, benefits summary, pulsing WhatsApp CTA
- Social proof toast (reuse from LP2)

### Technical Implementation

1. **Create `src/pages/LP3.tsx**` — Single-file component with:
  - State machine: `step` (0-6), `answers` array
  - `Progress` bar at top using the existing `progress.tsx` component
  - Each step rendered conditionally with CSS transitions
  - Answer cards as clickable tiles with hover/selected states
  - Result logic mapping answers to a "diagnosis" message
  - WhatsApp CTA link + social proof toast (same pattern as LP2)
2. **Update `src/App.tsx**` — Add route `/lp3` pointing to `LP3` component