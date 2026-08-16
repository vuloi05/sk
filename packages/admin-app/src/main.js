/**
 * DictaFlow — Main Application Entry
 */

import {  h  } from '@dictaflow/shared';
import {  store  } from '@dictaflow/shared';
import {  ROUTES, MODES  } from '@dictaflow/shared';

// Components
import {  initToast  } from '@dictaflow/shared';
import { renderHeader } from './components/Header.js';
import { renderAdminLessonBuilder } from './components/AdminLessonBuilder.js';
import { renderTranscriptEditor } from './components/TranscriptEditor.js';
import { renderSettings } from './components/SettingsPanel.js';
import { renderProfile } from './components/ProfilePanel.js';
import { renderAdminPanel } from './components/AdminPanel.js';

// Import custom API for Auth initialization
import {  initAuth  } from '@dictaflow/shared';

/**
 * Main application class
 */
class App {
  constructor() {
    this.root = document.getElementById('app');
    
    // Initialize Auth (Load JWT Token & User from LocalStorage)
    initAuth();
    
    // Subscribe to state changes
    store.subscribe('route', () => this.render());
    store.subscribe('loading', (isLoading) => this.updateLoading(isLoading));
    store.subscribe('currentUser', (newUser, oldUser) => {
      // Just re-render on auth change
      this.render();
    });
    
    // Initial render
    initToast();
    
    // Initial route check
    if (!store.get('route')) {
      store.set('route', ROUTES.LIBRARY);
    } else {
      this.render();
    }
  }

  /**
   * Main render pipeline based on current route.
   */
  render() {
    let route = store.get('route');
    const user = store.get('currentUser');
    
    // Fallback if route is empty
    if (!route) {
      route = ROUTES.HOME;
    }

    // Admin App: Only allow admins.
    if (!user || user.role !== 'admin') {
      this.root.innerHTML = '';
      this.root.appendChild(renderHeader());
      
      const appBody = document.createElement('div');
      appBody.className = 'app-body';
      const mainContent = document.createElement('main');
      mainContent.className = 'main-content';
      
      if (!user) {
        mainContent.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:50vh; color:white; font-size:1.5rem; text-align:center;">Vui lòng đăng nhập bằng tài khoản Quản trị viên (Admin) góc phải màn hình.</div>';
      } else {
        mainContent.innerHTML = '<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:50vh; color:white; font-size:1.5rem; text-align:center;">Bạn không có quyền quản trị!<br><br><button class="btn btn-secondary" onclick="localStorage.removeItem(\'dictaflow_token\'); localStorage.removeItem(\'dictaflow_user\'); window.location.reload();">Đăng xuất</button></div>';
      }
      
      appBody.appendChild(mainContent);
      this.root.appendChild(appBody);
      return;
    }

    this.root.innerHTML = '';
    
    // Render Top Header
    this.root.appendChild(renderHeader());

    // App Body Wrapper
    const appBody = document.createElement('div');
    appBody.className = 'app-body';

    // Main Content Wrapper inside appBody
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    // If PRACTICE, remove padding/max-width limits by adding a modifier class
    if (route === ROUTES.PRACTICE) {
      mainContent.classList.add('is-practice');
    }


    // Route logic
    let pageElement;
    switch (route) {
      case ROUTES.UPLOAD:
        pageElement = renderAdminLessonBuilder();
        break;
      case ROUTES.TRANSCRIPT:
        pageElement = renderTranscriptEditor();
        break;
      case ROUTES.ADMIN_PANEL:
        pageElement = renderAdminPanel();
        break;
      case ROUTES.SETTINGS:
        pageElement = renderSettings();
        break;
      case ROUTES.PROFILE:
        pageElement = renderProfile();
        break;
      default:
        setTimeout(() => store.set('route', ROUTES.ADMIN_PANEL), 0);
        return;
    }

    if (pageElement) {
      mainContent.appendChild(pageElement);
      appBody.appendChild(mainContent);
      this.root.appendChild(appBody);
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
