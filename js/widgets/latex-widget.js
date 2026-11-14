/**
 * GRAND PRIX TELEMETRY // SECTOR 5: UDELARTEX LIVE INTERACTIVE LATEX EDITOR
 * Live mathematical typography compiler with real-time KaTeX preview,
 * preset scientific formulas, and animated university adoption telemetry counters.
 */

(function () {
  'use strict';

  const PRESETS = {
    aero: `\\mathcal{F}_{downforce} = \\frac{1}{2} \\rho v^2 C_L A \\cdot \\left( 1 + \\eta_{DRS} \\right)`,
    ml: `\\mathcal{L}_{telemetry}(\\theta) = \\mathbb{E}_{(s, a) \\sim \\mathcal{D}} \\left[ \\|\\mu_\\theta(s) - a\\|^2 + \\lambda \\mathrm{Tr}(\\Sigma_\\theta(s)) \\right]`,
    navier: `\\rho \\left( \\frac{\\partial \\mathbf{u}}{\\partial t} + \\mathbf{u} \\cdot \\nabla \\mathbf{u} \\right) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}`
  };

  class LatexWidget {
    constructor(inputId = 'latex-editor-input', outputId = 'latex-preview-output') {
      this.inputEl = document.getElementById(inputId);
      this.outputEl = document.getElementById(outputId);

      this.presetBtns = document.querySelectorAll('.latex-preset-btn');
      this.counterEls = document.querySelectorAll('.val-counter-num');

      this.initEvents();
      this.renderPreview();
      this.animateCounters();
    }

    initEvents() {
      if (this.inputEl) {
        this.inputEl.addEventListener('input', () => {
          this.renderPreview();
        });
      }

      this.presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-preset');
          if (PRESETS[key] && this.inputEl) {
            this.inputEl.value = PRESETS[key];
            this.presetBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            this.renderPreview();
          }
        });
      });
    }

    renderPreview() {
      if (!this.inputEl || !this.outputEl) return;
      const code = this.inputEl.value.trim();

      if (window.katex && typeof window.katex.render === 'function') {
        try {
          window.katex.render(code, this.outputEl, {
            displayMode: true,
            throwOnError: false
          });
          return;
        } catch (e) {
          console.warn('[LatexWidget] KaTeX render error:', e);
        }
      }

      // High-fidelity typographic fallback if KaTeX is loading
      this.outputEl.innerHTML = `<div class="latex-fallback-math"><code>${this.escapeHtml(code)}</code></div>`;
    }

    escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    animateCounters() {
      const targets = [
        { id: 'count-theses', target: 2480, suffix: '+' },
        { id: 'count-faculties', target: 14, suffix: ' Facs' },
        { id: 'count-uptime', target: 99.9, suffix: '%' }
      ];

      targets.forEach((t) => {
        const el = document.getElementById(t.id);
        if (!el) return;

        let current = 0;
        const duration = 1500;
        const steps = 40;
        const inc = t.target / steps;
        const stepTime = duration / steps;

        const timer = setInterval(() => {
          current += inc;
          if (current >= t.target) {
            current = t.target;
            clearInterval(timer);
          }
          el.textContent = (t.target % 1 === 0 ? Math.round(current) : current.toFixed(1)) + t.suffix;
        }, stepTime);
      });
    }
  }

  window.LatexWidget = LatexWidget;

  function init() {
    if (document.getElementById('latex-editor-input')) {
      window.activeLatexWidget = new LatexWidget();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
