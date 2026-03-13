// ============================================
// QUIZ DATA - Teste de Ansiedade por Disfunção Respiratória
// Baseado em protocolos de Respiração Funcional
// iBreathwork - Instituto de Neurociência da Respiração
// ============================================

const QUIZ_CONFIG = {
    title: 'Teste de Ansiedade por Disfunção Respiratória',
    subtitle: 'Descubra o quanto sua respiração está contribuindo para a ansiedade que você sente no dia a dia.',
    totalQuestions: 11,
    chapters: {
        padrao: { name: 'Padrão Respiratório', icon: '🫁', questions: [0, 1, 2, 3] },
        autodeclaracao: { name: 'Seus Desafios', icon: '🎯', questions: [4] },
        sintomas: { name: 'Sintomas & Sinais', icon: '⚡', questions: [5, 6, 7, 8] },
        consciencia: { name: 'Consciência Corporal', icon: '🧘', questions: [9] },
        tolerancia: { name: 'Tolerância ao CO₂', icon: '🧪', questions: [10] }
    }
};

// ============================================
// PERGUNTAS DO QUIZ (baseadas no Ansiedesafio)
// ============================================

const QUIZ_QUESTIONS = [
    // ---- CAPÍTULO 1: PADRÃO RESPIRATÓRIO ----
    {
        id: 'mouth_breathing',
        category: 'padrao',
        chapter: 1,
        question: 'Com que frequência você percebe que respira mais pela boca do que pelo nariz durante o dia?',
        type: 'options',
        options: [
            { label: 'Sim, todos os dias', value: 'daily', score: 3 },
            { label: 'Sim, várias vezes na semana', value: 'weekly', score: 2 },
            { label: 'Raramente', value: 'rarely', score: 1 },
            { label: 'Nunca', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Respirar pela boca em repouso causa a ativação do Sistema Nervoso de Sobrevivência (SNS), aumentando os níveis de ansiedade. É um dos sinais mais claros de respiração disfuncional.',
            reference: 'American Psychological Association. (2020). Breathing Patterns and Mental Health.'
        },
        adaptiveMessage: {
            high: 'Esse é um sinal muito importante. Vamos investigar mais a fundo...',
            low: 'Ótimo indicador. Vamos ver outros aspectos da sua respiração.'
        }
    },
    {
        id: 'wake_tired',
        category: 'padrao',
        chapter: 1,
        question: 'Você acorda cansado ou agitado, sentindo que não descansou?',
        type: 'options',
        options: [
            { label: 'Sim, todos os dias', value: 'daily', score: 3 },
            { label: 'Sim, várias vezes na semana', value: 'weekly', score: 2 },
            { label: 'Raramente', value: 'rarely', score: 1 },
            { label: 'Nunca', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Acordar se sentindo cansado ou agitado pode ser causado por uma respiração irregular durante a noite, como respirar pela boca ou roncar. Isso ativa o SNS, piorando a ansiedade.',
            reference: 'National Sleep Foundation. (2019). Sleep and Anxiety.'
        },
        adaptiveMessage: {
            high: 'Isso confirma um padrão. Sua respiração noturna pode estar sabotando seu descanso.',
            low: 'Bom sinal para a qualidade do seu sono.'
        }
    },
    {
        id: 'dry_mouth',
        category: 'padrao',
        chapter: 1,
        question: 'Você costuma acordar com a boca seca?',
        type: 'options',
        options: [
            { label: 'Sim, todos os dias', value: 'daily', score: 3 },
            { label: 'Sim, várias vezes na semana', value: 'weekly', score: 2 },
            { label: 'Raramente', value: 'rarely', score: 1 },
            { label: 'Nunca', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Acordar com a boca seca indica que você respirou muito pela boca durante a noite. Isso pode ativar o SNS e está ligado a ansiedade e dificuldades de concentração.\n\nRespirar pela boca é um agravante ou até a causa de TDAH, ansiedade e pânico (Sistema Nervoso Simpático Cronicamente Ativo).',
            reference: 'Sleep Difficulties and Symptoms of Attention-deficit Hyperactivity Disorder in Children with Mouth Breathing (2021)\n\nHarvard Medical School. (2018). Mouth Breathing and Its Effects.'
        },
        adaptiveMessage: {
            high: 'Boca seca ao acordar é evidência direta de respiração oral noturna. Isso muda tudo.',
            low: 'Sua respiração noturna parece estar mais preservada.'
        }
    },
    {
        id: 'snoring',
        category: 'padrao',
        chapter: 1,
        question: 'Alguém já mencionou que você ronca ou fez som como se tivesse prendendo a respiração durante o sono?',
        type: 'options',
        options: [
            { label: 'Sim, tenho apneia do sono diagnosticada', value: 'apnea', score: 4 },
            { label: 'Sim, eu ronco', value: 'snore', score: 3 },
            { label: 'Acredito que ronco de forma leve ou ocasional', value: 'light', score: 2 },
            { label: 'Nunca me falaram que eu ronco', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Respirar pela boca pode causar ronco, ansiedade, deformação facial e, com o tempo, levar à apneia do sono.\n\nIsso atrapalha a qualidade do sono porque ativa mais o sistema nervoso que libera adrenalina (SNS).',
            reference: 'West, J.B. (2012). Respiratory Physiology: The Essentials.',
            extraNote: 'Ainda mais importante para as crianças em desenvolvimento.'
        },
        adaptiveMessage: {
            high: 'Ronco e apneia são sinais sérios de disfunção respiratória noturna.',
            low: 'Boa notícia sobre o sono. Vamos analisar outros padrões.'
        }
    },

    // ---- AUTODECLARAÇÃO ----
    {
        id: 'main_problems',
        category: 'autodeclaracao',
        chapter: 1,
        question: 'O que mais te incomoda hoje? Selecione tudo que se aplica:',
        type: 'multi_select',
        options: [
            { label: 'Ansiedade', value: 'ansiedade', icon: '😰' },
            { label: 'Insônia / Dormir mal', value: 'insonia', icon: '🌙' },
            { label: 'Estresse constante', value: 'estresse', icon: '😤' },
            { label: 'Burnout (estresse extremo)', value: 'burnout', icon: '🔥' },
            { label: 'Falta de foco', value: 'falta_foco', icon: '🎯' },
            { label: 'Dores crônicas', value: 'dores', icon: '💢' },
            { label: 'Acordar sem energia', value: 'sem_energia', icon: '🔋' },
            { label: 'Decisões impulsivas', value: 'impulsividade', icon: '⚡' },
            { label: 'Dificuldade de aprendizado', value: 'aprendizado', icon: '📚' }
        ],
        explanation: {
            text: 'Entender seus principais desafios nos ajuda a personalizar sua análise. Muitos desses problemas estão conectados a padrões respiratórios disfuncionais.',
            reference: 'Courtney, R. (2009). The functions of breathing and its dysfunctions.'
        },
        adaptiveMessage: {
            high: 'Vamos ver como esses problemas se conectam com sua respiração...',
            low: 'Vamos investigar se a respiração pode estar por trás disso...'
        }
    },

    // ---- CAPÍTULO 2: SINTOMAS & SINAIS ----
    {
        id: 'breathing_pattern',
        category: 'sintomas',
        chapter: 2,
        question: 'Quando você percebe sua respiração, ela frequentemente está:',
        type: 'options',
        options: [
            { label: 'Muito Curta, Rápida e Ofegante', value: 'very_short', score: 4 },
            { label: 'Curta e Rápida com Coração Acelerado', value: 'short_fast', score: 3 },
            { label: 'Curta e Relaxada', value: 'short_relaxed', score: 1 },
            { label: 'Sempre Tranquila, Longa e Lenta', value: 'calm', score: 0 }
        ],
        explanation: {
            text: 'Respirar rápido demais ou de forma curta, sem perceber, ativa o Sistema Nervoso Simpático (SNS), causando estresse, ansiedade, falta de foco e hiperatividade.\n\nIsso mostra que nossa respiração pode ser a causa ou o agravante da ansiedade.',
            reference: 'Nunn, J.F. (2016). Applied Respiratory Physiology.'
        },
        adaptiveMessage: {
            high: 'Respiração curta e rápida é o motor silencioso da ansiedade crônica.',
            low: 'Seu padrão respiratório consciente parece saudável.'
        }
    },
    {
        id: 'palpitations',
        category: 'sintomas',
        chapter: 2,
        question: 'Você costuma sentir palpitações, tremores ou tontura em momentos de ansiedade, que parecem relacionados à sua respiração?',
        type: 'options',
        options: [
            { label: 'Sim, com muita frequência', value: 'frequent', score: 3 },
            { label: 'Sim, às vezes', value: 'sometimes', score: 2 },
            { label: 'Raramente', value: 'rarely', score: 1 },
            { label: 'Nunca', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Sentir o coração bater rápido, tontura ou falta de ar pode ser por respirar rápido sem perceber. Isso faz com que nosso corpo tenha menos CO2, aumentando a ansiedade e a impulsividade.',
            reference: 'Severinghaus, J.W., & Lassen, N.A. (1977). Respiratory Physiology.'
        },
        adaptiveMessage: {
            high: 'Esses sintomas estão diretamente ligados ao desequilíbrio de CO2 causado pela hiperventilação.',
            low: 'Bom sinal. Seu sistema nervoso autônomo parece mais equilibrado.'
        }
    },
    {
        id: 'shortness_breath',
        category: 'sintomas',
        chapter: 2,
        question: 'Com que frequência você sente falta de ar ou fica ofegante em atividades cotidianas (subir escadas, falar muito tempo, caminhar rápido, etc.)?',
        type: 'options',
        options: [
            { label: 'Muito frequentemente (qualquer esforço me deixa ofegante)', value: 'very_frequent', score: 3 },
            { label: 'Às vezes (percebo falta de ar em atividades moderadas)', value: 'sometimes', score: 2 },
            { label: 'Raramente (só quando a atividade é bem intensa)', value: 'rarely', score: 1 },
            { label: 'Nunca (tenho boa resistência no dia a dia)', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Ficar ofegante em atividades simples indica baixa tolerância ao CO2 e padrão de hiperventilação crônica. Seu corpo está trabalhando mais do que deveria para respirar.',
            reference: 'West, J.B. (2012). Respiratory Physiology: The Essentials.'
        },
        adaptiveMessage: {
            high: 'Falta de ar em atividades leves é um sinal claro de disfunção respiratória.',
            low: 'Boa capacidade respiratória no dia a dia.'
        }
    },
    {
        id: 'sighing',
        category: 'sintomas',
        chapter: 2,
        question: "Com que frequência você suspira ou boceja para 'pegar mais ar', especialmente em momentos tensos?",
        type: 'options',
        options: [
            { label: 'Muito frequentemente', value: 'very_frequent', score: 3 },
            { label: 'Às vezes', value: 'sometimes', score: 2 },
            { label: 'Raramente', value: 'rarely', score: 1 },
            { label: 'Nunca', value: 'never', score: 0 }
        ],
        explanation: {
            text: 'Suspiros e muitos bocejos podem mostrar que você estava respirando muito rápido por muito tempo, onde o corpo está tentando compensar a falta de oxigênio.\n\nRespirar demais pode tirar até 40% do sangue do seu cérebro e diminuir 30% da quantidade de oxigênio que ele recebe, o que afeta como você se sente e pensa.',
            reference: 'West, J.B. (2012). Respiratory Physiology: The Essentials.\nSeveringhaus, J.W., & Lassen, N.A. (1977). Respiratory Physiology.'
        },
        adaptiveMessage: {
            high: 'Suspiros frequentes confirmam o padrão de hiperventilação crônica.',
            low: 'Boa regulação respiratória natural.'
        }
    },

    // ---- CAPÍTULO 3: CONSCIÊNCIA CORPORAL ----
    {
        id: 'breathing_exercise',
        category: 'consciencia',
        chapter: 3,
        question: 'Coloque uma mão acima do umbigo e a outra mão no peito.\n\nRespire.\n\nQual mão se movimenta primeiro?',
        type: 'exercise',
        exerciseInstructions: {
            step1: 'Coloque uma mão acima do umbigo e a outra mão no peito',
            step2: 'Respire normalmente',
            step3: 'Observe qual mão se movimenta primeiro'
        },
        options: [
            { label: 'A Mão do Peito', value: 'chest', score: 3 },
            { label: 'A Mão da Barriga', value: 'belly', score: 0 }
        ],
        explanation: {
            chest: {
                text: 'Quando a mão do peito se move primeiro, significa que você está usando uma respiração torácica (apical). Esse padrão ativa o Sistema Nervoso Simpático e mantém seu corpo em estado de alerta constante, alimentando a ansiedade.',
                reference: 'Chaitow, L. (2014). Recognizing and Treating Breathing Disorders.'
            },
            belly: {
                text: 'Parabéns! A respiração diafragmática (barriga primeiro) é o padrão ideal. Ela ativa o Sistema Nervoso Parassimpático, promovendo calma e relaxamento natural.',
                reference: 'Ma, X. et al. (2017). The Effect of Diaphragmatic Breathing on Attention, Negative Affect and Stress.'
            }
        },
        adaptiveMessage: {
            high: 'A respiração torácica confirma um padrão de estresse crônico no seu corpo.',
            low: 'Excelente! Respiração diafragmática é a base da saúde respiratória.'
        }
    },
    // ---- CAPÍTULO 4: TOLERÂNCIA AO CO₂ ----
    {
        id: 'stress_tolerance',
        category: 'tolerancia',
        chapter: 4,
        question: 'Teste de Tolerância ao Estresse Fisiológico',
        type: 'tolerance_test',
        instructions: {
            title: 'TESTE DE TOLERÂNCIA AO ESTRESSE',
            steps: [
                'Sente-se em uma posição confortável',
                'Respire normalmente por algumas respirações',
                'Inspire profundo PELO NARIZ',
                'Expire PELO NARIZ o mais devagar que conseguir',
                'Use o cronômetro do vídeo e depois digite seus segundos abaixo'
            ]
        },
        options: [
            { label: 'Menos de 10 segundos', value: 'under_10', score: 4, level: 'Disfuncional' },
            { label: '10 a 25 segundos', value: '10_25', score: 3, level: 'Abaixo do Saudável' },
            { label: '25 a 45 segundos', value: '25_45', score: 1, level: 'Saudável' },
            { label: 'Mais de 45 segundos', value: 'over_45', score: 0, level: 'Aprendiz do Ar' }
        ],
        explanation: {
            text: 'O tempo de expiração controlada é um dos melhores indicadores da sua tolerância ao CO2 e do nível de estresse fisiológico do seu corpo. Quanto menor o tempo, maior o estado de alerta crônico do seu sistema nervoso.',
            reference: 'Courtney, R. (2009). The functions of breathing and its dysfunctions. International Journal of Osteopathic Medicine.',
            scale: {
                under_10: { label: 'Disfuncional', color: '#DC3545' },
                '10_25': { label: 'Abaixo do Saudável', color: '#FFC107' },
                '25_45': { label: 'Saudável', color: '#4A7C59' },
                over_45: { label: 'Guardião da Presença', color: '#2D5A3D' }
            }
        },
        adaptiveMessage: {
            high: 'Esse resultado confirma que seu sistema nervoso está em estado de alerta elevado.',
            low: 'Ótima tolerância ao CO2. Seu sistema nervoso tem boa capacidade de regulação.'
        }
    }
];

// ============================================
// IA ADAPTATIVA - Mensagens baseadas no score acumulado
// ============================================

const AI_ADAPTIVE = {
    chapterTransitions: {
        1: {
            title: 'Capítulo 1 Completo',
            subtitle: 'Padrão Respiratório Básico',
            high: 'Os sinais iniciais indicam padrões que merecem atenção. Vamos aprofundar a investigação dos sintomas.',
            medium: 'Alguns pontos de atenção apareceram. Vamos ver como isso se manifesta no dia a dia.',
            low: 'Bons indicadores iniciais! Vamos analisar os sintomas para completar o quadro.'
        },
        2: {
            title: 'Capítulo 2 Completo',
            subtitle: 'Sintomas & Sinais',
            high: 'Os sintomas confirmam um padrão significativo. Agora vou pedir que você faça um exercício prático — ele vai revelar o que os números não mostram.',
            medium: 'Interessante. Alguns sintomas chamam atenção. O próximo exercício prático vai nos dar mais clareza.',
            low: 'Poucos sintomas identificados. Vamos fazer um exercício prático para confirmar.'
        },
        3: {
            title: 'Capítulo 3 Completo',
            subtitle: 'Consciência Corporal',
            high: 'A respiração torácica indica estresse crônico. Agora vamos medir a tolerância dos seus quimiorreceptores ao CO₂.',
            medium: 'Bom exercício. Agora vamos testar a sensibilidade dos seus quimiorreceptores ao CO₂.',
            low: 'Ótima consciência corporal! Vamos agora medir sua tolerância ao CO₂.'
        }
    },

    questionIntros: {
        // Dynamic intros based on accumulated score
        getIntro(questionIndex, totalScore) {
            if (questionIndex === 0) return null; // First question has no intro

            if (totalScore >= 8) {
                return [
                    'Preciso investigar mais a fundo...',
                    'Esse padrão está se confirmando...',
                    'Vamos ver outro aspecto importante...',
                    'Os dados estão revelando algo significativo...'
                ][questionIndex % 4];
            } else if (totalScore >= 4) {
                return [
                    'Vamos verificar outro ponto...',
                    'Continuando a análise...',
                    'Mais um aspecto para avaliar...',
                    'Analisando outro indicador...'
                ][questionIndex % 4];
            }
            return null;
        }
    }
};

// ============================================
// PERFIS DE RESULTADO
// ============================================

const RESULT_PROFILES = {
    functional: {
        range: [0, 7],
        title: 'Respiração Funcional',
        emoji: '🌟',
        color: '#2D5A3D',
        colorGlow: 'rgba(45, 90, 61, 0.3)',
        gradient: 'linear-gradient(135deg, #2D5A3D, #4A7C59)',
        description: 'Seu padrão respiratório está dentro dos parâmetros funcionais. A predominância da respiração nasal e poucos sintomas indicam uma boa mecânica ventilatória.',
        mainInsight: 'Seu sistema respiratório funciona bem. Com técnicas avançadas de respiração funcional, você pode potencializar performance, foco e resiliência ao estresse.',
        cta: 'Mesmo com um bom padrão, técnicas avançadas de respiração podem levar você a outro nível de performance e bem-estar.'
    },
    moderate: {
        range: [8, 15],
        title: 'Atenção Moderada',
        emoji: '⚠️',
        color: '#FFC107',
        colorGlow: 'rgba(255, 193, 7, 0.3)',
        gradient: 'linear-gradient(135deg, #FFC107, #e6a800)',
        description: 'Identifico padrões que merecem atenção. Embora não sejam críticos, esses sinais sugerem que sua respiração pode estar operando abaixo do potencial ideal, contribuindo para sintomas de ansiedade.',
        mainInsight: 'Existem oportunidades claras de melhoria. Correções no padrão respiratório podem reduzir significativamente os sintomas de ansiedade em semanas.',
        cta: 'Pequenas correções no seu padrão respiratório podem trazer mudanças significativas na energia, sono e controle da ansiedade.'
    },
    dysfunctional: {
        range: [16, 23],
        title: 'Disfunção Respiratória',
        emoji: '🔴',
        color: '#DC3545',
        colorGlow: 'rgba(220, 53, 69, 0.3)',
        gradient: 'linear-gradient(135deg, #DC3545, #c82333)',
        description: 'Seus resultados indicam um padrão respiratório disfuncional com impacto direto na sua ansiedade e qualidade de vida. A combinação de sintomas sugere hiperventilação crônica, alterando a bioquímica do seu sangue.',
        mainInsight: 'Sua respiração está diretamente alimentando o ciclo da ansiedade. A reeducação respiratória é uma das ferramentas mais poderosas para quebrar esse ciclo.',
        cta: 'Um programa estruturado de reeducação respiratória pode transformar sua relação com a ansiedade. Resultados aparecem entre 2-4 semanas.'
    },
    severe: {
        range: [24, 40],
        title: 'Disfunção Respiratória Severa',
        emoji: '🚨',
        color: '#c82333',
        colorGlow: 'rgba(200, 35, 51, 0.4)',
        gradient: 'linear-gradient(135deg, #c82333, #991b1b)',
        description: 'A análise indica múltiplos sinais de disfunção respiratória significativa. O volume de sintomas e intensidade sugerem que seu padrão respiratório está afetando seriamente sua saúde, sono e qualidade de vida.',
        mainInsight: 'Seu corpo está sinalizando claramente que precisa de atenção urgente. A boa notícia: a respiração é um dos poucos processos autônomos que podemos treinar conscientemente.',
        cta: 'A reeducação respiratória deve ser uma prioridade. Um programa personalizado pode reverter esse quadro e transformar sua qualidade de vida.'
    }
};

// ============================================
// ANÁLISE POR CATEGORIA
// ============================================

const CATEGORY_ANALYSIS = {
    padrao: {
        name: 'Padrão Respiratório',
        icon: '🫁',
        maxScore: 13,
        levels: {
            low: { max: 3, label: 'Funcional', color: '#2D5A3D' },
            medium: { max: 7, label: 'Atenção', color: '#FFC107' },
            high: { max: 13, label: 'Disfuncional', color: '#DC3545' }
        },
        insights: {
            low: 'Seu padrão respiratório básico está bom. A respiração nasal predominante protege seu sistema nervoso.',
            medium: 'Há sinais de respiração oral que podem estar ativando o Sistema Nervoso Simpático desnecessariamente.',
            high: 'O padrão de respiração oral crônica está diretamente ligado à ativação constante do sistema de estresse do seu corpo.'
        }
    },
    sintomas: {
        name: 'Sintomas Respiratórios',
        icon: '⚡',
        maxScore: 13,
        levels: {
            low: { max: 3, label: 'Controlados', color: '#2D5A3D' },
            medium: { max: 7, label: 'Moderados', color: '#FFC107' },
            high: { max: 13, label: 'Intensos', color: '#DC3545' }
        },
        insights: {
            low: 'Poucos sintomas ventilatórios. Seu corpo mantém boa regulação autônoma.',
            medium: 'Os sintomas relatados (palpitações, falta de ar, suspiros) são sinais clássicos de hiperventilação leve.',
            high: 'O conjunto de sintomas sugere hiperventilação crônica. Isso reduz o CO₂ sanguíneo, causando vasoconstrição cerebral.'
        }
    },
    consciencia: {
        name: 'Consciência Corporal',
        icon: '🧘',
        maxScore: 3,
        levels: {
            low: { max: 0, label: 'Boa', color: '#2D5A3D' },
            medium: { max: 1, label: 'Atenção', color: '#FFC107' },
            high: { max: 3, label: 'Comprometida', color: '#DC3545' }
        },
        insights: {
            low: 'Respiração diafragmática natural — padrão ideal. Sua mecânica ventilatória está preservada.',
            medium: 'Respiração diafragmática presente. Continue atento ao padrão.',
            high: 'A respiração torácica (apical) predominante indica ativação crônica do Sistema Nervoso Simpático.'
        }
    },
    tolerancia: {
        name: 'Tolerância ao CO₂',
        icon: '🧪',
        maxScore: 4,
        levels: {
            low: { max: 1, label: 'Adequada', color: '#2D5A3D' },
            medium: { max: 3, label: 'Reduzida', color: '#FFC107' },
            high: { max: 4, label: 'Baixa', color: '#DC3545' }
        },
        insights: {
            low: 'Boa tolerância ao CO₂. Seus quimiorreceptores têm sensibilidade adequada, indicando equilíbrio do sistema nervoso autônomo.',
            medium: 'Tolerância ao CO₂ reduzida. Seus quimiorreceptores estão mais sensíveis, o que pode contribuir para hiperventilação e ansiedade.',
            high: 'Baixa tolerância ao CO₂. A hipersensibilidade dos quimiorreceptores mantém seu sistema nervoso em estado de alerta elevado, alimentando o ciclo da ansiedade.'
        }
    }
};

// ============================================
// TEXTOS DA ANÁLISE ANIMADA
// ============================================

const ANALYZING_STEPS = [
    { text: 'Mapeando padrão respiratório diurno e noturno...', icon: '🫁' },
    { text: 'Analisando sintomas de disfunção ventilatória...', icon: '⚡' },
    { text: 'Processando resultados dos exercícios práticos...', icon: '🧘' },
    { text: 'Calculando nível de tolerância ao estresse...', icon: '🧠' },
    { text: 'Cruzando dados com protocolos de neurociência...', icon: '🔬' },
    { text: 'Gerando relatório personalizado com IA...', icon: '✨' }
];

// ============================================
// NEUROCIÊNCIA - Conteúdo educativo final
// ============================================

const NEUROSCIENCE_CONTENT = {
    title: 'O Que a Neurociência Diz',
    sections: [
        {
            title: 'A Respiração e o Sistema Nervoso',
            text: 'A respiração é o único processo do sistema nervoso autônomo que você pode controlar conscientemente. Isso significa que, ao reeducar seu padrão respiratório, você está literalmente reprogramando seu sistema nervoso.'
        },
        {
            title: 'O Efeito Cascata',
            text: 'Quando respiramos de forma disfuncional (pela boca, com volume excessivo, ou de forma apical), reduzimos o CO₂ sanguíneo. Isso causa vasoconstrição cerebral, reduz a liberação de O₂ nas células (efeito Bohr) e mantém o Sistema Nervoso Simpático hiperativado — gerando ansiedade, insônia e fadiga.'
        },
        {
            title: 'A Solução',
            text: 'A reeducação respiratória corrige essa cascata bioquímica na raiz. Os resultados normalmente aparecem entre 2 a 6 semanas de prática consistente, com redução significativa da ansiedade e melhora no sono, energia e foco.'
        }
    ]
};
