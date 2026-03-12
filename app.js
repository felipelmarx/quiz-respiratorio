// ============================================
// APP.JS - iBreathwork Quiz Respiratório
// Instituto de Neurociência da Respiração
// ============================================

// ---- STATE ----
let currentQuestion = 0;
let answers = {};
let scores = { padrao: 0, sintomas: 0, consciencia: 0, tolerancia: 0 };
let totalScore = 0;
let userName = '';
let userEmail = '';
let referralEmail = '';
let currentChapter = 1;
let particlesActive = true;
let toleranceTimer = null;
let toleranceSeconds = 0;

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

    const instructor = getInstructorConfig();
    const profile = getProfile();
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
        if (!particlesActive) {
            requestAnimationFrame(animate);
            return;
        }
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
        showQuestion(0);
    }, 300);
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

    setTimeout(() => {
        showExplanation(explanation.text, explanation.reference, opt.score >= 2, () => {
            showQuestion(qIndex + 1);
        });
    }, 600);
}

// ---- TOLERANCE TEST ----
function renderToleranceTest(q, container) {
    container.innerHTML = `
        <div class="tolerance-card fade-in">
            <div class="tolerance-header">
                <div class="tolerance-badge">TESTE PRÁTICO</div>
                <h2 class="tolerance-title">${q.instructions.title}</h2>
            </div>

            <div class="tolerance-instructions">
                ${q.instructions.steps.map((step, i) => `
                    <div class="tolerance-step">
                        <div class="tolerance-step-num">${i + 1}</div>
                        <p>${step}</p>
                    </div>
                `).join('')}
            </div>

            <div class="tolerance-timer-area" id="timer-area" style="display:none;">
                <div class="timer-circle" id="timer-circle">
                    <div class="timer-inner">
                        <span class="timer-seconds" id="timer-seconds">0</span>
                        <span class="timer-label">segundos</span>
                    </div>
                </div>
                <button class="btn-stop-timer" id="btn-stop" onclick="stopToleranceTimer()">
                    Parar Cronômetro
                </button>
            </div>

            <div class="tolerance-actions" id="tolerance-actions">
                <button class="btn-primary btn-glow" onclick="startToleranceTimer()">
                    Iniciar Cronômetro
                    <span class="btn-arrow">&rarr;</span>
                </button>
                <button class="btn-skip" onclick="showToleranceOptions()">
                    Prefiro selecionar meu tempo
                </button>
            </div>

            <div class="tolerance-scale" id="tolerance-scale" style="display:none;">
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

            <div class="tolerance-results" id="tolerance-results" style="display:none;">
                ${q.options.map((opt, i) => `
                    <button class="tolerance-option" onclick="selectToleranceResult(${currentQuestion}, ${i})">
                        <span class="tol-level" style="color: ${Object.values(q.explanation.scale)[i].color}">${opt.level}</span>
                        <span class="tol-label">${opt.label}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function startToleranceTimer() {
    haptic('medium');
    document.getElementById('tolerance-actions').style.display = 'none';
    document.getElementById('timer-area').style.display = 'flex';
    document.getElementById('tolerance-scale').style.display = 'block';

    toleranceSeconds = 0;
    const display = document.getElementById('timer-seconds');
    const circle = document.getElementById('timer-circle');

    toleranceTimer = setInterval(() => {
        toleranceSeconds++;
        display.textContent = toleranceSeconds;

        // Color changes based on time
        if (toleranceSeconds < 10) {
            circle.style.borderColor = '#DC3545';
        } else if (toleranceSeconds < 25) {
            circle.style.borderColor = '#FFC107';
        } else if (toleranceSeconds < 45) {
            circle.style.borderColor = '#4A7C59';
        } else {
            circle.style.borderColor = '#2D5A3D';
        }
    }, 1000);
}

function stopToleranceTimer() {
    clearInterval(toleranceTimer);
    haptic('heavy');
    const seconds = toleranceSeconds;

    // Auto-select based on time
    let optionIndex;
    if (seconds < 10) optionIndex = 0;
    else if (seconds < 25) optionIndex = 1;
    else if (seconds < 45) optionIndex = 2;
    else optionIndex = 3;

    const q = QUIZ_QUESTIONS[currentQuestion];
    const opt = q.options[optionIndex];

    // Show result
    document.getElementById('timer-area').innerHTML = `
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

    setTimeout(() => {
        showExplanation(q.explanation.text, q.explanation.reference, opt.score >= 2, () => {
            showQuestion(currentQuestion + 1);
        });
    }, 1500);
}

function showToleranceOptions() {
    document.getElementById('tolerance-actions').style.display = 'none';
    document.getElementById('tolerance-results').style.display = 'flex';
    document.getElementById('tolerance-scale').style.display = 'block';
}

function selectToleranceResult(qIndex, optIndex) {
    const q = QUIZ_QUESTIONS[qIndex];
    const opt = q.options[optIndex];

    // Disable buttons
    document.querySelectorAll('.tolerance-option').forEach((btn, i) => {
        btn.disabled = true;
        if (i === optIndex) btn.classList.add('selected');
    });

    answers[q.id] = opt.value;
    scores[q.category] += opt.score;
    totalScore += opt.score;

    setTimeout(() => {
        showExplanation(q.explanation.text, q.explanation.reference, opt.score >= 2, () => {
            showQuestion(qIndex + 1);
        });
    }, 600);
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

    // Show explanation after delay
    setTimeout(() => {
        showExplanation(q.explanation.text, q.explanation.reference, opt.score >= 2, () => {
            showQuestion(qIndex + 1);
        });
    }, 500);
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
    const progressRing = document.getElementById('analyzing-progress');
    let stepIndex = 0;

    function showStep() {
        if (stepIndex >= ANALYZING_STEPS.length) {
            setTimeout(() => {
                // Save anonymous response immediately
                saveAnonymousResponse();
                // Go directly to results
                showResults();
            }, 600);
            return;
        }

        const step = ANALYZING_STEPS[stepIndex];
        const pct = Math.round(((stepIndex + 1) / ANALYZING_STEPS.length) * 100);

        // Update progress ring
        if (progressRing) {
            progressRing.style.setProperty('--progress', pct);
        }

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

function calculateFindings() {
    let findings = 0;
    if (scores.padrao > 4) findings += 3;
    else if (scores.padrao > 2) findings += 2;
    else findings += 1;
    if (scores.sintomas > 6) findings += 3;
    else if (scores.sintomas > 3) findings += 2;
    else findings += 1;
    if (scores.consciencia > 1) findings += 2;
    else findings += 1;
    if (scores.tolerancia > 2) findings += 2;
    else findings += 1;
    return Math.max(3, Math.min(9, findings));
}

// ---- APPLICATION FORM ----
function showApplicationForm() {
    haptic('medium');
    trackEvent('application_form_opened', { profile: getProfile().title });

    const btn = document.getElementById('btn-show-application');
    const form = document.getElementById('application-form-wrapper');

    btn.style.display = 'none';
    form.style.display = 'block';
    form.classList.add('fade-in');

    // Scroll to form
    setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function submitApplication(event) {
    event.preventDefault();
    haptic('success');

    userName = document.getElementById('app-name').value.trim();
    userEmail = document.getElementById('app-email').value.trim();
    const phone = document.getElementById('app-phone').value.trim();
    referralEmail = document.getElementById('app-referral').value.trim();

    const instructor = getInstructorConfig();
    const leadData = {
        name: userName,
        email: userEmail,
        phone: phone || null,
        referral: referralEmail || null,
    };

    console.log('Application submitted:', leadData);

    // Save to Supabase (non-blocking)
    saveApplication(leadData);

    // Track conversion
    trackEvent('application_submitted', {
        profile: getProfile().title,
        total_score: totalScore,
        has_referral: !!referralEmail
    });

    // Meta Pixel standard event
    if (window.fbq) {
        fbq('track', 'Lead', { content_name: 'quiz_respiratorio' });
    }

    // Show confirmation
    document.getElementById('application-form-wrapper').style.display = 'none';
    const confirmation = document.getElementById('application-confirmation');
    confirmation.style.display = 'block';
    confirmation.classList.add('fade-in');
    document.getElementById('confirmation-name').textContent = userName;

    // Update greeting with name
    const greeting = document.querySelector('.result-greeting strong');
    if (greeting) greeting.textContent = userName;

    // Scroll to confirmation
    setTimeout(() => {
        confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
function showResults() {
    showScreen('result-screen');

    const profile = getProfile();
    const instructor = getInstructorConfig();
    const maxScore = 33;
    const riskPct = Math.min(100, Math.round((totalScore / maxScore) * 100));
    const healthScore = Math.max(0, 100 - riskPct);

    // Category analysis
    const categories = ['padrao', 'sintomas', 'consciencia', 'tolerancia'].map(cat => {
        const level = getCategoryLevel(cat);
        const config = CATEGORY_ANALYSIS[cat];
        const levelConfig = config.levels[level];
        return {
            ...config,
            level,
            levelLabel: levelConfig.label,
            levelColor: levelConfig.color,
            score: scores[cat],
            pct: Math.min(100, Math.round((scores[cat] / config.maxScore) * 100)),
            insight: config.insights[level]
        };
    });

    const container = document.getElementById('result-container');
    container.innerHTML = `
        <div class="result-hero">
            <div class="result-particles-bg"></div>
            <p class="result-greeting">Resultado preparado para <strong>você</strong></p>

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

            <div class="result-profile-badge" style="background: ${profile.gradient}">
                ${profile.emoji} ${profile.title}
            </div>
            <p class="result-description">${profile.description}</p>
        </div>

        <div class="result-section fade-in-section">
            <h3 class="section-title"><span class="section-icon">📊</span> Análise por Categoria</h3>
            ${categories.map(cat => `
                <div class="category-card">
                    <div class="category-header">
                        <span class="category-icon">${cat.icon}</span>
                        <span class="category-name">${cat.name}</span>
                        <span class="category-level" style="color: ${cat.levelColor}">${cat.levelLabel}</span>
                    </div>
                    <div class="category-bar-track">
                        <div class="category-bar-fill" data-width="${cat.pct}" style="background: ${cat.levelColor}; width: 0%"></div>
                    </div>
                    <p class="category-insight">${cat.insight}</p>
                </div>
            `).join('')}
        </div>

        <div class="result-section fade-in-section">
            <h3 class="section-title"><span class="section-icon">🧠</span> Insight Principal</h3>
            <div class="insight-card" style="border-left: 4px solid ${profile.color}">
                <p>${profile.mainInsight}</p>
            </div>
        </div>

        <div class="result-section fade-in-section">
            <h3 class="section-title"><span class="section-icon">🔬</span> ${NEUROSCIENCE_CONTENT.title}</h3>
            ${NEUROSCIENCE_CONTENT.sections.map(section => `
                <div class="neuro-card">
                    <h4>${section.title}</h4>
                    <p>${section.text}</p>
                </div>
            `).join('')}
        </div>

        <div class="result-section fade-in-section">
            <h3 class="section-title"><span class="section-icon">📤</span> Compartilhar Resultado</h3>
            <div class="share-buttons">
                <button class="share-btn share-whatsapp" onclick="shareWhatsApp()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Enviar via WhatsApp
                </button>
                <button class="share-btn share-copy" id="btn-copy-link" onclick="copyShareLink()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copiar Link
                </button>
            </div>
        </div>

        <div class="result-cta-section fade-in-section" id="application-section">
            <div class="cta-card" style="border-top: 3px solid ${profile.color}">
                <div class="cta-badge">Oportunidade Exclusiva</div>
                ${instructor.instructorName ? `<p class="cta-instructor">Indicado por <strong>${instructor.instructorName}</strong></p>` : ''}
                <h3>Quer experimentar o poder da respiração consciente?</h3>
                <p>Aplique para ser <strong>selecionado(a)</strong> para uma demonstração gratuita de breathwork com um profissional certificado do <strong>Instituto Brasileiro de Neurociência e Respiração</strong>.</p>
                <p class="cta-subtitle">${profile.cta}</p>

                <button class="btn-primary btn-glow btn-full" id="btn-show-application" onclick="showApplicationForm()">
                    Quero Ser Selecionado para uma Demonstração Gratuita
                    <span class="btn-arrow">&rarr;</span>
                </button>

                <div class="application-form-wrapper" id="application-form-wrapper" style="display:none;">
                    <form id="application-form" onsubmit="submitApplication(event)">
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
                        <button type="submit" class="btn-primary btn-full btn-glow" id="btn-submit-application">
                            Enviar Minha Aplicação
                            <span class="btn-arrow">&rarr;</span>
                        </button>
                        <p class="form-trust">🔒 Seus dados estão seguros. Não compartilhamos com terceiros.</p>
                    </form>
                </div>

                <div class="application-confirmation" id="application-confirmation" style="display:none;">
                    <div class="confirmation-icon">✅</div>
                    <h3 class="confirmation-title">Aplicação Enviada com Sucesso!</h3>
                    <p class="confirmation-text">
                        Obrigado, <strong id="confirmation-name"></strong>! Um profissional do
                        <strong>Instituto Brasileiro de Neurociência e Respiração</strong>
                        entrará em contato pelo seu WhatsApp se você for selecionado(a).
                    </p>
                    <p class="confirmation-note">Fique atento ao seu WhatsApp nos próximos dias.</p>
                </div>
            </div>
        </div>
    `;

    // Track results view
    trackEvent('quiz_completed', {
        profile: profile.title,
        total_score: totalScore,
        health_score: healthScore
    });

    // Animate everything after render
    setTimeout(() => {
        animateScoreRing(healthScore);
        animateCategoryBars();
        observeFadeInSections();
        launchConfetti();
        haptic('success');
    }, 300);
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

function animateCategoryBars() {
    document.querySelectorAll('.category-bar-fill').forEach(bar => {
        const targetWidth = bar.dataset.width;
        setTimeout(() => {
            bar.style.width = targetWidth + '%';
        }, 500);
    });
}

function observeFadeInSections() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-section').forEach(section => {
        observer.observe(section);
    });
}

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
    return `Fiz o Teste de Ansiedade por Disfunção Respiratória e descobri que meu padrão é: ${profile.title}. Faça o seu teste gratuito!`;
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
