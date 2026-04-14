// ============================================================
// Recruiter Dashboard — Client-side Logic
// Upload JD + multiple resumes → batch analyze → rank
// ============================================================

(function () {
    'use strict';

    const jdTextarea = document.getElementById('rec-jd-textarea');
    const dropzone = document.getElementById('rec-dropzone');
    const fileInput = document.getElementById('rec-file-input');
    const fileList = document.getElementById('rec-file-list');
    const fileCounter = document.getElementById('rec-file-counter');
    const btnAnalyze = document.getElementById('btn-rec-analyze');
    const uploadSection = document.getElementById('rec-upload-section');
    const loadingSection = document.getElementById('rec-loading');
    const resultsSection = document.getElementById('rec-results');
    const btnNewAnalysis = document.getElementById('btn-rec-new');
    const filterInput = document.getElementById('rec-filter-skill');
    const minScoreInput = document.getElementById('rec-min-score');

    let selectedFiles = [];
    let allCandidates = [];

    init();

    function init() {
        setupThemeToggle();
        setupDropzone();
        setupAnalyze();
        setupNewAnalysis();
        setupFilters();
    }

    // ── Theme Toggle ────────────────────────────────────────
    function setupThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        const sunIcon = toggleBtn.querySelector('.sun-icon');
        const moonIcon = toggleBtn.querySelector('.moon-icon');

        const savedTheme = localStorage.getItem('resumeai-theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }

        toggleBtn.addEventListener('click', () => {
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

    // ── Dropzone ────────────────────────────────────────────
    function setupDropzone() {
        dropzone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            Array.from(e.target.files).forEach(addFile);
        });
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            Array.from(e.dataTransfer.files).forEach(addFile);
        });
    }

    function addFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(ext)) { showToast('Unsupported file: ' + file.name, 'error'); return; }
        if (file.size > 10 * 1024 * 1024) { showToast('File too large: ' + file.name, 'error'); return; }
        if (selectedFiles.length >= 10) { showToast('Maximum 10 resumes allowed.', 'error'); return; }
        if (selectedFiles.some(f => f.name === file.name)) return; // Avoid duplicates

        selectedFiles.push(file);
        renderFileList();
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        renderFileList();
    }

    function renderFileList() {
        fileList.innerHTML = selectedFiles.map((f, i) => `
            <div class="rec-file-item">
                <div>
                    <span class="rec-file-name">📄 ${f.name}</span>
                    <span class="rec-file-size">${formatSize(f.size)}</span>
                </div>
                <button class="rec-file-remove" onclick="window._removeRecFile(${i})">✕ Remove</button>
            </div>
        `).join('');

        fileCounter.textContent = `${selectedFiles.length}/10 resumes selected`;
        btnAnalyze.disabled = selectedFiles.length === 0 || !jdTextarea.value.trim();
    }

    window._removeRecFile = function (i) { removeFile(i); };

    // ── Analyze ─────────────────────────────────────────────
    function setupAnalyze() {
        btnAnalyze.addEventListener('click', startBatchAnalysis);
        jdTextarea.addEventListener('input', () => {
            btnAnalyze.disabled = selectedFiles.length === 0 || !jdTextarea.value.trim();
        });
    }

    async function startBatchAnalysis() {
        if (selectedFiles.length === 0 || !jdTextarea.value.trim()) return;

        uploadSection.style.display = 'none';
        loadingSection.style.display = '';
        resultsSection.style.display = 'none';

        const formData = new FormData();
        formData.append('jobDescription', jdTextarea.value.trim());
        selectedFiles.forEach(f => formData.append('resumes', f));

        try {
            const response = await fetch('/api/recruiter/analyze', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Analysis failed');
            }
            const data = await response.json();
            loadingSection.style.display = 'none';
            displayResults(data);
        } catch (error) {
            loadingSection.style.display = 'none';
            uploadSection.style.display = '';
            showToast(error.message || 'Batch analysis failed.', 'error');
        }
    }

    // ── Display Results ─────────────────────────────────────
    function displayResults(data) {
        resultsSection.style.display = '';
        allCandidates = data.candidates || [];
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Summary stats
        const s = data.summary || {};
        document.getElementById('rec-stat-total').textContent = data.totalCandidates || 0;
        document.getElementById('rec-stat-avg').textContent = s.avgScore || 0;
        document.getElementById('rec-stat-excellent').textContent = s.excellentCount || 0;
        document.getElementById('rec-stat-strong').textContent = s.strongCount || 0;
        document.getElementById('rec-stat-time').textContent = data.processingTime || '-';

        renderCandidateTable(allCandidates);
    }

    function renderCandidateTable(candidates) {
        const container = document.getElementById('rec-candidate-list');
        if (!candidates.length) {
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No candidates match filters</div>';
            return;
        }

        container.innerHTML = candidates.map(c => {
            const rankClass = c.rank === 1 ? 'rec-rank-1' : c.rank === 2 ? 'rec-rank-2' : c.rank === 3 ? 'rec-rank-3' : 'rec-rank-default';
            const badge = c.rankBadge || { label: '-', color: '#666' };
            const skills = (c.topSkills || []).slice(0, 4);

            return `
                <div class="rec-candidate-row" data-rank="${c.rank}">
                    <div class="rec-rank ${rankClass}">${c.rank}</div>
                    <div>
                        <div class="rec-candidate-name">${c.candidateName || c.fileName}</div>
                        <div class="rec-candidate-role">${c.estimatedRole || ''} ${c.experienceLevel ? '· ' + c.experienceLevel : ''}</div>
                    </div>
                    <div class="rec-score-cell">
                        <div class="rec-score-val" style="color:${badge.color}">${c.compositeScore}</div>
                        <div class="rec-score-label-sm">Overall</div>
                    </div>
                    <div class="rec-score-cell">
                        <div class="rec-score-val" style="color:${c.atsGradeColor || '#4f8fff'}">${c.atsScore || '-'}</div>
                        <div class="rec-score-label-sm">ATS</div>
                    </div>
                    <div class="rec-score-cell">
                        <div class="rec-score-val" style="color:${c.semanticScore >= 70 ? '#00e676' : c.semanticScore >= 50 ? '#ffd740' : '#ffab40'}">${c.semanticScore || '-'}</div>
                        <div class="rec-score-label-sm">Semantic</div>
                    </div>
                    <div class="rec-skill-tags-cell">
                        ${skills.map(s => `<span class="rec-skill-mini">${s}</span>`).join('')}
                        ${c.skillCount > 4 ? `<span class="rec-skill-mini" style="opacity:0.5">+${c.skillCount - 4}</span>` : ''}
                    </div>
                    <div>
                        <button class="rec-expand-btn" onclick="window._toggleDetail(${c.rank})">Details ▾</button>
                    </div>
                </div>
                <div class="rec-candidate-details" id="rec-detail-${c.rank}">
                    <div class="rec-detail-grid">
                        <div class="rec-detail-section">
                            <h4>📝 Summary</h4>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">${c.summary || 'No AI summary available.'}</p>
                        </div>
                        <div class="rec-detail-section">
                            <h4>💪 Strengths</h4>
                            <ul class="rec-detail-list">
                                ${(c.strengths || []).map(s => `<li>${s}</li>`).join('') || '<li>No strength data</li>'}
                            </ul>
                        </div>
                        <div class="rec-detail-section">
                            <h4>✅ Matched JD Skills</h4>
                            <ul class="rec-detail-list">
                                ${(c.matchedSkills || []).map(s => `<li class="rec-match-tag">✓ ${s}</li>`).join('') || '<li>No data</li>'}
                            </ul>
                        </div>
                        <div class="rec-detail-section">
                            <h4>❌ Missing JD Skills</h4>
                            <ul class="rec-detail-list">
                                ${(c.missingSkills || []).map(s => `<li class="rec-miss-tag">✗ ${s}</li>`).join('') || '<li>No data</li>'}
                            </ul>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    window._toggleDetail = function (rank) {
        const detail = document.getElementById(`rec-detail-${rank}`);
        if (detail) detail.classList.toggle('open');
    };

    // ── Filters ─────────────────────────────────────────────
    function setupFilters() {
        if (filterInput) filterInput.addEventListener('input', applyFilters);
        if (minScoreInput) minScoreInput.addEventListener('input', applyFilters);
    }

    function applyFilters() {
        const skillFilter = (filterInput?.value || '').toLowerCase().trim();
        const minScore = parseInt(minScoreInput?.value || '0') || 0;

        const filtered = allCandidates.filter(c => {
            if (c.compositeScore < minScore) return false;
            if (skillFilter) {
                const skills = (c.topSkills || []).join(' ').toLowerCase();
                const name = (c.candidateName || '').toLowerCase();
                if (!skills.includes(skillFilter) && !name.includes(skillFilter)) return false;
            }
            return true;
        });

        renderCandidateTable(filtered);
    }

    // ── New Analysis ────────────────────────────────────────
    function setupNewAnalysis() {
        btnNewAnalysis.addEventListener('click', () => {
            resultsSection.style.display = 'none';
            uploadSection.style.display = '';
            selectedFiles = [];
            allCandidates = [];
            renderFileList();
            jdTextarea.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Utilities ────────────────────────────────────────────
    function formatSize(b) {
        if (b < 1024) return b + ' B';
        if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
        return (b / 1048576).toFixed(1) + ' MB';
    }

    function showToast(msg, type = 'info') {
        const old = document.querySelector('.toast');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.style.cssText = `position:fixed;top:80px;right:20px;z-index:1000;padding:14px 24px;background:${type === 'error' ? 'rgba(255,82,82,0.9)' : 'rgba(124,58,237,0.9)'};backdrop-filter:blur(10px);border-radius:12px;color:white;font-size:0.9rem;font-weight:500;box-shadow:0 8px 32px rgba(0,0,0,0.3);max-width:400px;`;
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 4000);
    }

})();
