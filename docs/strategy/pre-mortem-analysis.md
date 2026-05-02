# Pre-Mortem Analysis: Por Que o IBNR Fracassou

> Exercicio de prospective hindsight — Outubro 2026
> "Imagine que o projeto morreu. O que aconteceu?"

---

## Resumo Executivo: As 5 Causas de Morte Mais Provaveis

| # | Causa | Probabilidade | Impacto | Risco |
|---|-------|--------------|---------|-------|
| 1 | **Fator de onibus = 1** (Felipe depende 100% do Claude para manter o sistema) | 5/5 | 5/5 | **25** |
| 2 | **Zero instrutores ativos pagantes** (chicken-and-egg: sem instrutores nao ha leads, sem leads nao ha instrutores) | 4/5 | 5/5 | **20** |
| 3 | **LGPD viola dados de saude** (quiz coleta dados respiratorios sem consentimento explicito nem base legal adequada) | 3/5 | 5/5 | **15** |
| 4 | **Feature factory sem validacao de mercado** (18 features construidas sem 1 instrutor real usando) | 4/5 | 4/5 | **16** |
| 5 | **Burnout do founder** (Felipe tenta ser CEO + PM + QA + Support sozinho) | 4/5 | 4/5 | **16** |

---

## 1. FALHAS DE PRODUTO

### 1.1 Feature Factory Sem Validacao de Mercado
**O cenario:** Felipe construiu 18 features (dashboard, analytics, CRM, onboarding, white-label, API externa, notificacoes real-time, Stories experience) sem ter 1 unico instrutor pagante usando o sistema em producao. Em outubro 2026, descobre que instrutores queriam algo muito mais simples: um link de WhatsApp com o resultado do quiz.

**Probabilidade:** 4/5 — Este e o risco mais insidioso. O sistema esta sofisticado demais para o estagio do negocio.
**Impacto:** 4/5 — Meses de dev desperdicados.
**Prevencao:** Colocar 3 instrutores reais para usar o quiz ESTA SEMANA. Observar o que eles realmente fazem (nao o que dizem que fariam). Pivotar baseado em evidencia real.

### 1.2 Stories Experience Afasta Publico-Alvo
**O cenario:** O publico-alvo do quiz sao pessoas com ansiedade, insonia, estresse — muitas com 40-60 anos. A experiencia Stories (swipe, fullscreen, auto-advance) e familiar para Gen Z mas confusa para o publico mais velho. Taxa de abandono no card 3 chega a 70%.

**Probabilidade:** 3/5 — Depende do perfil demografico real dos prospects.
**Impacto:** 3/5 — Pode ser revertido para o layout legacy.
**Prevencao:** A/B test: 50% dos usuarios veem Stories, 50% veem resultado classico. Medir completion rate por faixa etaria.

### 1.3 Pratica Guiada de 60s Nao Funciona Para Todos
**O cenario:** O YouTube Short de pratica respiratoria nao gera "momento aha" porque: (a) a pessoa esta no onibus e nao pode fechar os olhos, (b) o celular esta no silencioso e nao ha feedback auditivo, (c) 60 segundos e pouco para sentir diferenca em alguem com disfuncao severa.

**Probabilidade:** 3/5 — Funciona para alguns, nao para todos.
**Impacto:** 2/5 — Quem pula a pratica ainda ve o resultado.
**Prevencao:** Oferecer a pratica como OPCAO, nunca obrigatoria (ja tem botao "Pular"). Coletar dados: qual % faz a pratica vs pula? Qual converte melhor?

---

## 2. FALHAS DE MERCADO

### 2.1 Mercado de Breathwork no Brasil Ainda e Nicho
**O cenario:** Apesar do crescimento global, breathwork no Brasil em 2026 ainda e dominado por yoga e meditacao. "Neurociencia Respiratoria" e um conceito que o mercado nao entende. Instrutores potenciais preferem se posicionar como "coach de meditacao" do que "especialista em respiracao funcional".

**Probabilidade:** 3/5 — O mercado esta crescendo mas ainda e pequeno.
**Impacto:** 4/5 — Limita o pool de instrutores e prospects.
**Prevencao:** Posicionar o quiz como ferramenta de "avaliacao de ansiedade" (demanda enorme) que REVELA o papel da respiracao (educativo). O gancho e ansiedade, nao respiracao.

### 2.2 Concorrente Copia o Quiz em 1 Semana
**O cenario:** Um competidor com base de instrutores maior (ex: plataforma de yoga, app de meditacao, ou influenciador de saude) ve o quiz do IBNR e cria uma versao propria. Como o quiz e publico (HTML/JS, codigo visivel no navegador), a copia e trivial.

**Probabilidade:** 3/5 — Se o quiz tiver tracoes, sera copiado.
**Impacto:** 3/5 — A copia nao tem o dashboard/CRM/tracking.
**Prevencao:** A defesa nao e o quiz — e o ECOSSISTEMA (dashboard + links traceaveis + CRM + formacao). Criar barreiras de switching: quanto mais leads o instrutor acumula, mais caro e sair.

### 2.3 Instrutores Nao Sao Tecnicos o Suficiente
**O cenario:** Fisioterapeutas e terapeutas de 45-55 anos nao conseguem configurar slug, entender o dashboard, ou interpretar analytics. O onboarding de 4 steps nao e suficiente. Eles precisam de um humano guiando.

**Probabilidade:** 4/5 — Felipe mesmo disse que e "nao programador" e precisa de guia visual.
**Impacto:** 3/5 — Limita adocao mas nao mata se o suporte for bom.
**Prevencao:** White-glove onboarding: Felipe pessoalmente configura os primeiros 10 instrutores. Criar tutorial em video (nao texto). Simplificar o dashboard para 3 metricas, nao 15.

---

## 3. FALHAS DE MODELO DE NEGOCIO

### 3.1 Chicken-and-Egg: Sem Instrutores, Sem Leads
**O cenario:** Felipe nao consegue atrair instrutores porque nao tem case de sucesso. Nao tem case porque nao tem instrutores gerando leads. O sistema fica ocioso por 3 meses. Felipe desanima.

**Probabilidade:** 4/5 — Este e o risco #1 de startups de marketplace.
**Impacto:** 5/5 — Sem instrutores, o projeto e um quiz sem dono.
**Prevencao:**
1. Felipe deve ser o PRIMEIRO instrutor — usar o quiz com seus proprios pacientes/alunos
2. Dar acesso gratuito para 5-10 instrutores AMIGOS por 90 dias
3. Documentar os resultados e criar case studies
4. So cobrar a partir do instrutor #20

### 3.2 LTV do Instrutor Nao Justifica o CAC
**O cenario:** Um instrutor paga R$100/mes e cancela apos 3 meses (LTV = R$300). O custo para adquirir esse instrutor (ads, conteudo, suporte, onboarding) e R$500. Unit economics negativa. Quanto mais cresce, mais perde.

**Probabilidade:** 3/5 — Depende do preco e da retencao.
**Impacto:** 5/5 — Unit economics negativa = morte certa.
**Prevencao:** Medir TUDO: CAC real, churn mensal, motivos de cancelamento. Comecar com plano anual (reduz churn). Oferecer tier gratuito limitado (10 leads/mes) para reduzir CAC.

### 3.3 Instrutor Pega os Leads e Sai
**O cenario:** Instrutor usa o IBNR por 2 meses, captura 50 leads, exporta o CSV, e cancela a assinatura. Continua atendendo os pacientes sem a plataforma. O valor do IBNR acaba quando o instrutor tem leads suficientes.

**Probabilidade:** 4/5 — Export CSV esta implementado. E uma feature que facilita o churn.
**Impacto:** 3/5 — Normal em SaaS, mitigavel.
**Prevencao:** O valor deve ser CONTINU — nao pontual. Features que so funcionam dentro da plataforma: analytics ao longo do tempo, comparativo antes/depois entre sessoes, follow-up automatizado. O instrutor precisa do IBNR para MANTER o relacionamento, nao so para CAPTAR.

---

## 4. FALHAS TECNICAS

### 4.1 Fator de Onibus = 1 (Sem Mantenedor)
**O cenario:** Todo o sistema foi construido por Claude Code numa unica sessao. Felipe nao programa. Se algo quebrar (Supabase muda uma API, Vercel atualiza o Next.js, o YouTube muda o embed), ninguem sabe consertar. O site fica fora do ar por 2 semanas. Instrutores perdem confianca.

**Probabilidade:** 5/5 — E praticamente certo que algo vai quebrar.
**Impacto:** 5/5 — Sem dev = sistema morto.
**Prevencao:**
1. Contratar um dev junior (freelancer) para manutenção basica (~R$2-3k/mes)
2. Documentacao tecnica JA EXISTE (auth-architecture.md, design-system.md, 7 QA reports) — facilita onboarding
3. Manter acesso ao Claude Code para emergencias
4. Testes automatizados para os fluxos criticos (ainda nao existem)

### 4.2 LGPD e Dados de Saude
**O cenario:** O quiz coleta nome, email, WhatsApp, respostas sobre respiracao (dados de saude), score de disfuncao, e agora wellbeing mental. Dados de saude sao DADOS SENSIVEIS na LGPD (Art. 11). O tratamento exige: (a) consentimento explicito e especifico, (b) base legal adequada, (c) medidas de seguranca reforcadas. Nada disso esta implementado. Um paciente reclama na ANPD. Multa de ate 2% do faturamento.

**Probabilidade:** 3/5 — ANPD esta cada vez mais ativa no Brasil.
**Impacto:** 5/5 — Multa + dano reputacional = pode matar.
**Prevencao:**
1. Adicionar checkbox de consentimento EXPLICITO no quiz (nao apenas "seus dados estao seguros")
2. Criar Politica de Privacidade especifica para dados de saude
3. Implementar direito de exclusao (LGPD Art. 18)
4. Consultar advogado especialista em LGPD para saude — URGENTE

### 4.3 Supabase Keys Expostas no Frontend
**O cenario:** A anon key do Supabase esta hardcoded no `app.js` (linha 22-23). Embora seja uma anon key (limitada por RLS), um atacante determinado pode: (a) fazer scraping de todas as respostas publicas, (b) inserir leads falsos em massa, (c) abusar das RPCs publicas. O rate limiting e in-memory e reseta em cada cold start.

**Probabilidade:** 2/5 — Risco baixo ate o projeto ter visibilidade.
**Impacto:** 3/5 — Dados comprometidos, leads falsos poluindo dashboard.
**Prevencao:** Mover TODA a comunicacao com Supabase para o backend (ja comecou com /api/quiz/submit). Remover a anon key do frontend quando possivel. Implementar rate limiting persistente (Upstash Redis) quando escalar.

### 4.4 Quiz Vanilla JS Vira Divida Tecnica
**O cenario:** `app.js` tem 2.800 linhas de JavaScript vanilla sem testes, sem tipagem, sem modulos. Cada nova feature (Stories, wellbeing, qualification) adiciona centenas de linhas. Em 6 meses, ninguem consegue alterar o quiz sem quebrar algo.

**Probabilidade:** 4/5 — Ja esta acontecendo (BUG-01 e BUG-02 foram bugs sutis de integracao).
**Impacto:** 3/5 — Lentidao de desenvolvimento, bugs em producao.
**Prevencao:** Considerar migrar o quiz para o Next.js (dentro do /admin) num horizonte de 3-6 meses. Isso traria: tipagem TypeScript, componentes React, testes com Jest/Vitest, e build otimizado. Mas NAO e urgente — funciona como esta para o MVP.

---

## 5. FALHAS OPERACIONAIS

### 5.1 Suporte ao Instrutor Inexistente
**O cenario:** Instrutor configura o slug errado. Quiz nao mostra resultado. Lead nao aparece no dashboard. Quem ele liga? Felipe esta ocupado gravando conteudo. Nao ha helpdesk, nao ha FAQ, nao ha chatbot de suporte.

**Probabilidade:** 4/5 — Instrutores terao problemas.
**Impacto:** 3/5 — Churn por frustacao.
**Prevencao:** Criar FAQ/base de conhecimento (10 artigos resolvem 80% dos problemas). Grupo de WhatsApp exclusivo para instrutores. Video-tutorial de onboarding de 5 minutos.

### 5.2 Ninguem Aplica as Migrations
**O cenario:** Ha 20 migrations SQL (011-020) que precisam ser aplicadas no Supabase de producao. Felipe nao sabe fazer. As migrations ficam no repositorio, nao aplicadas. Features novas quebram porque o banco nao tem as colunas/funcoes esperadas.

**Probabilidade:** 4/5 — Felipe ja demonstrou nao saber o que e "PATCH".
**Impacto:** 4/5 — Features inteiras nao funcionam.
**Prevencao:** Aplicar TODAS as 20 migrations AGORA, num unico bloco. Documentar o processo com screenshots. Considerar Supabase CLI com `supabase db push` automatizado via CI/CD.

---

## 6. FALHAS DE CRESCIMENTO

### 6.1 Sem Canal de Aquisicao de Instrutores
**O cenario:** Felipe tem o produto mas nao tem go-to-market. Como instrutores descobrem o IBNR? Se a resposta for "marketing de conteudo" ou "indicacao", o crescimento sera de 1-2 instrutores/mes. Insuficiente para sustentabilidade.

**Probabilidade:** 4/5 — Construir produto e mais facil que vender.
**Impacto:** 4/5 — Sem crescimento = morte lenta.
**Prevencao:**
1. Definir UM canal de aquisicao e dominar (sugestao: parcerias com cursos de formacao em terapias)
2. Criar programa de certificacao IBNR (instrutor precisa do quiz para se certificar)
3. Workshop gratuito mensal mostrando o sistema ao vivo
4. Affiliate/referral: instrutor ganha % quando indica outro

### 6.2 Quiz Gratuito Canibaliza Revenue
**O cenario:** O quiz e gratuito e da resultado completo sem nenhuma restricao. O prospect recebe o diagnostico, entende seu problema, pesquisa "exercicios de respiracao" no YouTube, e resolve sozinho. O instrutor nunca e procurado.

**Probabilidade:** 3/5 — Depende de quao acionavel e o resultado.
**Impacto:** 3/5 — Reduz conversao do funil.
**Prevencao:** O resultado deve criar NECESSIDADE do instrutor, nao AUTOSSUFICIENCIA. Mostrar o problema claramente mas nao dar a solucao completa. A pratica guiada de 60s e uma "amostra", nao o tratamento. Frame: "Voce sentiu uma melhora. Agora imagine com acompanhamento diario."

---

## 7. FALHAS DO FOUNDER

### 7.1 Burnout por Fazer Tudo Sozinho
**O cenario:** Felipe e o CEO, instrutor principal, criador de conteudo, suporte tecnico, vendedor, e agora gerente de produto digital. A carga cognitiva de manter o IBNR + dar aulas + criar conteudo + vender leva ao burnout em 4 meses.

**Probabilidade:** 4/5 — Pattern classico de solo founder.
**Impacto:** 4/5 — Sem Felipe, nao ha IBNR.
**Prevencao:** Delegar pelo menos 2 funcoes: (a) suporte tecnico para um VA, (b) manutencao do codigo para um freelancer. Felipe deve focar em: conteudo + vendas + comunidade.

### 7.2 Tech Outpacing Business
**O cenario:** O sistema tem dashboard com analytics, CRM, 4 tipos de graficos, API externa com API keys, white-label, notificacoes real-time, Stories experience — mas ZERO instrutores pagantes. Felipe gastou 6 meses polindo a ferramenta em vez de vender.

**Probabilidade:** 4/5 — JA ESTA ACONTECENDO. Este e o momento de parar de construir e comecar a vender.
**Impacto:** 4/5 — Produto perfeito sem clientes = fracasso.
**Prevencao:** FREEZE de features por 90 dias. Todo o tempo de Felipe vai para: (a) usar o quiz com seus proprios alunos, (b) recrutar 5 instrutores beta, (c) coletar feedback real, (d) so voltar a construir quando tiver 5 pagantes.

---

## Matriz de Risco Visual

```
IMPACTO →   1    2    3    4    5
PROB 5 |              4.4  7.2  4.1
     4 |         2.3  3.3  1.1  3.1
       |              5.1  6.1  3.2
       |              5.2  7.1
     3 |    1.3  4.3  2.2  2.1  4.2
       |              6.2  1.2
     2 |         4.3
     1 |
```

Legenda dos numeros: Secao.Item (ex: 4.1 = Fator de onibus)

---

## Top 10 Acoes Para Prevenir o Fracasso

| # | Acao | Urgencia | Custo | Impacto |
|---|------|----------|-------|---------|
| **1** | **PARAR DE CONSTRUIR FEATURES. Comecar a vender.** | AGORA | R$0 | Existencial |
| **2** | Felipe usa o quiz com seus proprios 10 alunos esta semana | AGORA | R$0 | Validacao |
| **3** | Recrutar 5 instrutores beta (amigos/alunos) gratuitamente por 90 dias | AGORA | R$0 | Product-market fit |
| **4** | Aplicar TODAS as 20 migrations no Supabase de producao | AGORA | R$0 | Funcionalidade |
| **5** | Consultar advogado LGPD para dados de saude | 30 dias | R$1-3k | Legal |
| **6** | Contratar freelancer dev para manutencao (~R$2k/mes) | 30 dias | R$2k/mes | Sustentabilidade |
| **7** | Criar 3 video-tutoriais de onboarding para instrutores (5min cada) | 30 dias | R$0 | Adocao |
| **8** | Definir UM canal de aquisicao de instrutores e executar | 60 dias | Variavel | Crescimento |
| **9** | A/B test: Stories vs resultado classico | 60 dias | R$0 | Conversao |
| **10** | Grupo WhatsApp de instrutores para suporte mutuo | 7 dias | R$0 | Retencao |

---

## A Unica Coisa

> Se Felipe pudesse fazer APENAS UMA COISA nos proximos 30 dias:

### **Usar o quiz com 10 pessoas reais e observar o que acontece.**

Nao em ambiente de teste. Nao pedindo feedback a amigos. Fazer 10 pessoas REAIS (pacientes, alunos, seguidores) completarem o quiz atraves do link `?ref=felipe`, verem o Stories, fazerem a pratica, e preencherem o form.

Depois, abrir o dashboard e ver os dados. Ligar para 3 dessas pessoas e perguntar:
- "O que voce achou?"
- "O resultado fez sentido?"
- "Voce faria a pratica de novo?"
- "Voce agendaria uma sessao?"

As respostas a essas 4 perguntas valem mais que 6 meses de desenvolvimento.

---

## Conclusao

O IBNR tem um produto tecnicamente excelente (nota A- na auditoria). Mas produtos excelentes morrem todos os dias por falta de clientes. O risco #1 nao e tecnico — e **construir demais e vender de menos**.

A tecnologia esta pronta. O quiz funciona. O dashboard funciona. Os links traceaveis funcionam. O Stories funciona. A pergunta nao e mais "o que falta construir?" — e **"quem vai usar isso amanha?"**

Se Felipe conseguir 5 instrutores ativos e pagantes ate janeiro 2027, o projeto sobrevive. Se nao conseguir, toda essa tecnologia sera um portfolio bonito, nao um negocio.

> "The graveyard of startups is full of beautiful products that nobody used."
