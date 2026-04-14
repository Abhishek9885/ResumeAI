// ============================================================
// Charts — Canvas-based visualizations
// ============================================================

/**
 * Draw animated ATS score gauge
 * @param {string} canvasId - Canvas element ID
 * @param {number} score - Score value (0-100)
 * @param {string} color - Score color
 */
function drawScoreGauge(canvasId, score, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 20;
    const lineWidth = 14;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Background arc
    ctx.beginPath();
    ctx.arc(center, center, radius, Math.PI * 0.75, Math.PI * 2.25, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Animate the score arc
    const totalAngle = Math.PI * 1.5; // 270 degrees
    const startAngle = Math.PI * 0.75;
    let currentScore = 0;

    function animate() {
        if (currentScore >= score) {
            currentScore = score;
            drawArc(currentScore);
            drawTicks();
            return;
        }

        currentScore += Math.max(1, (score - currentScore) * 0.08);
        if (score - currentScore < 0.5) currentScore = score;
        
        drawArc(currentScore);
        requestAnimationFrame(animate);
    }

    function drawArc(val) {
        ctx.clearRect(0, 0, size, size);

        // Background arc
        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, startAngle + totalAngle, false);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Score arc
        const endAngle = startAngle + (totalAngle * (val / 100));
        const gradient = ctx.createLinearGradient(0, 0, size, size);

        if (val >= 75) {
            gradient.addColorStop(0, '#00e676');
            gradient.addColorStop(1, '#69f0ae');
        } else if (val >= 55) {
            gradient.addColorStop(0, '#4f8fff');
            gradient.addColorStop(1, '#00d4ff');
        } else if (val >= 40) {
            gradient.addColorStop(0, '#ffab40');
            gradient.addColorStop(1, '#ffd740');
        } else {
            gradient.addColorStop(0, '#ff5252');
            gradient.addColorStop(1, '#ff6e40');
        }

        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, endAngle, false);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow effect
        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, endAngle, false);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth + 8;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Update score number with animation
        const scoreEl = document.getElementById('score-number');
        if (scoreEl) scoreEl.textContent = Math.round(val);
    }

    function drawTicks() {
        // Small tick marks at key positions
        const ticks = [0, 25, 50, 75, 100];
        ticks.forEach(tick => {
            const angle = startAngle + (totalAngle * (tick / 100));
            const innerR = radius - lineWidth / 2 - 8;
            const outerR = radius - lineWidth / 2 - 3;

            ctx.beginPath();
            ctx.moveTo(
                center + innerR * Math.cos(angle),
                center + innerR * Math.sin(angle)
            );
            ctx.lineTo(
                center + outerR * Math.cos(angle),
                center + outerR * Math.sin(angle)
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    // Start animation after a brief delay
    setTimeout(animate, 300);
}

// Make available globally
window.drawScoreGauge = drawScoreGauge;

// ============================================================
// Landing Page Demo Animations — Scroll-triggered
// ============================================================

(function () {
    // Demo gauge for the showcase section
    function drawDemoGauge() {
        const canvas = document.getElementById('demo-gauge');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const center = size / 2;
        const radius = center - 14;
        const lineWidth = 10;
        const totalAngle = Math.PI * 1.5;
        const startAngle = Math.PI * 0.75;
        const targetScore = 92;
        let currentScore = 0;

        function animate() {
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                draw(currentScore);
                return;
            }
            currentScore += Math.max(0.5, (targetScore - currentScore) * 0.04);
            if (targetScore - currentScore < 0.5) currentScore = targetScore;
            draw(currentScore);
            requestAnimationFrame(animate);
        }

        function draw(val) {
            ctx.clearRect(0, 0, size, size);

            // Background arc
            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, startAngle + totalAngle, false);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Score arc
            const endAngle = startAngle + (totalAngle * (val / 100));
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#00e676');
            gradient.addColorStop(1, '#69f0ae');

            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, endAngle, false);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Glow
            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, endAngle, false);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth + 6;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.12;
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Update number
            const numEl = document.getElementById('demo-score-num');
            if (numEl) numEl.textContent = Math.round(val);
        }

        animate();
    }

    // Animate category bars
    function animateCategoryBars() {
        document.querySelectorAll('.mock-cat-fill').forEach(bar => {
            const target = bar.dataset.target;
            if (target) bar.style.width = target + '%';
        });
    }

    // Scroll-triggered Intersection Observer
    function setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Trigger specific animations
                    if (entry.target.id === 'showcase-ats') {
                        setTimeout(drawDemoGauge, 300);
                        setTimeout(animateCategoryBars, 600);
                    }

                    // Trigger live demo
                    if (entry.target.id === 'showcase-live') {
                        animateLiveDemo();
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.showcase-section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(40px)';
            section.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            observer.observe(section);
        });

        // Add visible class behavior
        const style = document.createElement('style');
        style.textContent = '.showcase-section.visible { opacity: 1 !important; transform: translateY(0) !important; }';
        document.head.appendChild(style);
    }

    // ── Live Demo Animation ──────────────────────────────────
    function animateLiveDemo() {
        const scanLine = document.getElementById('demo-scan-line');
        const tags = document.querySelectorAll('.demo-tag');
        const dpGrade = document.getElementById('dp-grade');
        const dpVerdict = document.getElementById('dp-verdict');
        const dpSkillTags = document.getElementById('dp-skill-tags');
        const dpStatus = document.getElementById('dp-status');

        // 1. Start scan line
        if (scanLine) scanLine.classList.add('scanning');

        // 2. Show annotation tags
        setTimeout(() => {
            tags.forEach(tag => tag.classList.add('visible'));
        }, 300);

        // 3. Animate panel bars
        setTimeout(() => {
            document.querySelectorAll('.dp-bar-fill').forEach(bar => {
                const target = bar.dataset.target;
                if (target) bar.style.width = target + '%';
            });
        }, 800);

        // 4. Draw mini gauge
        setTimeout(() => {
            drawLiveDemoGauge();
        }, 1000);

        // 5. Show grade
        setTimeout(() => {
            if (dpGrade) dpGrade.classList.add('visible');
        }, 2000);

        // 6. Populate skill tags
        const skills = ['Cloud Computing', 'Project Management', 'IT Security', 'Agile', 'Python', 'AWS', 'ERP Systems', 'Leadership', 'Strategic Planning', 'Budget Mgmt'];
        if (dpSkillTags) {
            dpSkillTags.innerHTML = '';
            skills.forEach((skill, i) => {
                const tag = document.createElement('span');
                tag.className = 'dp-skill-tag';
                tag.textContent = skill;
                dpSkillTags.appendChild(tag);
                setTimeout(() => tag.classList.add('visible'), 2200 + (i * 100));
            });
        }

        // 7. Show verdict
        setTimeout(() => {
            if (dpVerdict) dpVerdict.classList.add('visible');
        }, 3200);

        // 8. Update status to complete
        setTimeout(() => {
            if (dpStatus) {
                dpStatus.innerHTML = '<span class="dp-pulse" style="animation:none;background:#00e676"></span> Analysis Complete';
            }
        }, 3500);
    }

    function drawLiveDemoGauge() {
        const canvas = document.getElementById('demo-live-gauge');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const center = size / 2;
        const radius = center - 12;
        const lineWidth = 8;
        const totalAngle = Math.PI * 1.5;
        const startAngle = Math.PI * 0.75;
        const targetScore = 92;
        let currentScore = 0;

        function animate() {
            if (currentScore >= targetScore) { currentScore = targetScore; draw(currentScore); return; }
            currentScore += Math.max(0.5, (targetScore - currentScore) * 0.04);
            if (targetScore - currentScore < 0.5) currentScore = targetScore;
            draw(currentScore);
            requestAnimationFrame(animate);
        }

        function draw(val) {
            ctx.clearRect(0, 0, size, size);
            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, startAngle + totalAngle, false);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();

            const endAngle = startAngle + (totalAngle * (val / 100));
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#00e676');
            gradient.addColorStop(1, '#69f0ae');

            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, endAngle, false);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(center, center, radius, startAngle, endAngle, false);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = lineWidth + 5;
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.1;
            ctx.stroke();
            ctx.globalAlpha = 1;

            const numEl = document.getElementById('dp-score-num');
            if (numEl) numEl.textContent = Math.round(val);
        }

        animate();
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupScrollAnimations);
    } else {
        setupScrollAnimations();
    }
})();
