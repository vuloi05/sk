/**
 * DictaFlow — Main Application Entry
 */

import { h } from './utils/helpers.js';
import { store } from './core/store.js';
import { ROUTES, MODES } from './utils/constants.js';

// Components
import { initToast } from './components/Toast.js';
import { renderHeader } from './components/Header.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderLibrary } from './components/LessonLibrary.js';
import { renderUploader } from './components/AudioUploader.js';
import { renderTranscriptEditor } from './components/TranscriptEditor.js';
import { renderDictation } from './components/DictationMode.js';
import { renderGapFill } from './components/GapFillMode.js';
import { renderMultipleChoice } from './components/MultipleChoice.js';
import { renderScoreBoard } from './components/ScoreBoard.js';
import { renderSettings } from './components/SettingsPanel.js';

/**
 * Main application class
 */
class App {
  constructor() {
    this.root = document.getElementById('app');
    
    // Subscribe to state changes
    store.subscribe('route', () => this.render());
    store.subscribe('loading', (isLoading) => this.updateLoading(isLoading));
    store.subscribe('currentUser', () => this.render());
    
    // Initial render
    this.initTheme();
    initToast();
    this.render();
  }

  /**
   * Initialize Light/Dark theme from localStorage or OS preference
   */
  initTheme() {
    let theme = localStorage.getItem('dictaflow_theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // Listen for OS theme changes if user hasn't explicitly set a preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('dictaflow_theme')) {
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    });
  }

  /**
   * Main render pipeline based on current route.
   */
  render() {
    const route = store.get('route');
    this.root.innerHTML = '';
    
    // Always render Top Header
    this.root.appendChild(renderHeader());

    // App Body Wrapper
    const appBody = document.createElement('div');
    appBody.className = 'app-body';
    
    // Always render sidebar inside appBody
    appBody.appendChild(renderSidebar());

    // Main Content Wrapper inside appBody
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    // Route logic
    let pageElement;
    switch (route) {
      case ROUTES.LIBRARY:
        pageElement = renderLibrary();
        break;
      case ROUTES.UPLOAD:
        pageElement = renderUploader();
        break;
      case ROUTES.TRANSCRIPT:
        pageElement = renderTranscriptEditor();
        break;
      case ROUTES.MODE_SELECT:
        pageElement = this.renderModeSelect();
        break;
      case ROUTES.PRACTICE:
        pageElement = this.renderPractice();
        break;
      case ROUTES.SCORE:
        pageElement = renderScoreBoard();
        break;
      case ROUTES.SETTINGS:
        pageElement = renderSettings();
        break;
      default:
        store.set('route', ROUTES.LIBRARY);
        return;
    }

    if (pageElement) {
      mainContent.appendChild(pageElement);
      appBody.appendChild(mainContent);
      this.root.appendChild(appBody);
    }
  }

  /**
   * Render Mode Selection screen.
   * @returns {HTMLElement}
   */
  renderModeSelect() {
    const lesson = store.get('currentLesson');
    
    if (!lesson) {
      setTimeout(() => store.set('route', ROUTES.LIBRARY), 0);
      return h('div');
    }

    return h('div', { className: 'page' },
      h('div', { className: 'container animate-slide-up', style: { maxWidth: '800px' } },
        h('div', { className: 'text-center mb-xl' },
          h('h1', { style: { marginBottom: '8px' } }, lesson.title),
          h('p', { className: 'text-secondary' }, 'Chọn chế độ luyện tập để bắt đầu')
        ),

        h('div', { className: 'mode-selector stagger-children' },
          ...Object.values(MODES).map(mode => 
            h('div', { 
              className: 'card mode-card card-clickable',
              onClick: () => {
                store.update({
                  currentMode: mode.id,
                  currentSentenceIndex: 0,
                  practiceResults: [],
                  route: ROUTES.PRACTICE
                });
              }
            },
              h('div', { className: 'mode-card-icon' }, mode.icon),
              h('div', { className: 'mode-card-title' }, mode.title),
              h('div', { className: 'mode-card-desc' }, mode.desc)
            )
          )
        )
      )
    );
  }

  /**
   * Route to the correct practice mode component.
   * @returns {HTMLElement}
   */
  renderPractice() {
    const mode = store.get('currentMode');
    switch (mode) {
      case 'dictation': return renderDictation();
      case 'gapfill': return renderGapFill();
      case 'mcq': return renderMultipleChoice();
      default: 
        setTimeout(() => store.set('route', ROUTES.MODE_SELECT), 0);
        return h('div');
    }
  }

  /**
   * Show/hide global loading overlay.
   * @param {boolean} isLoading 
   */
  updateLoading(isLoading) {
    let overlay = document.getElementById('global-loading');
    
    if (isLoading) {
      if (!overlay) {
        overlay = h('div', { className: 'loading-overlay animate-fade-in', id: 'global-loading' },
          h('div', { className: 'loading-spinner' }),
          h('div', { className: 'loading-text', id: 'loading-text' }, store.get('loadingMessage') || 'Đang xử lý...')
        );
        document.body.appendChild(overlay);
      } else {
        const textEl = document.getElementById('loading-text');
        if (textEl) textEl.textContent = store.get('loadingMessage') || 'Đang xử lý...';
      }
    } else {
      if (overlay) {
        overlay.style.animation = 'fadeOut 200ms ease-out forwards';
        setTimeout(() => overlay.remove(), 200);
      }
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
