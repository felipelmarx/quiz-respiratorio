# Estrategia: Quiz Funnel + Video + WhatsApp

> Documento estrategico para o IBNR — Instituto Brasileiro de Neurociencia Respiratoria

---

## 1. O Cenario Atual vs. O Futuro

### Taxas de Conversao por Formato

| Formato | Taxa de Conversao | vs Tradicional |
|---------|-------------------|----------------|
| Form tradicional (pagina unica) | 3-5% | baseline |
| Multi-step form (quiz atual IBNR) | 8-15% | +2-3x |
| Conversational/Chatbot | 12-20% | +3-4x |
| Quiz Funnel com IA | 28-45% | +6-10x |
| Video interativo (VideoAsk) | 65-98% | +15-20x |

### O Que Voce Ja Tem (Vantagens)

- Quiz cientifico de 11 perguntas com scoring 0-33
- 4 perfis de resultado (funcional → disfuncao severa)
- Sistema de links rastreáveis por instrutor (?ref=slug)
- Dashboard com analytics completo
- Supabase como backend (pronto para escalar)

---

## 2. VideoAsk — O Que E e Como Funciona

### O Que E
VideoAsk e uma plataforma da Typeform que permite criar interacoes em video onde:
- Voce grava uma pergunta em video
- O usuario responde por video, audio, texto ou botoes
- Cria uma "conversa assincrona" com sensacao de 1:1

### Duracao Ideal do Video

| Contexto | Duracao Ideal | Taxa de Conclusao |
|----------|---------------|-------------------|
| Primeiro contato (pre-quiz) | 15-30 seg | 85-95% |
| Pergunta do quiz (substituindo texto) | 20-45 seg | 75-90% |
| Video de resultado pos-quiz | 45-90 seg | 70-85% |
| Video explicativo detalhado | 90-120 seg | 50-65% |
| Acima de 2 min | NAO RECOMENDADO | < 40% |

**Regra de ouro:** Cada video individual deve ter **no maximo 60 segundos**. O total da interacao pode ser maior (ex: 5 videos de 30s = 2.5min total), porque o usuario esta engajado entre cada passo.

### Precos do VideoAsk (2025-2026)

| Plano | Preco/mes | Videos/mes | Melhor para |
|-------|-----------|------------|-------------|
| Start | Gratis | 20 interacoes | Testar |
| Grow | $24/mes | 100 interacoes | Comecar |
| Brand | $40/mes | 200 interacoes | Escalar |
| Enterprise | Sob consulta | Ilimitado | Alto volume |

### Alternativas ao VideoAsk

| Ferramenta | Preco | Vantagem | Desvantagem |
|------------|-------|----------|-------------|
| **Tolstoy** | $19/mes | Shoppable videos, branching | Foco e-commerce |
| **Loom + Typeform** | $15+$25/mes | Mais flexivel | Nao integrado |
| **Solucao customizada** | Dev time | Controle total, sem custos recorrentes | Complexidade |
| **Gravacao propria + quiz** | $0 | Sem custo mensal | Menos interativo |

### Recomendacao para IBNR

**Fase 1:** Comecar com **video gravado proprio** integrado ao quiz existente (custo zero).
**Fase 2:** Migrar para VideoAsk quando atingir 200+ leads/mes para justificar o custo.
**Fase 3:** Considerar **solucao customizada** quando escalar (voce ja tem o dev stack).

---

## 3. O Funil Combinado: Quiz + Video + WhatsApp

### Arquitetura Recomendada

```
                    TOPO DO FUNIL
                         |
    [Anuncio/Post/Indicacao do Instrutor]
                         |
                    Link ?ref=slug
                         |
                         v
    ┌─────────────────────────────────────┐
    │  ETAPA 1: VIDEO INTRO (15-30 seg)   │
    │  "Oi! Sou o Dr. Felipe..."          │
    │  "Descubra como sua respiracao       │
    │   afeta sua ansiedade"               │
    │  [BOTAO: Fazer Minha Avaliacao]      │
    └─────────────────────────────────────┘
                         |
                         v
    ┌─────────────────────────────────────┐
    │  ETAPA 2: QUIZ DIAGNOSTICO          │
    │  (o que ja existe — 11 perguntas)   │
    │  Score 0-33 → Perfil respiratorio   │
    └─────────────────────────────────────┘
                         |
                         v
    ┌─────────────────────────────────────┐
    │  ETAPA 3: VIDEO DE RESULTADO        │
    │  (45-60 seg, personalizado por      │
    │   perfil — 4 videos diferentes)     │
    │                                     │
    │  Funcional → "Parabens! Mas..."     │
    │  Atencao  → "Seus padroes indicam..." │
    │  Disfuncao → "Voce precisa de..."   │
    │  Severa  → "Isso e urgente..."      │
    │                                     │
    │  [BOTAO: Falar com Especialista]    │
    └─────────────────────────────────────┘
                         |
                         v
    ┌─────────────────────────────────────┐
    │  ETAPA 4: WHATSAPP DO INSTRUTOR     │
    │  Mensagem pre-preenchida:           │
    │  "Oi Dr.Felipe! Fiz a avaliacao     │
    │   respiratoria e meu perfil e       │
    │   [PERFIL]. Score: [X]/33.          │
    │   Gostaria de saber mais."          │
    └─────────────────────────────────────┘
                         |
                         v
    ┌─────────────────────────────────────┐
    │  ETAPA 5: CONVERSA NO WHATSAPP      │
    │  (Instrutor converte manualmente    │
    │   ou com chatbot automatizado)      │
    └─────────────────────────────────────┘
```

### Conversoes Esperadas Por Etapa

| Etapa | Acao | Taxa Esperada | De 1000 visitantes |
|-------|------|---------------|---------------------|
| 1 → 2 | Video intro → Iniciar quiz | 60-75% | 600-750 |
| 2 → 3 | Completar quiz | 70-85% | 420-638 |
| 3 → 4 | Ver resultado → Clicar WhatsApp | 25-45% | 105-287 |
| 4 → 5 | Enviar mensagem no WhatsApp | 80-90% | 84-258 |
| **Total** | **Visitante → Lead no WhatsApp** | **8-25%** | **84-258** |

**Comparativo:** Sem o funil (form tradicional), de 1000 visitantes voce converte 30-50 leads. Com o funil completo: **84-258 leads**. Isso e **3-8x mais**.

---

## 4. WhatsApp Como Canal de Conversao no Brasil

### Por Que WhatsApp

- **96% dos brasileiros** usam WhatsApp (Statista 2025)
- Taxa de abertura de mensagem: **98%** (vs 20% email)
- Taxa de resposta: **40-60%** (vs 2-5% email)
- **Canal nativo** — nao precisa ensinar o usuario a usar

### Ferramentas Para Integracao WhatsApp no Brasil

| Ferramenta | Tipo | Preco | Ideal para |
|------------|------|-------|------------|
| **Z-API** | API simples | R$60/mes | Envio automatizado basico |
| **Blip** | Plataforma completa | Sob consulta | Chatbot avancado |
| **Zenvia** | Omnichannel | A partir de R$200/mes | Escala |
| **Twilio** | API robusta | Pay-per-message | Desenvolvedores |
| **WAHA** | Self-hosted | Gratis (open source) | Controle total |
| **Link direto wa.me** | Sem API | Gratis | MVP rapido |

### Recomendacao para IBNR

**Fase 1 (agora):** Usar `wa.me` link direto com mensagem pre-preenchida (GRATIS, ja implementado no quiz).

**Fase 2 (100+ leads/mes):** Integrar Z-API para enviar mensagem automatica com resultado do quiz.

**Fase 3 (500+ leads/mes):** Chatbot no WhatsApp que:
- Recebe o resultado automaticamente
- Responde perguntas frequentes
- Agenda consulta
- Envia follow-up apos 3/7/14 dias

---

## 5. Os 4 Videos Que Voce Precisa Gravar

### Video 1: Intro (Pre-Quiz)
- **Duracao:** 15-30 segundos
- **Tom:** Acolhedor, curioso
- **Script base:**
  > "Oi! Eu sou [Nome], [profissao]. Nos proximos 5 minutos, voce vai descobrir como seus padroes respiratorios podem estar afetando sua ansiedade, seu sono e sua qualidade de vida. Sao apenas 11 perguntas simples. Vamos comecar?"
- **CTA:** Botao "Comecar Avaliacao"

### Videos 2-5: Resultado (1 por perfil)
- **Duracao:** 45-60 segundos cada
- **Tom:** Empatico + autoridade

**Perfil Funcional (Score 0-8):**
> "Parabens! Sua respiracao esta funcionando bem. Mas sabia que mesmo pessoas saudaveis podem melhorar? Com tecnicas de breathwork, voce pode otimizar seu foco, energia e qualidade de sono. Quer saber como? Clica aqui embaixo pra falar comigo."

**Perfil Atencao Moderada (Score 9-19):**
> "Sua avaliacao mostrou alguns padroes que merecem atencao. Nao e nada grave, mas se voce nao cuidar agora, pode evoluir. A boa noticia? Com as tecnicas certas, voce pode reverter isso em poucas semanas. Vamos conversar?"

**Perfil Disfuncao (Score 20-26):**
> "Seus resultados indicam disfuncao respiratoria. Isso pode estar contribuindo diretamente para sua ansiedade, insonia e estresse cronico. Eu posso te ajudar. Clica no botao e vamos conversar sobre o seu caso."

**Perfil Disfuncao Severa (Score 27-33):**
> "Sua avaliacao mostrou um quadro que precisa de atencao urgente. Padroes como os seus estao fortemente ligados a problemas de saude serios. Mas a boa noticia: breathwork pode transformar isso. Me chama agora no WhatsApp — vamos resolver isso juntos."

---

## 6. Implementacao Tecnica no IBNR

### O Que Ja Existe e Funciona
- Quiz com 11 perguntas e scoring
- 4 perfis de resultado
- Link rastreavel por instrutor (?ref=slug)
- Resultado com CTA de WhatsApp
- Dashboard para instrutor ver seus leads

### O Que Precisa Ser Construido

| Feature | Complexidade | Prioridade |
|---------|-------------|------------|
| Video intro embed na pagina de boas-vindas | Baixa | ALTA |
| 4 videos de resultado (1 por perfil) na pagina de resultado | Baixa | ALTA |
| Mensagem WhatsApp pre-preenchida com perfil + score | Ja existe! | - |
| Video player customizado (autoplay, muted, com captions) | Media | MEDIA |
| VideoAsk embed (quando escalar) | Media | FUTURA |
| WhatsApp API automatizada (Z-API/Twilio) | Alta | FUTURA |
| Chatbot WhatsApp com follow-up | Alta | FUTURA |

### Arquitetura Proposta

```
quiz-data.js (ja existe)
  ↓ adicionar:
  resultProfiles: {
    funcional: {
      videoUrl: "/videos/resultado-funcional.mp4",  // ou YouTube/Vimeo embed
      ctaText: "Quero Otimizar Minha Respiracao"
    },
    atencao_moderada: {
      videoUrl: "/videos/resultado-atencao.mp4",
      ctaText: "Quero Melhorar Meus Padroes"
    },
    ...
  }

app.js (pagina de resultado)
  ↓ adicionar:
  - Video player no topo do resultado
  - Autoplay (muted) com opcao de unmute
  - Legendas/captions para acessibilidade
  - CTA dourado abaixo do video → WhatsApp
```

---

## 7. Plano de Execucao em 3 Fases

### Fase 1: MVP Video (1-2 semanas) — CUSTO: R$0
1. Instrutor grava 5 videos no celular (1 intro + 4 resultados)
2. Upload para YouTube (unlisted) ou Vimeo
3. Embed videos na pagina de resultado do quiz (por perfil)
4. Medir: taxa de clique no WhatsApp antes vs depois do video

### Fase 2: Otimizacao (1 mes) — CUSTO: R$60-200/mes
1. Trocar YouTube por player customizado (sem distracao)
2. Adicionar video intro na pagina de boas-vindas
3. Integrar Z-API para mensagem automatica no WhatsApp
4. A/B test: com video vs sem video
5. Medir: conversao por perfil, tempo no video, drop-off

### Fase 3: Escala (2-3 meses) — CUSTO: R$200-500/mes
1. VideoAsk para interacao completa (se ROI justificar)
2. Chatbot WhatsApp com follow-up automatizado
3. Cada instrutor grava seus proprios videos (white-label)
4. Dashboard mostra metricas de video (views, completion rate)
5. Automacao: quiz → resultado → video → WhatsApp → follow-up

---

## 8. Metricas Para Acompanhar

| Metrica | Onde Medir | Meta |
|---------|-----------|------|
| Quiz completion rate | Analytics dashboard | > 75% |
| Video view rate | Player analytics | > 60% |
| Video completion rate | Player analytics | > 50% |
| Click-to-WhatsApp rate | Analytics dashboard | > 25% |
| WhatsApp message sent rate | Z-API / wa.me tracking | > 80% |
| Lead → Consulta agendada | WhatsApp / CRM | > 15% |
| **Funil completo (visita → consulta)** | **End-to-end** | **> 5%** |

---

## 9. Resumo Executivo

**O que fazer AGORA (custo zero):**
1. Gravar 5 videos no celular (15-60 seg cada)
2. Embedar na pagina de resultado do quiz
3. Medir o impacto

**Resultado esperado:**
- Conversao de 8-15% → **20-35%** (com video personalizado por perfil)
- Lead mais qualificado (viu o video, entende o problema, ja confia no profissional)
- WhatsApp como canal nativo = resposta rapida = mais agendamentos

**O quiz do IBNR ja esta na frente de 95% do mercado.** Adicionar video personalizado por perfil e o proximo passo de maior impacto com menor esforco.
