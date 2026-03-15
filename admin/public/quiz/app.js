// ============================================
// APP.JS - iBreathwork Quiz Respiratório
// Instituto de Neurociência da Respiração
// ============================================

// ---- STATE ----
let currentQuestion = 0;
let answers = {};
let scores = { padrao: 0, sintomas: 0, consciencia: 0, tolerancia: 0, autodeclaracao: 0 };
let totalScore = 0;
let userName = '';
let userEmail = '';
let userPhone = '';
let referralEmail = '';
let currentChapter = 1;
let particlesActive = true;
let showExplanations = true;
let userMainProblems = [];

// ---- SUPABASE CONFIG (plug your keys here) ----
const SUPABASE_CONFIG = {
    url: 'https://acvylqelzmpquxfvabfy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdnlscWVsem1wcXV4ZnZhYmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzcxNjksImV4cCI6MjA1MzMxMzE2OX0.9xYAgupHfzNKigetu8ENYdGmppmi3GXP0isJy3KkhwI',
    table: 'quiz_leads'
};

// ---- ANALYTICS CONFIG (plug your IDs here) ----
const ANALYTICS_CONFIG = {
    metaPixelId: '',     // e.g. '1234567890'
    ga4MeasurementId: '' // e.g. 'G-XXXXXXXXXX'
};

// ---- INSTRUCTOR URL PARAMS ----
// Each instructor gets a personalized link, e.g.:
// seusite.com/quiz/?instrutor=Dr.Felipe&cta_url=https://wa.me/5511999&cta_text=Agendar+Consulta
// seusite.com/quiz/?instrutor=Dra.Ana&cta_url=https://calendly.com/dra-ana&cta_text=Marcar+Avaliação
const INSTRUCTOR_DEFAULTS = {
    ctaUrl: '',                      // Default CTA URL (empty = no redirect)
    ctaText: 'Quero Saber Mais',     // Default button text
    instructorName: '',              // No instructor by default
};

function getInstructorConfig() {
    const params = new URLSearchParams(window.location.search);
    return {
        ctaUrl: params.get('cta_url') || INSTRUCTOR_DEFAULTS.ctaUrl,
        ctaText: params.get('cta_text') || INSTRUCTOR_DEFAULTS.ctaText,
        instructorName: params.get('instrutor') || INSTRUCTOR_DEFAULTS.instructorName,
    };
}

// ---- HAPTIC FEEDBACK ----
function haptic(style) {
    if (!navigator.vibrate) return;
    switch (style) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(25); break;
        case 'heavy': navigator.vibrate([30, 20, 50]); break;
        case 'success': navigator.vibrate([15, 50, 15, 50, 30]); break;
        default: navigator.vibrate(10);
    }
}

// ---- ANALYTICS TRACKING ----
function trackEvent(eventName, params) {
    // Google Analytics 4
    if (window.gtag && ANALYTICS_CONFIG.ga4MeasurementId) {
        gtag('event', eventName, params);
    }
    // Meta Pixel
    if (window.fbq && ANALYTICS_CONFIG.metaPixelId) {
        fbq('trackCustom', eventName, params);
    }
    // Console in dev
    console.log('[Analytics]', eventName, params);
}

// ---- SUPABASE LEAD SAVE ----
async function saveLeadToSupabase(leadData) {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.log('[Supabase] Not configured, skipping save. Lead data:', leadData);
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(leadData)
        });

        if (!response.ok) {
            console.error('[Supabase] Error saving lead:', response.status);
        } else {
            console.log('[Supabase] Lead saved successfully');
        }
    } catch (error) {
        console.error('[Supabase] Network error:', error);
    }
}

// ---- SAVE ANONYMOUS RESPONSE ----
let savedResponseId = null;

async function saveAnonymousResponse() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.log('[Supabase] Not configured, skipping anonymous save.');
        return;
    }

    const profileKey = totalScore <= 7 ? 'funcional' : totalScore <= 15 ? 'atencao_moderada' : totalScore <= 23 ? 'disfuncao' : 'disfuncao_severa';

    const responseData = {
        answers: answers,
        scores: scores,
        total_score: totalScore,
        profile: profileKey
    };

    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/quiz_responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(responseData)
        });

        if (response.ok) {
            const data = await response.json();
            savedResponseId = data[0]?.id || null;
            console.log('[Supabase] Anonymous response saved:', savedResponseId);
        } else {
            console.error('[Supabase] Error saving anonymous response:', response.status);
        }
    } catch (error) {
        console.error('[Supabase] Network error:', error);
    }
}

// ---- SAVE APPLICATION (Lead + Link to Response) ----
async function saveApplication(leadData) {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.log('[Supabase] Not configured, skipping save.');
        return;
    }

    try {
        // 1. Save lead
        const leadResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/quiz_leads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadData)
        });

        if (!leadResponse.ok) {
            console.error('[Supabase] Error saving lead:', leadResponse.status);
            return;
        }

        const leadResult = await leadResponse.json();
        const leadId = leadResult[0]?.id;
        console.log('[Supabase] Lead saved:', leadId);

        // 2. Link response to lead (if we have a saved response)
        if (savedResponseId && leadId) {
            const updateResponse = await fetch(
                `${SUPABASE_CONFIG.url}/rest/v1/quiz_responses?id=eq.${savedResponseId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_CONFIG.anonKey,
                        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        lead_id: leadId,
                        instructor_id: leadData.instructor_id || null
                    })
                }
            );

            if (updateResponse.ok) {
                console.log('[Supabase] Response linked to lead');
            } else {
                console.error('[Supabase] Error linking response:', updateResponse.status);
            }
        }
    } catch (error) {
        console.error('[Supabase] Network error:', error);
    }
}

// ---- PARTICLES ----
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let breathPhase = 0;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            baseSize: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            phase: Math.random() * Math.PI * 2
        };
    }

    for (let i = 0; i < 60; i++) {
        particles.push(createParticle());
    }

    function animate() {
        if (!particlesActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        breathPhase += 0.008;

        particles.forEach(p => {
            // Breathing effect on size
            const breathEffect = Math.sin(breathPhase + p.phase) * 0.5 + 0.5;
            p.size = p.baseSize * (0.8 + breathEffect * 0.6);

            p.x += p.speedX;
            p.y += p.speedY;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const currentOpacity = p.opacity * (0.5 + breathEffect * 0.5);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(45, 90, 61, ${currentOpacity})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// ---- SCREEN MANAGEMENT ----
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const screen = document.getElementById(screenId);
    screen.style.display = 'flex';
    if (screenId === 'result-screen') {
        screen.style.display = 'block';
    }
    requestAnimationFrame(() => {
        screen.classList.add('active');
    });
    window.scrollTo(0, 0);
}

// ---- WELCOME ----
function startQuiz() {
    haptic('medium');
    trackEvent('quiz_started', {});
    const btn = document.getElementById('start-btn');
    btn.classList.add('pulse-out');
    setTimeout(() => {
        showScreen('quiz-screen');
        showModeSelection();
    }, 300);
}

function showModeSelection() {
    const container = document.getElementById('question-container');
    container.innerHTML = `
        <div class="question-card fade-in" style="text-align: center;">
            <div class="mode-selection-icon">🧠</div>
            <h2 class="question-text">Como você prefere fazer o teste?</h2>
            <p class="mode-selection-desc">Após cada resposta, podemos mostrar uma explicação científica sobre o que aquela pergunta revela sobre sua respiração.</p>
            <div class="options-grid">
                <button class="option-card mode-option" onclick="selectMode(true)">
                    <span class="option-letter">A</span>
                    <span class="option-label">Com explicações</span>
                    <span class="mode-detail">Aprenda sobre cada aspecto da sua respiração</span>
                </button>
                <button class="option-card mode-option" onclick="selectMode(false)">
                    <span class="option-letter">B</span>
                    <span class="option-label">Apenas o diagnóstico</span>
                    <span class="mode-detail">Mais rápido — vá direto ao resultado</span>
                </button>
            </div>
        </div>
    `;
}

function selectMode(withExplanations) {
    haptic('light');
    showExplanations = withExplanations;
    trackEvent('quiz_mode_selected', { mode: withExplanations ? 'with_explanations' : 'fast' });

    document.querySelectorAll('.mode-option').forEach((btn, i) => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        if ((withExplanations && i === 0) || (!withExplanations && i === 1)) {
            btn.classList.add('selected');
        } else {
            btn.classList.add('dimmed');
        }
    });

    setTimeout(() => {
        showQuestion(0);
    }, 400);
}

// ---- PROGRESS ----
function updateProgress() {
    const total = QUIZ_QUESTIONS.length;
    const pct = Math.round((currentQuestion / total) * 100);
    const bar = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    const counter = document.getElementById('question-counter');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = pct + '%';
    if (counter) counter.textContent = `${currentQuestion + 1} de ${total}`;
}

// ---- CHAPTER TRANSITIONS ----
function showChapterTransition(chapterNum, callback) {
    const transition = AI_ADAPTIVE.chapterTransitions[chapterNum];
    if (!transition) { callback(); return; }

    const level = totalScore >= 12 ? 'high' : totalScore >= 6 ? 'medium' : 'low';
    const message = transition[level];

    const container = document.getElementById('question-container');
    container.innerHTML = `
        <div class="chapter-transition fade-in">
            <div class="chapter-badge">${transition.title}</div>
            <h2 class="chapter-subtitle">${transition.subtitle}</h2>
            <div class="chapter-divider"></div>
            <p class="chapter-message">${message}</p>
            <div class="chapter-progress-dots">
                ${[1, 2, 3, 4].map(i => `
                    <div class="chapter-dot ${i <= chapterNum ? 'completed' : i === chapterNum + 1 ? 'current' : ''}">
                        ${i <= chapterNum ? '&#10003;' : i}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    setTimeout(callback, 2500);
}

// ---- SHOW QUESTION ----
function showQuestion(index) {
    if (index >= QUIZ_QUESTIONS.length) {
        finishQuiz();
        return;
    }

    currentQuestion = index;
    updateProgress();

    const q = QUIZ_QUESTIONS[index];
    const prevQ = index > 0 ? QUIZ_QUESTIONS[index - 1] : null;

    // Check for chapter transition
    if (prevQ && prevQ.chapter !== q.chapter) {
        showChapterTransition(prevQ.chapter, () => {
            renderQuestion(q, index);
        });
        return;
    }

    renderQuestion(q, index);
}

function renderQuestion(q, index) {
    const container = document.getElementById('question-container');

    // Get adaptive intro
    const intro = AI_ADAPTIVE.questionIntros.getIntro(index, totalScore);

    if (q.type === 'exercise') {
        renderBreathingExercise(q, container);
    } else if (q.type === 'tolerance_test') {
        renderToleranceTest(q, container);
    } else if (q.type === 'multi_select') {
        renderMultiSelect(q, index, container);
    } else {
        renderStandardQuestion(q, index, container, intro);
    }
}

// ---- STANDARD QUESTION ----
function renderStandardQuestion(q, index, container, intro) {
    const letters = ['A', 'B', 'C', 'D'];
    const chapterInfo = Object.values(QUIZ_CONFIG.chapters).find(ch =>
        ch.questions.includes(index)
    );

    container.innerHTML = `
        <div class="question-card fade-in">
            ${chapterInfo ? `<div class="question-chapter-tag">${chapterInfo.icon} ${chapterInfo.name}</div>` : ''}
            ${intro ? `<p class="question-ai-intro">${intro}</p>` : ''}
            <h2 class="question-text">${q.question}</h2>
            <div class="options-grid">
                ${q.options.map((opt, i) => `
                    <button class="option-card" data-index="${i}" onclick="selectOption(${index}, ${i})">
                        <span class="option-letter">${letters[i]}</span>
                        <span class="option-label">${opt.label}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ---- MULTI SELECT (Self-declaration) ----
function renderMultiSelect(q, index, container) {
    container.innerHTML = `
        <div class="question-card fade-in">
            <div class="question-chapter-tag">🎯 Seus Desafios</div>
            <h2 class="question-text">${q.question}</h2>
            <div class="multi-select-grid">
                ${q.options.map((opt, i) => `
                    <button class="multi-select-option" data-value="${opt.value}" onclick="toggleMultiSelect(this)">
                        <span class="multi-icon">${opt.icon}</span>
                        <span class="multi-label">${opt.label}</span>
                        <span class="multi-check"></span>
                    </button>
                `).join('')}
            </div>
            <button class="btn-primary btn-glow btn-full multi-select-confirm" id="btn-confirm-multi" onclick="confirmMultiSelect(${index})">
                Continuar
                <span class="btn-arrow">&rarr;</span>
            </button>
        </div>
    `;
}

function toggleMultiSelect(btn) {
    haptic('light');
    btn.classList.toggle('active');
    const check = btn.querySelector('.multi-check');
    check.innerHTML = btn.classList.contains('active') ? '&#10003;' : '';
}

function confirmMultiSelect(qIndex) {
    const selected = document.querySelectorAll('.multi-select-option.active');
    if (selected.length === 0) {
        // Highlight that at least one must be selected
        document.querySelector('.multi-select-grid').style.outline = '2px solid #DC3545';
        document.querySelector('.multi-select-grid').style.outlineOffset = '4px';
        setTimeout(() => {
            document.querySelector('.multi-select-grid').style.outline = 'none';
        }, 1500);
        return;
    }

    haptic('medium');
    userMainProblems = Array.from(selected).map(btn => btn.dataset.value);

    const q = QUIZ_QUESTIONS[qIndex];
    answers[q.id] = userMainProblems;

    trackEvent('quiz_self_declaration', { problems: userMainProblems });

    // Disable all options
    document.querySelectorAll('.multi-select-option').forEach(btn => {
        btn.style.pointerEvents = 'none';
        if (!btn.classList.contains('active')) btn.classList.add('dimmed');
    });
    document.getElementById('btn-confirm-multi').style.display = 'none';

    if (showExplanations) {
        setTimeout(() => {
            showExplanation(q.explanation.text, q.explanation.reference, false, () => {
                showQuestion(qIndex + 1);
            });
        }, 400);
    } else {
        setTimeout(() => showQuestion(qIndex + 1), 400);
    }
}

// ---- BREATHING EXERCISE ----
function renderBreathingExercise(q, container) {
    container.innerHTML = `
        <div class="exercise-card fade-in">
            <div class="exercise-header">
                <div class="exercise-icon-pulse">
                    <div class="exercise-icon-ring"></div>
                    <div class="exercise-icon-ring delay"></div>
                    <span class="exercise-emoji">🧘</span>
                </div>
                <div class="exercise-badge">PARE POR UM MOMENTO</div>
                <h2 class="exercise-title">Exercício de Consciência Respiratória</h2>
            </div>

            <div class="exercise-steps">
                <div class="exercise-step">
                    <div class="step-number">1</div>
                    <p>Coloque uma mão acima do <strong>umbigo</strong> e a outra mão no <strong>peito</strong></p>
                </div>
                <div class="exercise-step">
                    <div class="step-number">2</div>
                    <p><strong>Respire</strong> normalmente</p>
                </div>
                <div class="exercise-step">
                    <div class="step-number">3</div>
                    <p>Observe: <strong>Qual mão se movimenta primeiro?</strong></p>
                </div>
            </div>

            <div class="breathing-animation">
                <div class="breathing-circle">
                    <div class="breathing-circle-inner">
                        <span class="breathing-text">Respire</span>
                    </div>
                </div>
            </div>

            <div class="exercise-options">
                <button class="exercise-choice" onclick="selectExerciseOption(${currentQuestion}, 0)">
                    <span class="choice-icon">🫁</span>
                    <span class="choice-label">A Mão do Peito</span>
                    <span class="choice-desc">Moveu primeiro</span>
                </button>
                <button class="exercise-choice" onclick="selectExerciseOption(${currentQuestion}, 1)">
                    <span class="choice-icon">🧘</span>
                    <span class="choice-label">A Mão da Barriga</span>
                    <span class="choice-desc">Moveu primeiro</span>
                </button>
            </div>
        </div>
    `;

    // Animate breathing circle
    startBreathingAnimation();
}

function startBreathingAnimation() {
    const circle = document.querySelector('.breathing-circle');
    const text = document.querySelector('.breathing-text');
    if (!circle || !text) return;

    let phase = 'inhale';
    function breathCycle() {
        if (!document.querySelector('.breathing-circle')) return;

        if (phase === 'inhale') {
            circle.classList.add('expand');
            circle.classList.remove('contract');
            text.textContent = 'Inspire...';
            phase = 'exhale';
            setTimeout(breathCycle, 4000);
        } else {
            circle.classList.add('contract');
            circle.classList.remove('expand');
            text.textContent = 'Expire...';
            phase = 'inhale';
            setTimeout(breathCycle, 4000);
        }
    }
    breathCycle();
}

function selectExerciseOption(qIndex, optIndex) {
    const q = QUIZ_QUESTIONS[qIndex];
    const opt = q.options[optIndex];

    haptic('medium');
    trackEvent('quiz_exercise', { answer: opt.value, score: opt.score });

    // Disable buttons
    document.querySelectorAll('.exercise-choice').forEach((btn, i) => {
        btn.disabled = true;
        if (i === optIndex) btn.classList.add('selected');
    });

    // Store answer
    answers[q.id] = opt.value;
    scores[q.category] += opt.score;
    totalScore += opt.score;

    // Show specific explanation
    const explanationKey = opt.value === 'chest' ? 'chest' : 'belly';
    const explanation = q.explanation[explanationKey];

    if (showExplanations) {
        setTimeout(() => {
            showExplanation(explanation.text, explanation.reference, opt.score >= 2, () => {
                showQuestion(qIndex + 1);
            });
        }, 600);
    } else {
        setTimeout(() => showQuestion(qIndex + 1), 600);
    }
}

// ---- TOLERANCE TEST ----
function renderToleranceTest(q, container) {
    container.innerHTML = `
        <div class="tolerance-card fade-in">
            <div class="tolerance-header">
                <div class="tolerance-badge">TESTE PRÁTICO</div>
                <h2 class="tolerance-title">${q.instructions.title}</h2>
            </div>

            <div class="tolerance-video-container">
                <p class="tolerance-video-label">Assista como fazer o teste:</p>
                <div class="tolerance-video-wrapper">
                    <iframe
                        src="https://www.youtube.com/embed/vQwWXKncwK0?rel=0&modestbranding=1&playsinline=1&controls=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            </div>

            <div class="tolerance-instructions">
                ${q.instructions.steps.map((step, i) => `
                    <div class="tolerance-step">
                        <div class="tolerance-step-num">${i + 1}</div>
                        <p>${step}</p>
                    </div>
                `).join('')}
            </div>

            <div class="tolerance-input-area" id="input-area">
                <p class="tolerance-input-label">Quantos segundos você conseguiu?</p>
                <div class="tolerance-numpad">
                    <input type="number" id="tolerance-input" class="tolerance-seconds-input"
                        min="1" max="120" placeholder="0" inputmode="numeric" />
                    <span class="tolerance-input-unit">segundos</span>
                </div>
                <p class="tolerance-input-hint">Máximo: 120 segundos</p>
                <button class="btn-primary btn-glow" onclick="submitToleranceTime()">
                    Confirmar meu tempo
                    <span class="btn-arrow">&rarr;</span>
                </button>
            </div>

            <div class="tolerance-scale" id="tolerance-scale">
                <div class="scale-bar">
                    <div class="scale-segment" style="background: #DC3545; flex: 10;">
                        <span>10s</span>
                        <small>Disfuncional</small>
                    </div>
                    <div class="scale-segment" style="background: #FFC107; flex: 15;">
                        <span>25s</span>
                        <small>Saudável</small>
                    </div>
                    <div class="scale-segment" style="background: #4A7C59; flex: 20;">
                        <span>45s</span>
                        <small>Aprendiz do Ar</small>
                    </div>
                    <div class="scale-segment" style="background: #2D5A3D; flex: 15;">
                        <span>60s+</span>
                        <small>Guardião da Presença</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function submitToleranceTime() {
    const input = document.getElementById('tolerance-input');
    const seconds = parseInt(input.value);

    if (!seconds || seconds < 1) {
        input.style.borderColor = '#DC3545';
        input.placeholder = 'Digite um número';
        return;
    }
    if (seconds > 120) {
        input.value = 120;
        return;
    }

    haptic('heavy');

    // Auto-select based on time
    let optionIndex;
    if (seconds < 10) optionIndex = 0;
    else if (seconds < 25) optionIndex = 1;
    else if (seconds < 45) optionIndex = 2;
    else optionIndex = 3;

    const q = QUIZ_QUESTIONS[currentQuestion];
    const opt = q.options[optionIndex];

    // Show result
    document.getElementById('input-area').innerHTML = `
        <div class="timer-result fade-in">
            <div class="timer-result-seconds">${seconds}s</div>
            <div class="timer-result-level" style="color: ${Object.values(q.explanation.scale)[optionIndex].color}">
                ${opt.level}
            </div>
        </div>
    `;

    // Store answer
    answers[q.id] = opt.value;
    scores[q.category] += opt.score;
    totalScore += opt.score;

    if (showExplanations) {
        setTimeout(() => {
            showExplanation(q.explanation.text, q.explanation.reference, opt.score >= 2, () => {
                showQuestion(currentQuestion + 1);
            });
        }, 1500);
    } else {
        setTimeout(() => showQuestion(currentQuestion + 1), 1500);
    }
}


// ---- OPTION SELECTION ----
function selectOption(qIndex, optIndex) {
    const q = QUIZ_QUESTIONS[qIndex];
    const opt = q.options[optIndex];

    haptic('light');
    trackEvent('quiz_answer', { question: q.id, answer: opt.value, score: opt.score });

    // Visual feedback
    document.querySelectorAll('.option-card').forEach((btn, i) => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        if (i === optIndex) {
            btn.classList.add('selected');
        } else {
            btn.classList.add('dimmed');
        }
    });

    // Store answer
    answers[q.id] = opt.value;
    scores[q.category] += opt.score;
    totalScore += opt.score;

    // Show explanation after delay (or skip if fast mode)
    if (showExplanations) {
        setTimeout(() => {
            showExplanation(q.explanation.text, q.explanation.reference, opt.score >= 2, () => {
                showQuestion(qIndex + 1);
            });
        }, 500);
    } else {
        setTimeout(() => showQuestion(qIndex + 1), 500);
    }
}

// ---- EXPLANATION OVERLAY ----
function showExplanation(text, reference, isHighRisk, callback) {
    const container = document.getElementById('question-container');
    const explanationHTML = `
        <div class="explanation-overlay fade-in">
            <div class="explanation-card ${isHighRisk ? 'high-risk' : 'low-risk'}">
                <div class="explanation-icon">${isHighRisk ? '⚠️' : '✅'}</div>
                <div class="explanation-label">Explicação</div>
                <p class="explanation-text">${text.replace(/\n/g, '<br>')}</p>
                <div class="explanation-reference">
                    <span class="ref-label">Referência:</span>
                    <span class="ref-text">${reference.replace(/\n/g, '<br>')}</span>
                </div>
                <button class="btn-continue" onclick="this.closest('.explanation-overlay').remove()">
                    Continuar
                    <span class="btn-arrow">&rarr;</span>
                </button>
            </div>
        </div>
    `;

    // Append explanation overlay
    container.insertAdjacentHTML('beforeend', explanationHTML);

    // Setup continue button
    const overlay = container.querySelector('.explanation-overlay');
    overlay.querySelector('.btn-continue').addEventListener('click', () => {
        overlay.classList.add('fade-out');
        setTimeout(callback, 300);
    }, { once: true });
}

// ---- FINISH QUIZ ----
function finishQuiz() {
    showScreen('lead-screen');
    runAnalyzingAnimation();
}

// ---- ANALYZING ANIMATION ----
function runAnalyzingAnimation() {
    const stepsContainer = document.getElementById('analyzing-steps');
    let stepIndex = 0;

    function showStep() {
        if (stepIndex >= ANALYZING_STEPS.length) {
            setTimeout(async () => {
                await saveAnonymousResponse();
                showLeadCapture();
            }, 600);
            return;
        }

        const step = ANALYZING_STEPS[stepIndex];
        const pct = Math.round(((stepIndex + 1) / ANALYZING_STEPS.length) * 100);

        const stepDiv = document.createElement('div');
        stepDiv.className = 'analyzing-step fade-in';
        stepDiv.innerHTML = `
            <span class="step-emoji">${step.icon}</span>
            <span class="step-text">${step.text}</span>
            <span class="step-check"></span>
        `;
        stepsContainer.appendChild(stepDiv);

        setTimeout(() => {
            stepDiv.classList.add('done');
            stepDiv.querySelector('.step-check').innerHTML = '&#10003;';
            stepIndex++;
            setTimeout(showStep, 350);
        }, 700 + Math.random() * 400);
    }

    setTimeout(showStep, 500);
}


// ---- LEAD CAPTURE (before results) ----
function showLeadCapture() {
    const wrapper = document.querySelector('.lead-wrapper');
    const analyzing = document.getElementById('analyzing-animation');

    // Fade out analyzing animation
    analyzing.classList.add('fade-out');

    setTimeout(() => {
        analyzing.style.display = 'none';

        // Build lead capture form
        const leadForm = document.createElement('div');
        leadForm.className = 'lead-capture fade-in';
        leadForm.innerHTML = `
            <div class="lead-capture-card">
                <div class="lead-capture-icon">📊</div>
                <h2 class="lead-capture-title">Seu resultado está pronto!</h2>
                <p class="lead-capture-desc">Preencha abaixo para ver sua análise personalizada.</p>
                <form id="lead-capture-form" onsubmit="submitLeadCapture(event)">
                    <div class="form-group">
                        <label for="lead-name">Seu nome</label>
                        <input type="text" id="lead-name" placeholder="Como posso te chamar?" required autocomplete="given-name">
                    </div>
                    <div class="form-group">
                        <label for="lead-email">Seu melhor e-mail</label>
                        <input type="email" id="lead-email" placeholder="seuemail@exemplo.com" required autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="lead-phone">WhatsApp</label>
                        <input type="tel" id="lead-phone" placeholder="(11) 99999-9999" required autocomplete="tel">
                    </div>
                    <button type="submit" class="btn-primary btn-full btn-glow">
                        Ver Meu Resultado
                        <span class="btn-arrow">&rarr;</span>
                    </button>
                </form>
                <p class="lead-capture-trust">Seus dados estão seguros e não serão compartilhados.</p>
            </div>
        `;
        wrapper.appendChild(leadForm);
    }, 400);
}

function submitLeadCapture(event) {
    event.preventDefault();
    haptic('light');

    userName = document.getElementById('lead-name').value.trim();
    userEmail = document.getElementById('lead-email').value.trim();
    userPhone = document.getElementById('lead-phone').value.trim();

    trackEvent('lead_captured', { source: 'pre_result' });

    showResults();
}


// ---- APPLICATION FORM (Multi-step) ----
let applicationStep = 0;
let applicationData = {};

function showApplicationForm() {
    haptic('medium');
    trackEvent('application_form_opened', { profile: getProfile().title });

    const btn = document.getElementById('btn-show-application');
    const form = document.getElementById('application-form-wrapper');
    const ctaIntro = document.getElementById('cta-intro');

    btn.style.display = 'none';
    if (ctaIntro) ctaIntro.style.display = 'none';
    form.style.display = 'block';
    form.classList.add('fade-in');
    applicationData = { problems: userMainProblems };

    // If lead data already captured, skip step 1
    if (userName && userEmail && userPhone) {
        applicationData.name = userName;
        applicationData.email = userEmail;
        applicationData.phone = userPhone;
        applicationStep = 2;
    } else {
        applicationStep = 1;
    }

    renderApplicationStep();

    setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function renderApplicationStep() {
    const wrapper = document.getElementById('application-form-wrapper');
    const profile = getProfile();

    // Step indicator: if step 1 was skipped, adjust numbering
    const skipContact = (userName && userEmail && userPhone);
    const totalSteps = skipContact ? 4 : 5;
    const displayStep = skipContact ? applicationStep - 1 : applicationStep;
    const stepLabel = (step) => `Passo ${step} de ${totalSteps}`;

    // Adaptive problem text based on user's self-declaration
    const problemLabels = {
        ansiedade: 'ansiedade', insonia: 'insônia', estresse: 'estresse constante',
        burnout: 'burnout', falta_foco: 'falta de foco', dores: 'dores crônicas',
        sem_energia: 'falta de energia', impulsividade: 'impulsividade', aprendizado: 'dificuldade de aprendizado'
    };
    const problemText = userMainProblems.length > 0
        ? userMainProblems.map(p => problemLabels[p] || p).join(', ')
        : 'esses sintomas';

    switch (applicationStep) {
        case 1:
            wrapper.innerHTML = `
                <div class="app-step fade-in">
                    <div class="app-step-indicator">${stepLabel(displayStep)}</div>
                    <h3 class="app-step-title">Seus dados para contato</h3>
                    <form id="app-step-form" onsubmit="nextApplicationStep(event)">
                        <div class="form-group">
                            <label for="app-name">Seu nome</label>
                            <input type="text" id="app-name" placeholder="Como posso te chamar?" required autocomplete="given-name">
                        </div>
                        <div class="form-group">
                            <label for="app-email">Seu melhor e-mail</label>
                            <input type="email" id="app-email" placeholder="seuemail@exemplo.com" required autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label for="app-phone">WhatsApp</label>
                            <input type="tel" id="app-phone" placeholder="(11) 99999-9999" required autocomplete="tel">
                        </div>
                        <div class="form-group">
                            <label for="app-referral">Quem te indicou? <span class="optional">(opcional)</span></label>
                            <input type="email" id="app-referral" placeholder="email de quem te indicou" autocomplete="off">
                        </div>
                        <button type="submit" class="btn-primary btn-full btn-glow">
                            Continuar <span class="btn-arrow">&rarr;</span>
                        </button>
                    </form>
                </div>
            `;
            // Pre-fill fields if data already exists
            setTimeout(() => {
                if (applicationData.name) {
                    const el = document.getElementById('app-name');
                    if (el) el.value = applicationData.name;
                }
                if (applicationData.email) {
                    const el = document.getElementById('app-email');
                    if (el) el.value = applicationData.email;
                }
                if (applicationData.phone) {
                    const el = document.getElementById('app-phone');
                    if (el) el.value = applicationData.phone;
                }
            }, 0);
            break;

        case 2:
            wrapper.innerHTML = `
                <div class="app-step fade-in">
                    <div class="app-step-indicator">${stepLabel(displayStep)}</div>
                    <h3 class="app-step-title">De 0 a 10, qual a prioridade de resolver ${problemText} agora?</h3>
                    <p class="app-step-desc">0 = posso deixar pra depois &nbsp;&nbsp; 10 = preciso resolver agora</p>
                    <div class="priority-slider-container">
                        <input type="range" id="priority-slider" min="0" max="10" value="5" class="priority-slider" oninput="updatePriorityValue(this.value)">
                        <div class="priority-labels">
                            <span>0</span>
                            <span class="priority-current" id="priority-value">5</span>
                            <span>10</span>
                        </div>
                    </div>
                    <button class="btn-primary btn-full btn-glow" onclick="nextApplicationStep()">
                        Continuar <span class="btn-arrow">&rarr;</span>
                    </button>
                </div>
            `;
            break;

        case 3:
            wrapper.innerHTML = `
                <div class="app-step fade-in">
                    <div class="app-step-indicator">${stepLabel(displayStep)}</div>
                    <h3 class="app-step-title">Se ${problemText} piorasse na sua vida, o que estaria em jogo?</h3>
                    <p class="app-step-desc">Selecione tudo que se aplica:</p>
                    <div class="consequence-grid">
                        ${[
                            { value: 'relacionamento', label: 'Relacionamento / Família', icon: '❤️' },
                            { value: 'dinheiro', label: 'Perda de dinheiro / Renda', icon: '💰' },
                            { value: 'carreira', label: 'Carreira / Trabalho', icon: '💼' },
                            { value: 'saude', label: 'Saúde física', icon: '🏥' },
                            { value: 'saude_mental', label: 'Saúde mental', icon: '🧠' },
                            { value: 'qualidade_vida', label: 'Qualidade de vida', icon: '🌅' },
                            { value: 'autoestima', label: 'Autoestima / Confiança', icon: '💪' },
                            { value: 'produtividade', label: 'Produtividade / Performance', icon: '📈' }
                        ].map(c => `
                            <button class="consequence-option" data-value="${c.value}" onclick="toggleConsequence(this)">
                                <span class="consequence-icon">${c.icon}</span>
                                <span class="consequence-label">${c.label}</span>
                                <span class="multi-check"></span>
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn-primary btn-full btn-glow" onclick="nextApplicationStep()">
                        Continuar <span class="btn-arrow">&rarr;</span>
                    </button>
                </div>
            `;
            break;

        case 4:
            wrapper.innerHTML = `
                <div class="app-step fade-in">
                    <div class="app-step-indicator">${stepLabel(displayStep)}</div>
                    <h3 class="app-step-title">Quanto valeria para você resolver ${problemText} de uma vez por todas?</h3>
                    <div class="value-options">
                        ${[
                            { value: 'nao_pagaria', label: 'Não pagaria nada' },
                            { value: 'ate_100', label: 'Até R$ 100' },
                            { value: '100_500', label: 'R$ 100 a R$ 500' },
                            { value: '500_1000', label: 'R$ 500 a R$ 1.000' },
                            { value: '1000_3000', label: 'R$ 1.000 a R$ 3.000' },
                            { value: 'acima_3000', label: 'Acima de R$ 3.000' },
                            { value: 'nao_tem_preco', label: 'Não tem preço — resolveria qualquer coisa' }
                        ].map(v => `
                            <button class="value-option" data-value="${v.value}" onclick="selectValueOption(this)">
                                ${v.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            break;

        case 5:
            wrapper.innerHTML = `
                <div class="app-step fade-in">
                    <div class="app-step-indicator">${stepLabel(displayStep)}</div>
                    <h3 class="app-step-title">Se você for selecionado(a) para uma demonstração gratuita, quando poderia participar?</h3>
                    <div class="schedule-section">
                        <p class="schedule-label">Dias da semana:</p>
                        <div class="schedule-days">
                            ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => `
                                <button class="schedule-day" data-value="${d.toLowerCase()}" onclick="toggleSchedule(this, 'day')">${d}</button>
                            `).join('')}
                        </div>
                        <p class="schedule-label" style="margin-top: 16px;">Período:</p>
                        <div class="schedule-periods">
                            <button class="schedule-period" data-value="manha" onclick="toggleSchedule(this, 'period')">🌅 Manhã</button>
                            <button class="schedule-period" data-value="tarde" onclick="toggleSchedule(this, 'period')">☀️ Tarde</button>
                            <button class="schedule-period" data-value="noite" onclick="toggleSchedule(this, 'period')">🌙 Noite</button>
                        </div>
                    </div>
                    <div class="commitment-section">
                        <label class="commitment-checkbox">
                            <input type="checkbox" id="commitment-check">
                            <span class="commitment-text">Eu me comprometo a, caso seja selecionado(a) para a sessão gratuita, <strong>comparecer e dar o meu melhor</strong>.</span>
                        </label>
                    </div>
                    <button class="btn-primary btn-full btn-glow" id="btn-submit-final" onclick="submitFinalApplication()">
                        Enviar Minha Aplicação <span class="btn-arrow">&rarr;</span>
                    </button>
                    <p class="form-trust">🔒 Seus dados estão seguros. Não compartilhamos com terceiros.</p>
                </div>
            `;
            break;
    }

    setTimeout(() => {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function updatePriorityValue(val) {
    document.getElementById('priority-value').textContent = val;
}

function toggleConsequence(btn) {
    haptic('light');
    btn.classList.toggle('active');
    const check = btn.querySelector('.multi-check');
    check.innerHTML = btn.classList.contains('active') ? '&#10003;' : '';
}

function selectValueOption(btn) {
    haptic('light');
    document.querySelectorAll('.value-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applicationData.perceived_value = btn.dataset.value;
    setTimeout(() => {
        applicationStep++;
        renderApplicationStep();
    }, 300);
}

function toggleSchedule(btn, type) {
    haptic('light');
    btn.classList.toggle('active');
}

function nextApplicationStep(event) {
    if (event) event.preventDefault();
    haptic('light');

    // Collect data from current step
    switch (applicationStep) {
        case 1:
            applicationData.name = document.getElementById('app-name').value.trim();
            applicationData.email = document.getElementById('app-email').value.trim();
            applicationData.phone = document.getElementById('app-phone').value.trim();
            applicationData.referral = document.getElementById('app-referral').value.trim() || null;
            userName = applicationData.name;
            userEmail = applicationData.email;
            userPhone = applicationData.phone;
            break;
        case 2:
            applicationData.priority = parseInt(document.getElementById('priority-slider').value);
            break;
        case 3:
            const consequences = Array.from(document.querySelectorAll('.consequence-option.active'))
                .map(b => b.dataset.value);
            if (consequences.length === 0) {
                document.querySelector('.consequence-grid').style.outline = '2px solid #DC3545';
                document.querySelector('.consequence-grid').style.outlineOffset = '4px';
                setTimeout(() => {
                    const grid = document.querySelector('.consequence-grid');
                    if (grid) grid.style.outline = 'none';
                }, 1500);
                return;
            }
            applicationData.consequences = consequences;
            break;
    }

    applicationStep++;
    renderApplicationStep();
}

function submitFinalApplication() {
    haptic('success');

    // Collect scheduling data
    const selectedDays = Array.from(document.querySelectorAll('.schedule-day.active'))
        .map(b => b.dataset.value);
    const selectedPeriods = Array.from(document.querySelectorAll('.schedule-period.active'))
        .map(b => b.dataset.value);
    const committed = document.getElementById('commitment-check').checked;

    applicationData.available_days = selectedDays;
    applicationData.available_periods = selectedPeriods;
    applicationData.committed = committed;

    const leadData = {
        name: applicationData.name,
        email: applicationData.email,
        phone: applicationData.phone || null,
        referral: applicationData.referral || null,
        extra_data: {
            problems: applicationData.problems,
            priority: applicationData.priority,
            consequences: applicationData.consequences,
            perceived_value: applicationData.perceived_value,
            available_days: applicationData.available_days,
            available_periods: applicationData.available_periods,
            committed: applicationData.committed
        }
    };

    console.log('Application submitted:', leadData);
    saveApplication(leadData);

    trackEvent('application_submitted', {
        profile: getProfile().title,
        total_score: totalScore,
        priority: applicationData.priority,
        perceived_value: applicationData.perceived_value,
        committed: committed
    });

    if (window.fbq) {
        fbq('track', 'Lead', { content_name: 'quiz_respiratorio' });
    }

    // Show confirmation
    const wrapper = document.getElementById('application-form-wrapper');
    wrapper.innerHTML = `
        <div class="application-confirmation fade-in">
            <div class="confirmation-icon">✅</div>
            <h3 class="confirmation-title">Aplicação Enviada com Sucesso!</h3>
            <p class="confirmation-text">
                Obrigado, <strong>${applicationData.name}</strong>! Um profissional do
                <strong>Instituto Brasileiro de Neurociência e Respiração</strong>
                entrará em contato pelo seu WhatsApp se você for selecionado(a).
            </p>
            <p class="confirmation-note">Fique atento ao seu WhatsApp nos próximos dias.</p>
        </div>
    `;

    const greeting = document.querySelector('.result-greeting strong');
    if (greeting) greeting.textContent = applicationData.name;

    setTimeout(() => {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// ---- GET PROFILE ----
function getProfile() {
    if (totalScore <= 7) return RESULT_PROFILES.functional;
    if (totalScore <= 15) return RESULT_PROFILES.moderate;
    if (totalScore <= 23) return RESULT_PROFILES.dysfunctional;
    return RESULT_PROFILES.severe;
}

function getCategoryLevel(category) {
    const score = scores[category];
    const config = CATEGORY_ANALYSIS[category];
    if (score <= config.levels.low.max) return 'low';
    if (score <= config.levels.medium.max) return 'medium';
    return 'high';
}

// ---- RESULTS ----
async function showResults() {
    showScreen('result-screen');

    const profile = getProfile();
    const instructor = getInstructorConfig();
    const maxScore = 33;
    const riskPct = Math.min(100, Math.round((totalScore / maxScore) * 100));
    const healthScore = Math.max(0, 100 - riskPct);

    // Determine faixa
    const profileKey = totalScore <= 7 ? 'funcional' : totalScore <= 15 ? 'atencao_moderada' : totalScore <= 23 ? 'disfuncao' : 'disfuncao_severa';
    const faixa = FAIXA_LABELS[profileKey];

    // Fetch instructor data from API if slug available
    const params = new URLSearchParams(window.location.search);
    const instructorSlug = params.get('instructor_slug') || params.get('slug') || '';
    let profData = { name: instructor.instructorName || '', profissao: '', cidade: '', nome_clinica: '' };

    if (instructorSlug) {
        try {
            const resp = await fetch(`/api/quiz/instructor?slug=${encodeURIComponent(instructorSlug)}`);
            if (resp.ok) {
                const data = await resp.json();
                profData = { ...profData, ...data };
                if (!profData.name && data.name) profData.name = data.name;
            }
        } catch (e) {
            console.log('[Instructor] Fetch failed, using URL params:', e);
        }
    }

    // Build professional strings
    const hasProfessional = !!profData.name;
    const profParts = [profData.name];
    if (profData.profissao) profParts.push(profData.profissao);
    const profLine = profParts.join(', ');
    const profWithCity = profData.cidade ? `${profLine} em ${profData.cidade}` : profLine;

    // Template helper
    const tpl = (str) => str
        .replace(/\{\{profissional_nome\}\}/g, profData.name || 'o profissional')
        .replace(/\{\{profissao\}\}/g, profData.profissao || '')
        .replace(/\{\{cidade\}\}/g, profData.cidade || '');

    // Severity conditional text
    const severityIntro = RESULT_CONTENT.diaADia.conditionals[faixa] || RESULT_CONTENT.diaADia.conditionals.moderada;

    // Session intro
    const sessionIntro = hasProfessional
        ? `${RESULT_CONTENT.sessao.introTemplate} com <strong>${profWithCity}</strong>.`
        : `${RESULT_CONTENT.sessao.introTemplate} ${RESULT_CONTENT.sessao.introGeneric}`;

    // CTA sub text
    const ctaSubText = hasProfessional
        ? tpl(RESULT_CONTENT.cta.subTextTemplate)
        : RESULT_CONTENT.cta.subTextGeneric;

    // Footer
    const footerText = hasProfessional
        ? tpl(RESULT_CONTENT.footer.withProfessional)
        : RESULT_CONTENT.footer.generic;

    const container = document.getElementById('result-container');
    container.innerHTML = `
        <!-- BLOCO 1: Cabeçalho do Resultado -->
        <section class="result-header disney-reveal" style="--profile-color: ${profile.color}; --profile-glow: ${profile.colorGlow}; --profile-gradient: ${profile.gradient}">
            <h1 class="result-title shimmer-text">${RESULT_CONTENT.header.title}</h1>

            <div class="score-ring-container">
                <div class="score-ring" id="score-ring" style="--ring-color: ${profile.color}; --ring-glow: ${profile.colorGlow}">
                    <svg viewBox="0 0 120 120">
                        <circle class="ring-bg" cx="60" cy="60" r="52" />
                        <circle class="ring-fill" id="ring-fill" cx="60" cy="60" r="52"
                            stroke="${profile.color}"
                            stroke-dasharray="326.73"
                            stroke-dashoffset="326.73" />
                    </svg>
                    <div class="score-center">
                        <span class="score-value" id="score-value">0</span>
                        <span class="score-max">/100</span>
                    </div>
                </div>
            </div>

            <h2 class="result-subtitle">${userName || 'Você'}, o seu padrão atual é <strong class="severity-tag severity-${faixa}">${faixa}</strong> <span class="score-inline">(${healthScore}/100)</span>.</h2>
            <p class="result-support-line">${RESULT_CONTENT.header.supportLine}</p>
        </section>

        <!-- BLOCO 2: Insight Rápido -->
        <section class="result-block disney-reveal" data-delay="200">
            <h3 class="block-title shimmer-text">${RESULT_CONTENT.insightRapido.title}</h3>
            <p class="block-text">${RESULT_CONTENT.insightRapido.text}</p>
        </section>

        <!-- BLOCO 3: Dia a Dia -->
        <section class="result-block disney-reveal" data-delay="400">
            <h3 class="block-title shimmer-text">${RESULT_CONTENT.diaADia.title}</h3>
            <p class="severity-intro" style="--severity-color: ${profile.color}">${severityIntro}</p>
            <ul class="symptom-list">
                ${RESULT_CONTENT.diaADia.symptoms.map((s, i) => `
                    <li class="symptom-item" style="--stagger: ${i}">${s}</li>
                `).join('')}
            </ul>
            <p class="highlight-quote" style="--accent: ${profile.color}">${RESULT_CONTENT.diaADia.closing}</p>
        </section>

        <!-- BLOCO 4: Mecanismo -->
        <section class="result-block disney-reveal" data-delay="600">
            <h3 class="block-title shimmer-text">${RESULT_CONTENT.mecanismo.title}</h3>
            <p class="block-text">${RESULT_CONTENT.mecanismo.intro}</p>
            <div class="mechanism-steps">
                ${RESULT_CONTENT.mecanismo.steps.map((step, i) => `
                    <div class="mechanism-step" style="--step-index: ${i}">
                        <div class="step-number" style="background: ${profile.gradient}">${step.number}</div>
                        <div class="step-content">
                            <strong class="step-title">${step.title}</strong>
                            <p class="step-text">${step.text}</p>
                        </div>
                    </div>
                    ${i < 2 ? '<div class="step-connector"><div class="connector-line"></div></div>' : ''}
                `).join('')}
            </div>
            <p class="block-text mechanism-closing">${RESULT_CONTENT.mecanismo.closing}</p>
        </section>

        <!-- BLOCO 5: Próximo Passo -->
        <section class="result-block disney-reveal" data-delay="800">
            <h3 class="block-title shimmer-text">${RESULT_CONTENT.proximoPasso.title}</h3>
            <p class="block-text">${RESULT_CONTENT.proximoPasso.intro}</p>
            <ul class="benefit-list">
                ${RESULT_CONTENT.proximoPasso.benefits.map((b, i) => `
                    <li class="benefit-item" style="--stagger: ${i}">
                        <span class="benefit-check">&#10003;</span>
                        <span>${b}</span>
                    </li>
                `).join('')}
            </ul>
        </section>

        <!-- BLOCO 6: Sessão Demonstrativa -->
        <section class="result-block result-session disney-reveal" data-delay="1000" style="--accent: ${profile.color}">
            <h3 class="block-title shimmer-text">${RESULT_CONTENT.sessao.title}</h3>
            <p class="block-text">${sessionIntro}</p>
            <p class="block-text session-details">${RESULT_CONTENT.sessao.sessionDetails}</p>
            <ul class="deliverable-list">
                ${RESULT_CONTENT.sessao.deliverables.map((d, i) => `
                    <li class="deliverable-item" style="--stagger: ${i}">
                        <span class="deliverable-icon">&#9679;</span>
                        <span>${d}</span>
                    </li>
                `).join('')}
            </ul>
            <p class="session-disclaimer">${RESULT_CONTENT.sessao.disclaimer}</p>
        </section>

        <!-- BLOCO 7: Urgência Suave -->
        <section class="result-block urgency-block disney-reveal" data-delay="1200" style="--accent: ${profile.color}">
            ${RESULT_CONTENT.urgencia.map(p => `<p class="urgency-text">${p}</p>`).join('')}
        </section>

        <!-- BLOCO 8: CTA -->
        <section class="result-cta disney-reveal" data-delay="1400">
            <button class="cta-btn disney-glow" id="cta-main-btn" style="--btn-gradient: ${profile.gradient}; --btn-glow: ${profile.colorGlow}">
                ${RESULT_CONTENT.cta.buttonText}
                <span class="cta-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
            </button>
            <p class="cta-sub-text">${ctaSubText}</p>
        </section>

        <!-- Rodapé -->
        <footer class="result-footer disney-reveal" data-delay="1600">
            <p>${footerText}</p>
        </footer>
    `;

    // CTA click handler
    const ctaBtn = document.getElementById('cta-main-btn');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', () => {
            haptic('medium');
            trackEvent('quiz_result_cta_click', {
                instructor: profData.name || instructor.instructorName,
                profile: profile.title,
                faixa: faixa,
                score: healthScore
            });
            const ctaUrl = instructor.ctaUrl || params.get('cta_url') || '';
            if (ctaUrl) {
                window.open(ctaUrl, '_blank');
            }
        });
    }

    // Track results view
    trackEvent('quiz_completed', {
        profile: profile.title,
        total_score: totalScore,
        health_score: healthScore,
        faixa: faixa
    });

    // Animate everything after render
    setTimeout(() => {
        animateScoreRing(healthScore);
        observeDisneyReveals();
        launchConfetti();
        haptic('success');
    }, 300);
}

// ---- DISNEY REVEAL OBSERVER ----
function observeDisneyReveals() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = parseInt(el.dataset.delay || '0', 10);
                setTimeout(() => {
                    el.classList.add('visible');
                    // Animate symptom/benefit list items with stagger
                    el.querySelectorAll('.symptom-item, .benefit-item, .deliverable-item').forEach((item, i) => {
                        setTimeout(() => item.classList.add('visible'), i * 120);
                    });
                    // Animate mechanism steps
                    el.querySelectorAll('.mechanism-step').forEach((step, i) => {
                        setTimeout(() => step.classList.add('visible'), i * 300);
                    });
                    el.querySelectorAll('.step-connector').forEach((conn, i) => {
                        setTimeout(() => conn.classList.add('visible'), (i + 1) * 300);
                    });
                }, delay);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.disney-reveal').forEach(section => {
        observer.observe(section);
    });
}

function animateScoreRing(target) {
    const fill = document.getElementById('ring-fill');
    const value = document.getElementById('score-value');
    if (!fill || !value) return;

    const circumference = 326.73;
    const targetOffset = circumference - (circumference * target / 100);

    // Animate number
    let current = 0;
    const duration = 1800;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        current = Math.round(eased * target);
        value.textContent = current;

        const currentOffset = circumference - (circumference * current / 100);
        fill.style.strokeDashoffset = currentOffset;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// Legacy functions kept for compatibility
function animateCategoryBars() {}
function observeFadeInSections() {}

// ---- CTA CLICK ----
function handleCtaClick() {
    const instructor = getInstructorConfig();
    haptic('medium');
    trackEvent('cta_clicked', {
        instructor: instructor.instructorName,
        cta_url: instructor.ctaUrl,
        profile: getProfile().title
    });
    if (instructor.ctaUrl) {
        window.open(instructor.ctaUrl, '_blank');
    }
}

// ---- CONFETTI CELEBRATION ----
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#2D5A3D', '#4A7C59', '#28A745', '#E8F5E9', '#1e4a2e', '#6ba378'];
    const confetti = [];

    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * canvas.height * 0.5,
            w: Math.random() * 8 + 4,
            h: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: (Math.random() - 0.5) * 2,
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 8,
            opacity: 1
        });
    }

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;

        confetti.forEach(c => {
            if (c.opacity <= 0) return;
            alive = true;

            c.y += c.speedY;
            c.x += c.speedX;
            c.rotation += c.rotSpeed;
            c.speedY += 0.05; // gravity

            if (c.y > canvas.height * 0.8) {
                c.opacity -= 0.02;
            }

            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation * Math.PI / 180);
            ctx.globalAlpha = Math.max(0, c.opacity);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        });

        frame++;
        if (alive && frame < 300) {
            requestAnimationFrame(animate);
        } else {
            canvas.style.display = 'none';
        }
    }
    requestAnimationFrame(animate);
}

// ---- SOCIAL SHARING ----
function getShareText() {
    const profile = getProfile();
    return `Acabei de fazer o Desafio de Expiração e um teste para ver se a respiração está funcional.\n\nEsse é meu desafio para você:`;
}

function shareWhatsApp() {
    haptic('light');
    const text = encodeURIComponent(getShareText() + '\n\n' + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    trackEvent('share', { method: 'whatsapp' });
}

function copyShareLink() {
    haptic('light');
    const text = getShareText() + '\n' + window.location.href;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-link');
        if (btn) {
            btn.textContent = 'Link copiado!';
            setTimeout(() => { btn.textContent = 'Copiar Link'; }, 2000);
        }
    });
    trackEvent('share', { method: 'copy_link' });
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
    initParticles();

    // Initialize analytics if configured
    if (ANALYTICS_CONFIG.ga4MeasurementId) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.ga4MeasurementId}`;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', ANALYTICS_CONFIG.ga4MeasurementId);
    }

    if (ANALYTICS_CONFIG.metaPixelId) {
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', ANALYTICS_CONFIG.metaPixelId);
        fbq('track', 'PageView');
    }

    trackEvent('quiz_page_view', { page: 'welcome' });
});
