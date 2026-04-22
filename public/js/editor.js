// ============================================================
// Interactive Editor Controller — v2.0
// Full WYSIWYG editor with templates, toolbar, AI panel, PDF export
// ============================================================

(function () {
    'use strict';

    const editorSection   = document.getElementById('editor-section');
    const editorCanvas    = document.getElementById('editor-canvas');
    const suggestionsPanel = document.getElementById('editor-suggestions-panel');
    const btnExport       = document.getElementById('btn-export-pdf');
    const btnClose        = document.getElementById('btn-close-editor');

    let currentTemplate = 'classic';
    let globalRewrite   = null;

    // ── Public API ───────────────────────────────────────────
    window.openEditor = function (llmAnalysis, originalText, rewriteSuggestions) {
        if (!editorSection) return;
        document.getElementById('results-section').style.display = 'none';
        
        const heroSection = document.getElementById('hero-section');
        if (heroSection) heroSection.style.display = 'none';
        
        editorSection.style.display = 'block';

        globalRewrite = rewriteSuggestions || llmAnalysis?.rewriteSuggestions || null;

        injectToolbar();
        
        const savedDraft = localStorage.getItem('resume_editor_draft');
        if (savedDraft && confirm('We found a saved draft of your resume. Would you like to restore it?')) {
            editorCanvas.innerHTML = savedDraft;
        } else {
            populateCanvas(llmAnalysis, rewriteSuggestions);
        }
        
        populateSuggestions(llmAnalysis, rewriteSuggestions);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Close ────────────────────────────────────────────────
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            editorSection.style.display = 'none';
            document.getElementById('results-section').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Toolbar & Layout injection ───────────────────────────
    function injectToolbar() {
        if (document.getElementById('editor-layout-wrapper')) return;

        // We wrap the existing bits in a beautiful 3-column layout
        const workspace = document.querySelector('.editor-workspace');
        const sidebar = document.querySelector('.editor-sidebar');
        const canvasContainer = document.querySelector('.editor-canvas-container');

        // Extract the AI panel to move to the right
        const aiPanel = sidebar;
        aiPanel.classList.add('right-sidebar');

        // Create new left sidebar for Settings
        const settingsSidebar = document.createElement('div');
        settingsSidebar.className = 'editor-sidebar left-sidebar';
        settingsSidebar.innerHTML = `
            <div class="editor-panel settings-panel">
                <h3><span style="font-size:1.2rem;">🎨</span> Resume Settings</h3>
                
                <div class="settings-group">
                    <span class="settings-label">Template Style</span>
                    <div class="grid-2-col">
                        <button class="tmpl-btn active" data-tmpl="classic">Classic</button>
                        <button class="tmpl-btn" data-tmpl="modern">Modern</button>
                        <button class="tmpl-btn" data-tmpl="minimal">Minimal</button>
                        <button class="tmpl-btn" data-tmpl="bold">Bold</button>
                    </div>
                </div>

                <div class="settings-group">
                    <span class="settings-label">Accent Color</span>
                    <div class="color-picker-grid">
                        <button class="color-btn active" data-color="#2563eb" style="background:#2563eb" title="Royal Blue"></button>
                        <button class="color-btn" data-color="#7c3aed" style="background:#7c3aed" title="Purple"></button>
                        <button class="color-btn" data-color="#059669" style="background:#059669" title="Emerald"></button>
                        <button class="color-btn" data-color="#dc2626" style="background:#dc2626" title="Crimson"></button>
                        <button class="color-btn" data-color="#b45309" style="background:#b45309" title="Amber"></button>
                        <button class="color-btn" data-color="#0f172a" style="background:#0f172a" title="Slate"></button>
                        <button class="color-btn" data-color="#ec4899" style="background:#ec4899" title="Pink"></button>
                        <button class="color-btn" data-color="#14b8a6" style="background:#14b8a6" title="Teal"></button>
                    </div>
                </div>

                <div class="settings-group">
                    <span class="settings-label">Typography Size</span>
                    <div class="font-size-controls">
                        <button class="font-btn" data-size="9">Aa<br><small>Small</small></button>
                        <button class="font-btn active" data-size="10">Aa<br><small>Normal</small></button>
                        <button class="font-btn" data-size="11">Aa<br><small>Large</small></button>
                    </div>
                </div>

                <div class="settings-actions">
                    <button class="toolbar-btn btn-primary" id="btn-add-section">
                        <span style="font-size:1.1rem">+</span> Add Custom Section
                    </button>
                    <button class="toolbar-btn btn-outline" id="btn-save-draft">
                        💾 Save Draft
                    </button>
                    <button class="toolbar-btn toolbar-btn-danger" id="btn-clear">
                        ↺ Reset to AI Version
                    </button>
                </div>
            </div>
        `;

        // Wrap them up 
        workspace.innerHTML = '';
        workspace.classList.add('premium-workspace');
        workspace.appendChild(settingsSidebar);
        workspace.appendChild(canvasContainer);
        workspace.appendChild(aiPanel);

        // Bind Template
        settingsSidebar.querySelectorAll('.tmpl-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settingsSidebar.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentTemplate = btn.dataset.tmpl;
                applyTemplate(currentTemplate);
            });
        });

        // Bind Colors
        settingsSidebar.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settingsSidebar.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyAccentColor(btn.dataset.color);
            });
        });

        // Bind Font Size
        settingsSidebar.querySelectorAll('.font-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                settingsSidebar.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const size = btn.dataset.size;
                document.querySelectorAll('.doc-desc, .doc-bullets, .doc-skills, .doc-item-meta')
                    .forEach(el => el.style.fontSize = size + 'pt');
            });
        });

        // Add Section
        document.getElementById('btn-add-section').addEventListener('click', addSection);
        
        // Save Draft
        document.getElementById('btn-save-draft').addEventListener('click', () => {
            const paper = document.getElementById('editor-canvas');
            if(paper) {
                localStorage.setItem('resume_editor_draft', paper.innerHTML);
                const btn = document.getElementById('btn-save-draft');
                btn.innerHTML = '✅ Saved to Drafts';
                btn.style.color = '#00e676';
                btn.style.borderColor = 'rgba(0, 230, 118, 0.4)';
                btn.style.background = 'rgba(0, 230, 118, 0.1)';
                setTimeout(() => {
                    btn.innerHTML = '💾 Save Draft';
                    btn.style.color = '';
                    btn.style.borderColor = '';
                    btn.style.background = '';
                }, 2000);
            }
        });

        // Reset
        document.getElementById('btn-clear').addEventListener('click', () => {
            if (confirm('Reset the resume to the AI-generated version? This will overwrite your current edits.')) {
                populateCanvas(null, globalRewrite);
                localStorage.removeItem('resume_editor_draft');
            }
        });
    }

    // ── Template Styles ──────────────────────────────────────
    function applyTemplate(tmpl) {
        const paper = document.getElementById('editor-canvas');
        paper.className = 'editor-paper tmpl-' + tmpl;
    }

    function applyAccentColor(color) {
        document.documentElement.style.setProperty('--doc-accent', color);
        document.querySelectorAll('.doc-section-title').forEach(el => {
            el.style.color = color;
            el.style.borderBottomColor = color;
        });
        document.querySelectorAll('.doc-name').forEach(el => {
            el.style.color = color;
        });
    }

    // ── Canvas Population ────────────────────────────────────
    function populateCanvas(llm, rw) {
        if (!editorCanvas) return;

        const profile   = llm?.candidateProfile || {};
        const role      = profile.estimatedRole || 'Professional';
        const summary   = rw?.rewrittenSummary || llm?.summary || 'A results-driven professional with a proven track record of delivering impactful solutions.';
        const skills    = rw?.rewrittenSkills   || (profile.topSkills || []).join(' • ') || 'Add your skills here.';
        const title     = rw?.atsOptimizedTitle || role;

        let expBullets = '';
        if (rw?.rewrittenExperience?.length) {
            expBullets = `<ul class="doc-bullets">${rw.rewrittenExperience.map(b => `<li>${b}</li>`).join('')}</ul>`;
        } else {
            expBullets = `<ul class="doc-bullets"><li>Click any text to edit it and add your experience details with quantifiable achievements.</li></ul>`;
        }

        editorCanvas.innerHTML = `
            <div class="doc-header-block">
                <div class="doc-name" contenteditable="true" spellcheck="false">YOUR NAME</div>
                <div class="doc-title-line" contenteditable="true" spellcheck="false">${title}</div>
                <div class="doc-contact" contenteditable="true" spellcheck="false">email@example.com &nbsp;|&nbsp; +91 98765 43210 &nbsp;|&nbsp; LinkedIn &nbsp;|&nbsp; GitHub &nbsp;|&nbsp; City, India</div>
            </div>

            <div class="doc-section">
                <div class="doc-section-title" contenteditable="true" spellcheck="false">Professional Summary</div>
                <div class="doc-desc" id="editor-summary" contenteditable="true" spellcheck="false">${summary}</div>
            </div>

            <div class="doc-section">
                <div class="doc-section-title" contenteditable="true" spellcheck="false">Experience</div>
                <div class="doc-item">
                    <div class="doc-item-meta" contenteditable="true" spellcheck="false">
                        <span class="doc-item-title">Company Name &mdash; Job Title</span>
                        <span class="doc-item-date">Jan 2022 – Present</span>
                    </div>
                    <div id="editor-experience" contenteditable="true" spellcheck="false">${expBullets}</div>
                </div>
            </div>

            <div class="doc-section">
                <div class="doc-section-title" contenteditable="true" spellcheck="false">Skills</div>
                <div class="doc-skills" id="editor-skills" contenteditable="true" spellcheck="false">${skills}</div>
            </div>

            <div class="doc-section">
                <div class="doc-section-title" contenteditable="true" spellcheck="false">Education</div>
                <div class="doc-item">
                    <div class="doc-item-meta" contenteditable="true" spellcheck="false">
                        <span class="doc-item-title">University Name &mdash; B.Tech / B.E.</span>
                        <span class="doc-item-date">2018 – 2022</span>
                    </div>
                    <div class="doc-desc" contenteditable="true" spellcheck="false">CGPA: 8.5 / 10 &nbsp;|&nbsp; Relevant courses: Data Structures, OS, DBMS</div>
                </div>
            </div>

            <div class="doc-section">
                <div class="doc-section-title" contenteditable="true" spellcheck="false">Projects</div>
                <div class="doc-item">
                    <div class="doc-item-meta" contenteditable="true" spellcheck="false">
                        <span class="doc-item-title">Project Name</span>
                        <span class="doc-item-date">2023</span>
                    </div>
                    <ul class="doc-bullets" contenteditable="true" spellcheck="false">
                        <li>Built a [project description] using [technologies] resulting in [outcome].</li>
                    </ul>
                </div>
            </div>
        `;

        applyTemplate(currentTemplate);
        applyAccentColor('#2563eb');
    }

    // ── Add Section ──────────────────────────────────────────
    function addSection() {
        const title = prompt('Section name (e.g., Certifications, Achievements, Publications):');
        if (!title) return;
        const newSec = document.createElement('div');
        newSec.className = 'doc-section';
        newSec.innerHTML = `
            <div class="doc-section-title" contenteditable="true" style="color:var(--doc-accent,#2563eb); border-bottom-color:var(--doc-accent,#2563eb);">${title}</div>
            <div class="doc-desc" contenteditable="true">Click to add content for this section.</div>
        `;
        editorCanvas.appendChild(newSec);
        newSec.querySelector('.doc-desc').focus();

        // Re-apply accent color to new section title
        const accent = document.querySelector('.color-btn.active')?.dataset?.color || '#2563eb';
        newSec.querySelector('.doc-section-title').style.color = accent;
        newSec.querySelector('.doc-section-title').style.borderBottomColor = accent;
    }

    // ── Suggestions Panel ────────────────────────────────────
    function populateSuggestions(llm, rw) {
        if (!suggestionsPanel) return;

        // rw = rewriteSuggestions (separate from llmAnalysis in the API response)
        const rewrite = rw || llm?.rewriteSuggestions || null;

        let html = '';

        // ── Quick-fill name from profile
        if (llm?.candidateProfile?.estimatedRole) {
            html += `
                <div class="sug-meta-block">
                    <div class="sug-meta-label">🎯 Detected Profile</div>
                    <div class="sug-meta-row"><span>Role</span><strong>${llm.candidateProfile.estimatedRole}</strong></div>
                    <div class="sug-meta-row"><span>Level</span><strong>${llm.candidateProfile.experienceLevel || '–'}</strong></div>
                    <div class="sug-meta-row"><span>Industry</span><strong>${llm.candidateProfile.industry || '–'}</strong></div>
                </div>`;
        }

        if (!rewrite) {
            html += `<div class="sug-empty">
                <div style="font-size:2rem; margin-bottom:10px;">🤖</div>
                <p>Analyze your resume first to unlock AI-powered suggestions that auto-fill the resume.</p>
            </div>`;
            suggestionsPanel.innerHTML = html;
            return;
        }

        html += `<div class="sug-header-note">Click <strong>Apply →</strong> to instantly fill the resume field on the right.</div>`;

        if (rewrite.rewrittenSummary) {
            html += buildSugCard('📝 Professional Summary', rewrite.rewrittenSummary, 'editor-summary', false);
        }
        if (rewrite.atsOptimizedTitle) {
            html += buildSugCard('🏷️ ATS Title', rewrite.atsOptimizedTitle, 'doc-title-line', false, true);
        }
        if (rewrite.rewrittenSkills) {
            html += buildSugCard('🎯 Skills Section', rewrite.rewrittenSkills, 'editor-skills', false);
        }
        if (rewrite.rewrittenExperience?.length) {
            const expHtml = `<ul class="doc-bullets">${rewrite.rewrittenExperience.map(e => `<li>${e}</li>`).join('')}</ul>`;
            html += buildSugCard('💼 Experience Bullets', expHtml, 'editor-experience', true);
        }
        if (rewrite.coverLetterOpener) {
            html += buildCopyCard('✉️ Cover Letter Opener', rewrite.coverLetterOpener);
        }
        if (rewrite.linkedInHeadline) {
            html += buildCopyCard('💼 LinkedIn Headline', rewrite.linkedInHeadline);
        }

        suggestionsPanel.innerHTML = html;

        // Bind apply buttons (by ID target)
        suggestionsPanel.querySelectorAll('.btn-apply').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId  = btn.dataset.target;
                const useClass  = btn.dataset.useclass === 'true';
                const isHtml    = btn.dataset.ishtml === 'true';
                const content   = btn.dataset.content;

                let el = useClass
                    ? document.querySelector('.' + targetId)
                    : document.getElementById(targetId);

                if (el) {
                    if (isHtml) el.innerHTML = content;
                    else el.innerText = content;
                    btn.textContent = '✓ Applied!';
                    btn.style.background = 'rgba(0,230,118,0.2)';
                    btn.style.color = '#00e676';
                    btn.style.borderColor = 'rgba(0,230,118,0.4)';
                    setTimeout(() => {
                        btn.textContent = 'Apply →';
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                    }, 2500);
                }
            });
        });

        // Bind copy buttons
        suggestionsPanel.querySelectorAll('.btn-copy-sug').forEach(btn => {
            btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.text || '').then(() => {
                    btn.textContent = '✓ Copied';
                    setTimeout(() => btn.textContent = '📋 Copy', 2000);
                });
            });
        });
    }

    function buildSugCard(label, content, targetId, isHtml, useClass = false) {
        const display = isHtml ? content.replace(/<[^>]+>/g, '').substring(0, 120) + '…' : content.substring(0, 120) + (content.length > 120 ? '…' : '');
        const escaped = (content || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `
            <div class="ai-suggestion-card">
                <div class="ai-suggestion-label">${label}</div>
                <div class="ai-suggestion-text">${display}</div>
                <button class="btn-apply" data-target="${targetId}" data-content="${escaped}" data-ishtml="${isHtml}" data-useclass="${useClass}">Apply →</button>
            </div>`;
    }

    function buildCopyCard(label, content) {
        return `
            <div class="ai-suggestion-card ai-suggestion-card-copy">
                <div class="ai-suggestion-label">${label}</div>
                <div class="ai-suggestion-text">${content.substring(0, 150)}${content.length > 150 ? '…' : ''}</div>
                <button class="btn-copy-sug" data-text="${(content || '').replace(/"/g, '&quot;')}">📋 Copy</button>
            </div>`;
    }

    // ── Export PDF ───────────────────────────────────────────
    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            if (!window.html2pdf) { alert('PDF export library not loaded.'); return; }

            const element = editorCanvas;
            const originalHTML = btnExport.innerHTML;
            btnExport.innerHTML = '⏳ Exporting...';
            btnExport.disabled = true;

            // Hide edit hints and highlights
            const editables = editorCanvas.querySelectorAll('[contenteditable]');
            editables.forEach(el => {
                el.removeAttribute('contenteditable');
                el.style.boxShadow = 'none';
                el.style.background = 'transparent';
            });

            // Make the canvas absolute briefly so we don't capture background
            const container = document.querySelector('.editor-canvas-container');
            const originalBg = container.style.background;
            container.style.background = 'transparent';

            const opt = {
                margin:      0, // Let the paper padding handle margins
                filename:    'Resume_AI_Optimized.pdf',
                image:       { type: 'jpeg', quality: 0.99 },
                html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
                jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            try {
                await window.html2pdf().set(opt).from(element).save();
            } catch(e) {
                console.error('PDF export failed:', e);
            }

            btnExport.innerHTML = originalHTML;
            btnExport.disabled = false;
            container.style.background = originalBg;
            
            // Restore editables
            editables.forEach(el => {
                el.setAttribute('contenteditable', 'true');
                el.style.boxShadow = '';
                el.style.background = '';
            });
        });
    }

})();
