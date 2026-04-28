// ============================================================
// App Controller — Full Resume Analysis Pipeline
// Features: ATS Score, JD Matching, Section Scoring,
//           Skill Gap/Roadmap, Mock Interview, Rewrite
// ============================================================

(function () {
    'use strict';

    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const dropzoneContent = document.getElementById('dropzone-content');
    const dropzoneSuccess = document.getElementById('dropzone-success');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const btnRemove = document.getElementById('btn-remove');
    const btnAnalyze = document.getElementById('btn-analyze');
    const heroSection = document.getElementById('hero-section');
    const uploadSection = document.getElementById('upload-section');
    const loadingSection = document.getElementById('loading-section');
    const resultsSection = document.getElementById('results-section');
    const geminiBadge = document.getElementById('gemini-badge');
    const btnNewAnalysis = document.getElementById('btn-new-analysis');
    const btnOpenEditor = document.getElementById('btn-open-editor');

    // JD elements
    const jdToggleBtn = document.getElementById('jd-toggle-btn');
    const jdToggleIcon = document.getElementById('jd-toggle-icon');
    const jdInputArea = document.getElementById('jd-input-area');
    const jdTextarea = document.getElementById('jd-textarea');

    const showcaseSections = document.querySelectorAll('.showcase-section');

    let selectedFile = null;
    let currentAnalysisData = null;

    init();

    function init() {
        setupThemeToggle();
        setupFileUpload();
        setupJDToggle();
        setupAnalyzeButton();
        setupNewAnalysis();
        setupEditorBtn();
        setupGitHubSync();
        setupGetStarted();
        setupLoginModal();
        checkGeminiStatus();
    }

    // ── Get Started Button ──────────────────────────────────
    function setupGetStarted() {
        const btn = document.getElementById('btn-get-started');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const uploadSection = document.getElementById('upload-section');
            if (uploadSection) {
                uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Add a brief highlight pulse to the upload card
                const resumeCard = document.getElementById('resume-card');
                if (resumeCard) {
                    resumeCard.style.transition = 'box-shadow 0.5s ease, border-color 0.5s ease';
                    resumeCard.style.boxShadow = '0 0 40px rgba(79, 143, 255, 0.3), 0 8px 32px rgba(0,0,0,0.3)';
                    resumeCard.style.borderColor = 'rgba(79, 143, 255, 0.4)';
                    setTimeout(() => {
                        resumeCard.style.boxShadow = '';
                        resumeCard.style.borderColor = '';
                    }, 1500);
                }
            }
        });
    }

    // ── Login Modal ─────────────────────────────────────────
    function setupLoginModal() {
        const loginBtn = document.getElementById('btn-header-login');
        const overlay = document.getElementById('login-modal-overlay');
        const closeBtn = document.getElementById('login-modal-close');
        const loginForm = document.getElementById('login-form');
        if (!loginBtn || !overlay) return;

        loginBtn.addEventListener('click', () => {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        function closeModal() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                // For now, show a toast — backend auth can be wired later
                showToast(`Welcome! Signed in as ${email}`, 'info');
                closeModal();
            });
        }

        // ── Social Login Handlers ───────────────────────────
        const googleBtn = document.getElementById('login-google-btn');
        const githubSocialBtn = document.getElementById('login-github-social-btn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                if (!window.firebaseAuth) return showToast('Firebase not initialized', 'error');
                handleFirebaseLogin(googleBtn, 'Google', window.firebaseAuth.loginWithGoogle(), closeModal);
            });
        }

        if (githubSocialBtn) {
            githubSocialBtn.addEventListener('click', () => {
                if (!window.firebaseAuth) return showToast('Firebase not initialized', 'error');
                handleFirebaseLogin(githubSocialBtn, 'GitHub', window.firebaseAuth.loginWithGitHub(), closeModal);
            });
        }
    }

    async function handleFirebaseLogin(btn, providerName, loginPromise, closeModalFn) {
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="login-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" dur="0.8s" from="0 12 12" to="360 12 12" repeatCount="indefinite"/></circle></svg>
            Connecting to ${providerName}...
        `;

        try {
            const result = await loginPromise;
            const user = result.user;
            
            // Save to Firestore Database
            await window.firebaseAuth.saveUserToDb(user);

            btn.innerHTML = `✅ Connected with ${providerName}!`;
            btn.style.borderColor = 'rgba(0, 230, 118, 0.4)';
            btn.style.background = 'rgba(0, 230, 118, 0.08)';
            btn.style.color = 'var(--accent-green)';

            showToast(`✅ Welcome ${user.displayName || user.email}!`, 'info');
            updateHeaderForLoggedInUser(user.displayName || user.email);

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                btn.style.borderColor = '';
                btn.style.background = '';
                btn.style.color = '';
                closeModalFn();
            }, 1200);
        } catch (error) {
            console.error("Login failed:", error);
            showToast(`Login failed: ${error.message}`, 'error');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    function updateHeaderForLoggedInUser(name) {
        const loginBtn = document.getElementById('btn-header-login');
        if (!loginBtn) return;
        const initial = name.charAt(0).toUpperCase();
        loginBtn.innerHTML = `
            <span class="header-user-avatar">${initial}</span>
            ${name.split(' ')[0]}
        `;
        loginBtn.classList.add('logged-in');
    }

    // On page load, restore logged-in state using Firebase
    if (window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                updateHeaderForLoggedInUser(user.displayName || user.email);
            }
        });
    }

    // ── Theme Toggle ─────────────────────────────────────────
    function setupThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        const sunIcon = toggleBtn.querySelector('.sun-icon');
        const moonIcon = toggleBtn.querySelector('.moon-icon');

        // Check saved theme or system preference
        const savedTheme = localStorage.getItem('resumeai-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }

        toggleBtn.addEventListener('click', () => {
            console.log("Theme toggle button clicked!");
            const isLight = document.body.classList.toggle('light-mode');
            if (isLight) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
                localStorage.setItem('resumeai-theme', 'light');
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
                localStorage.setItem('resumeai-theme', 'dark');
            }
        });
    }

    // ── Gemini Status ────────────────────────────────────────
    async function checkGeminiStatus() {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            const dot = geminiBadge.querySelector('.badge-dot');
            if (data.geminiEnabled) {
                dot.classList.add('active');
                geminiBadge.querySelector('span:last-child').textContent = 'Gemini AI Active';
                geminiBadge.style.borderColor = 'rgba(0, 230, 118, 0.2)';
            } else {
                dot.classList.add('inactive');
                geminiBadge.querySelector('span:last-child').textContent = 'NLP Mode Only';
            }
        } catch (e) {
            geminiBadge.querySelector('.badge-dot').classList.add('inactive');
            geminiBadge.querySelector('span:last-child').textContent = 'Server Offline';
        }
    }

    // ── JD Toggle ────────────────────────────────────────────
    function setupJDToggle() {
        jdToggleBtn.addEventListener('click', () => {
            const isOpen = jdInputArea.style.display !== 'none';
            jdInputArea.style.display = isOpen ? 'none' : 'block';
            jdToggleIcon.textContent = isOpen ? '+' : '−';
        });
    }

    // ── File Upload ──────────────────────────────────────────
    function setupFileUpload() {
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0]);
        });
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
        });
        btnRemove.addEventListener('click', (e) => { e.stopPropagation(); removeFile(); });
    }

    function handleFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(ext)) { showToast('Unsupported file type.', 'error'); return; }
        if (file.size > 10 * 1024 * 1024) { showToast('File too large (max 10MB).', 'error'); return; }
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatSize(file.size);
        dropzoneContent.style.display = 'none';
        dropzoneSuccess.style.display = 'flex';
        dropzone.style.borderColor = 'rgba(0, 230, 118, 0.3)';
        dropzone.style.background = 'rgba(0, 230, 118, 0.03)';
        btnAnalyze.disabled = false;
    }

    function removeFile() {
        selectedFile = null;
        fileInput.value = '';
        dropzoneContent.style.display = 'block';
        dropzoneSuccess.style.display = 'none';
        dropzone.style.borderColor = '';
        dropzone.style.background = '';
        btnAnalyze.disabled = true;
    }

    function formatSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    // ── Analyze ──────────────────────────────────────────────
    function setupAnalyzeButton() {
        btnAnalyze.addEventListener('click', startAnalysis);
    }

    function setupNewAnalysis() {
        btnNewAnalysis.addEventListener('click', () => {
            resultsSection.style.display = 'none';
            heroSection.style.display = '';
            uploadSection.style.display = '';
            showcaseSections.forEach(s => s.style.display = '');
            removeFile();
            jdTextarea.value = '';
            jdInputArea.style.display = 'none';
            jdToggleIcon.textContent = '+';
            currentAnalysisData = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function setupEditorBtn() {
        if (btnOpenEditor) {
            btnOpenEditor.addEventListener('click', () => {
                if (currentAnalysisData && window.openEditor) {
                    window.openEditor(
                        currentAnalysisData.llmAnalysis,
                        '',
                        currentAnalysisData.rewriteSuggestions
                    );
                }
            });
        }
    }

    function setupGitHubSync() {
        const btnUpload = document.getElementById('btn-sync-github');
        const inputUsername = document.getElementById('github-username');
        // Inline results card inside the github-card section (always visible)
        const githubCard = document.getElementById('github-card');
        if (!btnUpload || !inputUsername || !githubCard) return;

        // Create an inline results container inside the github card (not inside results-section)
        let inlineResultsCard = document.getElementById('github-inline-results');
        if (!inlineResultsCard) {
            inlineResultsCard = document.createElement('div');
            inlineResultsCard.id = 'github-inline-results';
            inlineResultsCard.style.cssText = 'display:none; margin-top:20px; padding:20px; background:var(--overlay-glass); border:1px solid var(--border-subtle); border-radius:16px;';
            githubCard.appendChild(inlineResultsCard);
        }

        btnUpload.addEventListener('click', async () => {
            const username = inputUsername.value.trim();
            if (!username) { showToast('Please enter a GitHub username', 'error'); return; }

            const originalHTML = btnUpload.innerHTML;
            btnUpload.innerHTML = '⏳ Analyzing Repos...';
            btnUpload.disabled = true;
            inlineResultsCard.style.display = 'none';

            try {
                const response = await fetch('/api/portfolio/github', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || err.error || 'Failed to sync GitHub');
                }

                const data = await response.json();

                let html = `
                    <div style="display:flex; gap:16px; align-items:center; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
                        <img src="https://github.com/${data.username}.png" width="52" height="52" style="border-radius:50%; border:2px solid var(--border-default);" onerror="this.style.display='none'">
                        <div>
                            <div style="font-weight:700; font-size:1.1rem; color:var(--text-primary);">@${data.username}</div>
                            <div style="color:var(--text-secondary); font-size:0.85rem; margin-top:3px;">✅ Analyzed ${data.reposCount} public repositories</div>
                        </div>
                        <div style="margin-left:auto; background:rgba(124,58,237,0.15); color:var(--accent-purple); padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:600;">GitHub AI</div>
                    </div>
                    <p style="margin:0 0 16px; color:var(--text-secondary); line-height:1.6; font-size:0.95rem;">${data.summary}</p>
                    <div style="margin-bottom:16px;">
                        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">Top Languages</div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                            ${(data.topLanguages || []).map(l => `<span class="skill-tag">${l}</span>`).join('')}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">📋 ATS-Optimized Resume Bullets</div>
                        <ul style="padding-left:18px; margin:0; color:var(--text-secondary); line-height:1.8;">
                            ${(data.resumeBullets || []).map(b => `<li style="margin-bottom:6px; font-size:0.9rem;">${b}</li>`).join('')}
                        </ul>
                    </div>
                `;

                inlineResultsCard.innerHTML = html;
                inlineResultsCard.style.display = 'block';
                inlineResultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                showToast('✅ GitHub Portfolio synced!');

            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btnUpload.innerHTML = originalHTML;
                btnUpload.disabled = false;
            }
        });
    }

    async function startAnalysis() {
        if (!selectedFile) return;

        heroSection.style.display = 'none';
        uploadSection.style.display = 'none';
        showcaseSections.forEach(s => s.style.display = 'none');
        resultsSection.style.display = 'none';
        loadingSection.style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const steps = ['step-extract', 'step-nlp', 'step-skills', 'step-ai', 'step-rewrite', 'step-roadmap', 'step-interview', 'step-jobs', 'step-score'];
        animateLoadingSteps(steps);

        const formData = new FormData();
        formData.append('resume', selectedFile);
        const jdText = jdTextarea.value.trim();
        if (jdText) formData.append('jobDescription', jdText);

        try {
            const response = await fetch('/api/analyze', { method: 'POST', body: formData });
            if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Analysis failed'); }
            const data = await response.json();
            currentAnalysisData = data;

            steps.forEach(id => { const el = document.getElementById(id); el.classList.remove('active'); el.classList.add('done'); });
            setTimeout(() => { loadingSection.style.display = 'none'; displayResults(data); }, 800);

        } catch (error) {
            loadingSection.style.display = 'none';
            heroSection.style.display = '';
            uploadSection.style.display = '';
            showcaseSections.forEach(s => s.style.display = '');
            showToast(error.message || 'Something went wrong.', 'error');
        }
    }

    function animateLoadingSteps(steps) {
        steps.forEach(id => { const el = document.getElementById(id); el.classList.remove('active', 'done'); });
        let current = 0;
        const interval = setInterval(() => {
            if (current > 0) { document.getElementById(steps[current - 1]).classList.remove('active'); document.getElementById(steps[current - 1]).classList.add('done'); }
            if (current < steps.length) { document.getElementById(steps[current]).classList.add('active'); current++; }
            else clearInterval(interval);
        }, 500);
    }

    // ── Display Results ──────────────────────────────────────
    function displayResults(data) {
        resultsSection.style.display = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const ats = data.atsScore;
        drawScoreGauge('score-gauge', ats.score, ats.gradeColor);

        document.getElementById('grade-letter').textContent = ats.grade;
        document.getElementById('grade-letter').style.borderColor = ats.gradeColor;
        document.getElementById('grade-letter').style.color = ats.gradeColor;
        document.getElementById('grade-label').textContent = ats.gradeLabel;

        const summary = document.getElementById('score-summary');
        const llm = data.llmAnalysis;
        summary.textContent = (llm?.summary && !llm?.error) ? llm.summary : `ATS score: ${ats.score}/100. ${ats.gradeLabel}.`;

        document.getElementById('word-count').textContent = data.resumeStats.wordCount;
        document.getElementById('skill-count-meta').textContent = data.resumeStats.skillCount;
        document.getElementById('process-time').textContent = data.processingTime;

        // JD Match Banner
        renderJDMatch(llm, data.hasJobDescription);

        // Candidate profile
        renderCandidateProfile(llm);

        // Section-wise scores
        renderSectionScores(llm);

        renderBreakdown(ats.breakdown);
        renderSkills(data.resumeSkills);
        renderSections(data.sectionAnalysis);
        renderAIInsights(llm);
        
        // Roadmap, Interview, Rewrite — Explicitly show if present
        if (data.skillGapRoadmap && !data.skillGapRoadmap.error) {
            document.getElementById('roadmap-card').style.display = 'block';
            renderRoadmap(data.skillGapRoadmap);
        } else {
            document.getElementById('roadmap-card').style.display = 'none';
        }

        if (data.mockInterview && !data.mockInterview.error) {
            document.getElementById('interview-card').style.display = 'block';
            renderMockInterview(data.mockInterview);
        } else {
            document.getElementById('interview-card').style.display = 'none';
        }

        if (data.rewriteSuggestions && !data.rewriteSuggestions.error) {
            document.getElementById('rewrite-card').style.display = 'block';
            renderRewrite(data.rewriteSuggestions);
        } else {
            document.getElementById('rewrite-card').style.display = 'none';
        }

        renderSuggestions(ats.suggestions, llm);

        // Semantic Match (only when JD provided)
        try {
            if (data.hasJobDescription && data.semanticMatch && !data.semanticMatch.error) {
                document.getElementById('semantic-match-card').style.display = 'block';
                renderSemanticMatch(data.semanticMatch, data.semanticSkillMatches);
            } else {
                document.getElementById('semantic-match-card').style.display = 'none';
            }
        } catch (e) { console.warn('Semantic render failed:', e); document.getElementById('semantic-match-card').style.display = 'none'; }

        // XAI Explanations
        try {
            if (data.explanations) {
                document.getElementById('xai-card').style.display = 'block';
                renderXAI(data.explanations);
            } else {
                document.getElementById('xai-card').style.display = 'none';
            }
        } catch (e) { console.warn('XAI render failed:', e); document.getElementById('xai-card').style.display = 'none'; }

        // Job Recommendations & Market Intelligence
        if (data.jobRecommendations) {
            document.getElementById('jobs-card').style.display = 'block';
            renderJobRecommendations(data.jobRecommendations);
        } else {
            document.getElementById('jobs-card').style.display = 'none';
        }
    }

    // ── JD Match Banner ──────────────────────────────────────
    function renderJDMatch(llm, hasJD) {
        const banner = document.getElementById('jd-match-banner');
        if (!hasJD || !llm?.jdMatch || llm.error) { banner.style.display = 'none'; return; }
        banner.style.display = '';
        const jd = llm.jdMatch;
        document.getElementById('jd-match-score').textContent = jd.matchScore || 0;
        document.getElementById('jd-match-level').textContent = jd.matchLevel || '-';
        document.getElementById('jd-match-summary').textContent = jd.matchSummary || '';

        const matchEl = document.getElementById('jd-matched');
        const missEl = document.getElementById('jd-missing');
        matchEl.innerHTML = (jd.matchedSkills || []).map(s => `<span class="jd-tag jd-tag-match">✓ ${s}</span>`).join('');
        missEl.innerHTML = (jd.missingSkills || []).map(s => `<span class="jd-tag jd-tag-miss">✗ ${s}</span>`).join('');
    }

    // ── Section-wise Scores ──────────────────────────────────
    function renderSectionScores(llm) {
        const card = document.getElementById('section-scores-card');
        const grid = document.getElementById('section-scores-grid');
        if (!llm?.sectionScores || llm.error) { card.style.display = 'none'; return; }
        card.style.display = '';
        grid.innerHTML = '';

        const icons = {
            contactInfo: '📇', summary: '📝', experience: '💼', education: '🎓',
            skills: '🎯', projects: '🛠️', certifications: '📜', formatting: '✨'
        };
        const labels = {
            contactInfo: 'Contact Info', summary: 'Summary', experience: 'Experience', education: 'Education',
            skills: 'Skills', projects: 'Projects', certifications: 'Certifications', formatting: 'Formatting'
        };

        Object.entries(llm.sectionScores).forEach(([key, val]) => {
            if (!val || val.score === undefined) return;
            const color = val.score >= 80 ? '#00e676' : val.score >= 60 ? '#ffd740' : val.score >= 40 ? '#ffab40' : '#ff5252';
            grid.innerHTML += `
                <div class="ss-item">
                    <div class="ss-header">
                        <span class="ss-icon">${icons[key] || '📄'}</span>
                        <span class="ss-label">${labels[key] || key}</span>
                        <span class="ss-score" style="color:${color}">${val.score}/100</span>
                    </div>
                    <div class="ss-bar-track"><div class="ss-bar-fill" style="width:${val.score}%;background:${color}"></div></div>
                    <p class="ss-feedback">${val.feedback || ''}</p>
                </div>`;
        });
    }

    // ── Candidate Profile ────────────────────────────────────
    function renderCandidateProfile(llm) {
        const card = document.getElementById('candidate-card');
        if (!llm || llm.error || !llm.candidateProfile) { card.style.display = 'none'; return; }
        card.style.display = '';
        const p = llm.candidateProfile;
        document.getElementById('profile-role').textContent = p.estimatedRole || 'Professional';
        document.getElementById('profile-level').textContent = p.experienceLevel || '-';
        document.getElementById('profile-industry').textContent = p.industry || '-';

        const rolesEl = document.getElementById('profile-roles');
        if (llm.suitableRoles?.length) {
            rolesEl.innerHTML = '<span class="profile-roles-label">Suitable Roles:</span>' +
                llm.suitableRoles.map(r => `<span class="profile-role-tag">${r.title} <small>(${r.fitLevel})</small></span>`).join('');
        } else rolesEl.innerHTML = '';
    }

    // ── Breakdown ────────────────────────────────────────────
    function renderBreakdown(breakdown) {
        const container = document.getElementById('breakdown-bars');
        container.innerHTML = '';
        const colors = {
            sectionPresence: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            formatting: 'linear-gradient(135deg, #ffab40, #ffd740)',
            skillDensity: 'linear-gradient(135deg, #4f8fff, #00d4ff)',
            contentQuality: 'linear-gradient(135deg, #00e676, #69f0ae)'
        };
        Object.entries(breakdown).forEach(([key, item]) => {
            container.innerHTML += `
                <div class="breakdown-bar-item">
                    <div class="breakdown-bar-header"><span class="breakdown-bar-label">${item.label}</span><span class="breakdown-bar-value">${item.score}%</span></div>
                    <div class="breakdown-bar-track"><div class="breakdown-bar-fill" style="background:${colors[key] || 'var(--gradient-primary)'};" data-width="${item.score}%"></div></div>
                    <span class="breakdown-bar-weight">Weight: ${item.weight}</span>
                </div>`;
        });
        setTimeout(() => { container.querySelectorAll('.breakdown-bar-fill').forEach(b => b.style.width = b.dataset.width); }, 100);
    }

    function renderSkills(skills) {
        const c = document.getElementById('skills-categories');
        document.getElementById('skill-count').textContent = `${skills.count} skills`;
        c.innerHTML = '';
        Object.entries(skills.categorized).forEach(([cat, list]) => {
            c.innerHTML += `<div class="skill-category"><div class="skill-category-name">${cat} (${list.length})</div><div class="skill-tags">${list.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>`;
        });
    }

    function renderSections(sec) {
        let h = '';
        sec.found.forEach(n => h += `<div class="section-item"><div class="section-status found">✓</div><span class="section-name">${n}</span></div>`);
        sec.missing.forEach(n => h += `<div class="section-item"><div class="section-status missing">✗</div><span class="section-name missing-text">${n} — Consider adding</span></div>`);
        document.getElementById('sections-list').innerHTML = h;
    }

    function renderAIInsights(llm) {
        const card = document.getElementById('ai-card');
        const c = document.getElementById('ai-content');
        if (!llm || llm.error) { card.style.display = 'none'; return; }
        card.style.display = '';
        c.innerHTML = '';

        if (llm.overallQuality) c.innerHTML += `<div class="ai-section"><div class="ai-section-title">Overall: ${llm.overallQuality} ${llm.qualityScore ? `(${llm.qualityScore}/100)` : ''}</div><div class="ai-section-text">${llm.summary || ''}</div></div>`;

        const g = [];
        if (llm.strengths?.length) g.push(`<div class="ai-section"><div class="ai-section-title">💪 Strengths</div><ul class="ai-list">${llm.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>`);
        if (llm.weaknesses?.length) g.push(`<div class="ai-section"><div class="ai-section-title">⚠️ Areas to Improve</div><ul class="ai-list">${llm.weaknesses.map(w => `<li>${w}</li>`).join('')}</ul></div>`);
        if (g.length) c.innerHTML += `<div class="ai-grid">${g.join('')}</div>`;

        if (llm.atsCompatibility) {
            c.innerHTML += `<div class="ai-section"><div class="ai-section-title">🎯 ATS Compatibility (${llm.atsCompatibility.score}/100)</div><ul class="ai-list">${(llm.atsCompatibility.tips || []).map(t => `<li>${t}</li>`).join('')}${(llm.atsCompatibility.issues || []).map(i => `<li style="color:var(--accent-orange)">${i}</li>`).join('')}</ul></div>`;
        }

        if (llm.suggestedKeywords?.length) c.innerHTML += `<div class="ai-section"><div class="ai-section-title">🔑 Keywords to Add</div><div class="keyword-tags">${llm.suggestedKeywords.map(k => `<span class="skill-tag" style="background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.3);color:#a855f7">${k}</span>`).join('')}</div></div>`;
    }

    // ── Skill Gap + Learning Roadmap ─────────────────────────
    function renderRoadmap(roadmap) {
        const card = document.getElementById('roadmap-card');
        const content = document.getElementById('roadmap-content');
        if (!roadmap || roadmap.error) { card.style.display = 'none'; return; }
        card.style.display = '';
        content.innerHTML = '';

        // Header info
        content.innerHTML += `<div class="rm-header"><div class="rm-meta"><span class="rm-badge">📊 ${roadmap.currentLevel || 'Intermediate'}</span><span class="rm-badge rm-badge-alt">⏳ ${roadmap.estimatedTimeline || '3-6 months'}</span></div><p class="rm-trajectory">${roadmap.careerTrajectory || ''}</p></div>`;

        // Skill Gaps
        if (roadmap.skillGaps?.length) {
            let gapHTML = '<div class="rm-gaps"><h4 class="rm-section-title">🎯 Skill Gaps Identified</h4><div class="rm-gap-grid">';
            roadmap.skillGaps.forEach(gap => {
                const priorityColor = gap.priority === 'Critical' ? '#ff5252' : gap.priority === 'High' ? '#ffab40' : '#4f8fff';
                gapHTML += `<div class="rm-gap-item"><div class="rm-gap-header"><span class="rm-gap-name">${gap.skill}</span><span class="rm-gap-priority" style="color:${priorityColor}">${gap.priority}</span></div><p class="rm-gap-reason">${gap.reason}</p><div class="rm-gap-level">${gap.currentLevel || 'None'} → ${gap.targetLevel || 'Advanced'}</div></div>`;
            });
            gapHTML += '</div></div>';
            content.innerHTML += gapHTML;
        }

        // Learning Roadmap Phases
        if (roadmap.learningRoadmap?.length) {
            let phaseHTML = '<div class="rm-phases"><h4 class="rm-section-title">🗺️ Learning Roadmap</h4>';
            roadmap.learningRoadmap.forEach((phase, i) => {
                phaseHTML += `<div class="rm-phase"><div class="rm-phase-header"><span class="rm-phase-num">${i + 1}</span><div><h5 class="rm-phase-title">${phase.title}</h5><span class="rm-phase-duration">${phase.duration}</span></div></div><div class="rm-phase-skills">${(phase.skills || []).map(s => `<span class="rm-skill-tag">${s}</span>`).join('')}</div>`;
                if (phase.resources?.length) {
                    phaseHTML += `<div class="rm-resources">${phase.resources.map(r => `<div class="rm-resource"><span class="rm-resource-type">${r.type}</span><span class="rm-resource-name">${r.name}</span><span class="rm-resource-platform">${r.platform}</span></div>`).join('')}</div>`;
                }
                if (phase.milestone) phaseHTML += `<div class="rm-milestone">🏁 ${phase.milestone}</div>`;
                phaseHTML += '</div>';
            });
            phaseHTML += '</div>';
            content.innerHTML += phaseHTML;
        }

        // Certification Path
        if (roadmap.certificationPath?.length) {
            content.innerHTML += `<div class="rm-certs"><h4 class="rm-section-title">📜 Recommended Certifications</h4><div class="rm-cert-list">${roadmap.certificationPath.map(c => `<div class="rm-cert-item"><span class="rm-cert-name">${c.name}</span><span class="rm-cert-provider">${c.provider}</span><span class="rm-cert-rel">${c.relevance}</span></div>`).join('')}</div></div>`;
        }
    }

    // ── Mock Interview ───────────────────────────────────────
    function renderMockInterview(interview) {
        const card = document.getElementById('interview-card');
        const content = document.getElementById('interview-content');
        if (!interview || interview.error) { card.style.display = 'none'; return; }
        card.style.display = '';
        content.innerHTML = '';

        // Header
        content.innerHTML += `<div class="iv-header"><span class="iv-role">🎯 ${interview.candidateRole || 'Role'}</span><span class="iv-level">${interview.difficultyLevel || 'Mid'} Level</span></div>`;

        // Questions
        if (interview.questions?.length) {
            const catColors = { Technical: '#4f8fff', Behavioral: '#a855f7', Situational: '#00d4ff', 'Experience-Based': '#ffd740', 'Problem-Solving': '#ff6e40' };
            let qHTML = '<div class="iv-questions">';
            interview.questions.forEach((q, i) => {
                const color = catColors[q.category] || '#4f8fff';
                const diffColor = q.difficulty === 'Hard' ? '#ff5252' : q.difficulty === 'Medium' ? '#ffab40' : '#00e676';
                qHTML += `
                    <div class="iv-question">
                        <div class="iv-q-header">
                            <span class="iv-q-num">Q${i + 1}</span>
                            <span class="iv-q-cat" style="color:${color};border-color:${color}">${q.category}</span>
                            <span class="iv-q-diff" style="color:${diffColor}">${q.difficulty}</span>
                        </div>
                        <p class="iv-q-text">${q.question}</p>
                        <details class="iv-q-details">
                            <summary class="iv-q-summary">💡 Tip & Sample Answer</summary>
                            <div class="iv-q-answer">
                                <div class="iv-tip"><strong>💡 Tip:</strong> ${q.tip}</div>
                                <div class="iv-sample"><strong>📝 Sample:</strong> ${q.sampleAnswer}</div>
                            </div>
                        </details>
                    </div>`;
            });
            qHTML += '</div>';
            content.innerHTML += qHTML;
        }

        // Tips & Checklist
        let footer = '';
        if (interview.interviewTips?.length) {
            footer += `<div class="iv-tips"><h4>💡 Interview Preparation Tips</h4><ul>${interview.interviewTips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
        }
        if (interview.prepChecklist?.length) {
            footer += `<div class="iv-checklist"><h4>✅ Preparation Checklist</h4>${interview.prepChecklist.map(c => `<div class="iv-check-item"><span class="iv-check-box">☐</span>${c}</div>`).join('')}</div>`;
        }
        content.innerHTML += footer;
    }

    // ── Rewrite ──────────────────────────────────────────────
    function renderRewrite(rw) {
        const card = document.getElementById('rewrite-card');
        const content = document.getElementById('rewrite-content');
        if (!rw || rw.error) { card.style.display = 'none'; return; }
        card.style.display = '';
        content.innerHTML = '';

        const blocks = [
            { title: '📝 Optimized Professional Summary', text: rw.rewrittenSummary },
            { title: '🎯 ATS-Optimized Title', text: rw.atsOptimizedTitle },
            { title: '💼 Rewritten Experience Bullets', text: (rw.rewrittenExperience || []).map(b => `• ${b}`).join('\n') },
            { title: '🔧 Optimized Skills Section', text: rw.rewrittenSkills },
            { title: '✉️ Cover Letter Opener', text: rw.coverLetterOpener }
        ];

        blocks.forEach(b => {
            if (!b.text) return;
            content.innerHTML += `
                <div class="rewrite-block">
                    <div class="rewrite-block-title"><span>${b.title}</span><button class="btn-copy" onclick="copyText(this, '${escapeAttr(b.text)}')">📋 Copy</button></div>
                    <div class="rewrite-block-text">${b.text}</div>
                </div>`;
        });

        if (rw.improvementNotes?.length) {
            content.innerHTML += `<div class="rewrite-notes">${rw.improvementNotes.map(n => `<div class="rewrite-note">💡 ${n}</div>`).join('')}</div>`;
        }

        renderLinkedIn(rw);
    }

    function renderLinkedIn(rw) {
        const card = document.getElementById('linkedin-card');
        const content = document.getElementById('linkedin-content');
        if (!rw || (!rw.linkedInHeadline && !rw.linkedInAbout)) { card.style.display = 'none'; return; }
        card.style.display = '';
        content.innerHTML = '';
        if (rw.linkedInHeadline) content.innerHTML += `<div class="linkedin-block"><div class="linkedin-block-title"><span>🏷️ Headline</span><button class="btn-copy" onclick="copyText(this, '${escapeAttr(rw.linkedInHeadline)}')">📋 Copy</button></div><div class="linkedin-block-text">${rw.linkedInHeadline}</div></div>`;
        if (rw.linkedInAbout) content.innerHTML += `<div class="linkedin-block"><div class="linkedin-block-title"><span>📄 About Section</span><button class="btn-copy" onclick="copyText(this, '${escapeAttr(rw.linkedInAbout)}')">📋 Copy</button></div><div class="linkedin-block-text">${rw.linkedInAbout}</div></div>`;
    }

    function escapeAttr(str) {
        return (str || '').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/"/g, '&quot;');
    }

    function renderSuggestions(nlpSug, llm) {
        const c = document.getElementById('suggestions-list');
        c.innerHTML = '';
        const all = [...nlpSug];
        if (llm?.suggestions && !llm.error) llm.suggestions.forEach(s => all.push({ type: 'info', icon: '🤖', title: 'AI Recommendation', description: s }));
        all.forEach(item => {
            c.innerHTML += `<div class="suggestion-item ${item.type}"><span class="suggestion-icon">${item.icon}</span><div class="suggestion-text"><h4>${item.title}</h4><p>${item.description}</p></div></div>`;
        });
    }

    // ── Copy ─────────────────────────────────────────────────
    window.copyText = function (btn, text) {
        const decoded = text.replace(/\\n/g, '\n').replace(/&quot;/g, '"').replace(/\\'/g, "'");
        navigator.clipboard.writeText(decoded).then(() => {
            btn.classList.add('copied');
            btn.textContent = '✓ Copied';
            setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋 Copy'; }, 2000);
        });
    };

    // ── Toast ────────────────────────────────────────────────
    function showToast(msg, type = 'info') {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.style.cssText = `position:fixed;top:80px;right:20px;z-index:1000;padding:14px 24px;background:${type === 'error' ? 'rgba(255,82,82,0.9)' : 'rgba(79,143,255,0.9)'};backdrop-filter:blur(10px);border-radius:12px;color:white;font-size:0.9rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.3);animation:fadeUp 0.3s ease-out;max-width:400px;`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; t.style.transition = 'all 0.3s ease'; setTimeout(() => t.remove(), 300); }, 4000);
    }

    // ── Semantic Match Rendering ───────────────────────
    function renderSemanticMatch(sm, skillMatches) {
        const container = document.getElementById('semantic-content');
        
        let html = `
            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                <div style="position: relative; width: 100px; height: 100px;">
                    <svg viewBox="0 0 36 36" style="width:100%; height:100%; transform: rotate(-90deg);">
                        <path stroke-dasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border-default)" stroke-width="3" />
                        <path stroke-dasharray="${sm.overallScore}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${sm.matchColor}" stroke-width="3" stroke-linecap="round" />
                    </svg>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <span style="font-size: 1.5rem; font-weight: bold; color: ${sm.matchColor}; font-family: 'Space Grotesk', sans-serif;">${sm.overallScore}%</span>
                    </div>
                </div>
                <div>
                    <h4 style="font-size: 1.3rem; margin: 0; color: ${sm.matchColor};">${sm.matchLevel}</h4>
                    <p style="color: var(--text-secondary); margin-top: 5px; font-size: 0.9rem;">${sm.note}</p>
                </div>
            </div>
        `;

        // Semantic Skill Matches
        if (skillMatches && skillMatches.matches?.length > 0) {
            html += `
                <div style="margin-top: 20px; border-top: 1px solid var(--border-subtle); padding-top: 15px;">
                    <h5 style="color: var(--text-primary); margin-bottom: 12px; font-size: 0.95rem;">Semantic Skill Equivalencies Detected</h5>
                    <div style="display: grid; gap: 8px;">
                        ${skillMatches.matches.map(m => `
                            <div style="background: var(--overlay-glass); border: 1px solid var(--border-subtle); padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <span style="color: var(--text-primary); font-weight: 500; font-size: 0.9rem;">${m.resumeSkill}</span>
                                    <span style="color: var(--text-muted);">≈</span>
                                    <span style="color: #4f8fff; font-size: 0.9rem;">${m.jdPhrase}</span>
                                </div>
                                <span style="background: rgba(0, 230, 118, 0.1); color: #00e676; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">
                                    ${m.similarity}% Match
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    // ── Explainable AI (XAI) Rendering ───────────────────
    function renderXAI(explanations) {
        const container = document.getElementById('xai-content');

        let html = `
            <div style="margin-bottom: 20px; padding: 15px; background: rgba(79, 143, 255, 0.1); border-left: 4px solid #4f8fff; border-radius: 4px;">
                <p style="margin: 0; color: var(--text-primary); font-size: 0.95rem;">${explanations.scoreContext}</p>
            </div>
        `;

        // Boosters
        if (explanations.boosters?.length > 0) {
            html += `<h4 style="color: var(--accent-green); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; font-size: 1rem;"><span style="font-size: 0.8rem;">▲</span> Score Boosters (${explanations.boosters.length})</h4>`;
            html += `<div style="display: grid; gap: 8px;">`;
            html += explanations.boosters.map(b => `
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(0, 230, 118, 0.05); border: 1px solid rgba(0, 230, 118, 0.15); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 1.2rem;">${b.icon}</div>
                    <div style="flex: 1;">
                        <div style="color: var(--text-primary); font-size: 0.9rem;">${b.text}</div>
                        ${b.category ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top:2px;">${b.category}</div>` : ''}
                    </div>
                    <div style="color: #00e676; font-weight:700; font-size:0.9rem; font-family:'Space Grotesk',sans-serif; white-space:nowrap;">${b.impact}</div>
                </div>
            `).join('');
            html += `</div>`;
        }

        // Reducers
        if (explanations.reducers?.length > 0) {
            html += `<h4 style="color: #ff5252; margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; font-size: 1rem;"><span style="font-size: 0.8rem;">▼</span> Score Reducers (${explanations.reducers.length})</h4>`;
            html += `<div style="display: grid; gap: 8px;">`;
            html += explanations.reducers.map(b => `
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(255, 82, 82, 0.05); border: 1px solid rgba(255, 82, 82, 0.15); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 1.2rem;">${b.icon}</div>
                    <div style="flex: 1;">
                        <div style="color: var(--text-primary); font-size: 0.9rem;">${b.text}</div>
                        ${b.category ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top:2px;">${b.category}</div>` : ''}
                    </div>
                    <div style="color: #ff5252; font-weight:700; font-size:0.9rem; font-family:'Space Grotesk',sans-serif; white-space:nowrap;">${b.impact}</div>
                </div>
            `).join('');
            html += `</div>`;
        }

        // Insights
        if (explanations.insights?.length > 0) {
            html += `<h4 style="color: var(--accent-yellow, #ffd740); margin: 20px 0 10px; display: flex; align-items: center; gap: 8px; font-size: 1rem;">💡 Insights (${explanations.insights.length})</h4>`;
            html += `<div style="display: grid; gap: 8px;">`;
            html += explanations.insights.map(b => `
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(255, 215, 64, 0.05); border: 1px solid rgba(255, 215, 64, 0.2); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 1.2rem;">${b.icon}</div>
                    <div style="flex: 1;">
                        <div style="color: var(--text-primary); font-size: 0.9rem;">${b.text}</div>
                        ${b.category ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top:2px;">${b.category}</div>` : ''}
                    </div>
                    <div style="color: #ffd740; font-weight:700; font-size:0.9rem; white-space:nowrap;">${b.impact}</div>
                </div>
            `).join('');
            html += `</div>`;
        }

        container.innerHTML = html;
    }

    // ── Job Recommendations & Market Intelligence Rendering
    function renderJobRecommendations(jobs) {
        const container = document.getElementById('jobs-content');
        if (!container) return;
        
        let html = '';

        // Handle error state
        if (!jobs || jobs.error) {
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; background: rgba(255, 171, 64, 0.05); border: 1px dashed rgba(255, 171, 64, 0.3); border-radius: 16px;">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">🤖</div>
                    <h4 style="color: var(--accent-orange); margin-bottom: 8px;">Market Intelligence Temporarily Unavailable</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 400px; margin: 0 auto;">Our AI engine is currently experiencing high demand. Please try again in a few minutes to unlock tailored job matches and market insights.</p>
                </div>
            `;
            return;
        }

        // Market Intelligence
        if (jobs.marketIntelligence) {
            const mi = jobs.marketIntelligence;
            const salaryHtml = mi.averageSalary ? `<div style="background: var(--overlay-glass); padding: 15px; border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center;"><div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Est. Salary</div><div style="color: #4f8fff; font-size: 1.1rem; font-weight: bold; margin-top: 5px; font-family: 'Space Grotesk', sans-serif;">${mi.averageSalary}</div></div>` : '';
            const demandHtml = mi.demandLevel ? `<div style="background: var(--overlay-glass); padding: 15px; border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center;"><div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Demand Level</div><div style="color: #ffab40; font-size: 1.1rem; font-weight: bold; margin-top: 5px;">${mi.demandLevel}</div></div>` : '';

            html += `
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="background: var(--overlay-glass); padding: 15px; border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center;">
                        <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">Dominant Cluster</div>
                        <div style="color: var(--text-primary); font-size: 1rem; font-weight: 500; margin-top: 5px;">${jobs.careerCluster || 'General'}</div>
                    </div>
                    ${salaryHtml}
                    ${demandHtml}
                </div>
                
                ${mi.insight ? `<div style="background: var(--overlay-light); padding: 15px; border-radius: 8px; border-left: 2px solid #00d4ff; margin-bottom: 20px;"><p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">${mi.insight}</p></div>` : ''}
                
                ${mi.trendingSkills?.length > 0 ? `
                <div style="margin-bottom: 25px;">
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">🔥 Trending Skills in this Market:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${mi.trendingSkills.map(s => `<span style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(79, 143, 255, 0.15)); border: 1px solid rgba(124, 58, 237, 0.3); color: #a855f7; padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 500;">${s}</span>`).join('')}
                    </div>
                </div>` : ''}
            `;
        }

        // Recommendations
        if (jobs.recommendations?.length > 0) {
            html += `<h4 style="color: var(--text-primary); margin-bottom: 15px; padding-top: 15px; border-top: 1px solid var(--border-subtle);">🎯 Tailored Job Matches</h4>`;
            html += `<div style="display: grid; gap: 15px;">`;
            
            html += jobs.recommendations.map(job => `
                <div style="background: var(--overlay-glass); border: 1px solid var(--border-subtle); padding: 20px; border-radius: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <h4 style="color: var(--text-primary); font-size: 1.1rem; margin: 0 0 6px;">${job.title}</h4>
                            <div style="display: flex; gap: 12px; color: var(--text-secondary); font-size: 0.8rem;">
                                <span>🏢 ${job.companyType || 'Various'}</span>
                                ${job.salaryRange ? `<span>💵 ${job.salaryRange}</span>` : ''}
                                ${job.growthPotential ? `<span>📈 Growth: ${job.growthPotential}</span>` : ''}
                            </div>
                        </div>
                        <div style="background: ${job.matchScore >= 80 ? 'rgba(0, 230, 118, 0.1)' : job.matchScore >= 60 ? 'rgba(255, 215, 64, 0.1)' : 'rgba(255, 171, 64, 0.1)'}; 
                                    color: ${job.matchScore >= 80 ? 'var(--accent-green)' : job.matchScore >= 60 ? 'var(--accent-yellow)' : 'var(--accent-orange)'}; 
                                    padding: 6px 12px; border-radius: 8px; font-weight: bold; font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem;">
                            ${job.matchScore || '-'}% Fit
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 15px;">${job.description || ''}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 6px;">✓ You Have:</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                ${(job.candidateHas || []).map(s => `<span style="color: var(--accent-green); font-size: 0.75rem; background: rgba(0,230,118,0.1); padding: 3px 8px; border-radius: 4px;">${s}</span>`).join('')}
                            </div>
                        </div>
                        ${job.candidateMissing?.length ? `
                        <div>
                            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 6px;">✗ Need to Learn:</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                ${(job.candidateMissing || []).map(s => `<span style="color: var(--accent-orange); font-size: 0.75rem; background: rgba(255,171,64,0.1); padding: 3px 8px; border-radius: 4px;">${s}</span>`).join('')}
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            `).join('');
            
            html += `</div>`;
        }

        // If nothing was rendered, show a "no results" message
        if (!html) {
            html = `
                <div style="padding: 30px; text-align: center; border: 1px dashed var(--border-subtle); border-radius: 12px;">
                    <p style="color: var(--text-secondary); margin: 0;">No specific job matches found for your profile. Try adding more skills to your resume for better results.</p>
                </div>
            `;
        }

        container.innerHTML = html;
    }



})();