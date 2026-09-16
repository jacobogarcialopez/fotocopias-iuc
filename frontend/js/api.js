// API Service Client for IUC Digital Wallet
const API_BASE_URL = "http://localhost:3000/api";

/**
 * Resolves a page path relative to the current location to support nested subdirectories (e.g. XAMPP).
 * @param {string} targetPage - Target page name (e.g. 'login.html')
 */
function resolvePagePath(targetPage) {
  const inPagesDir = window.location.pathname.includes('/pages/');
  return inPagesDir ? targetPage : `pages/${targetPage}`;
}

/**
 * Custom Fetch API Wrapper that attaches JWT token and handles auth redirect.
 * @param {string} endpoint - API Endpoint (e.g. '/auth/login', '/estudiantes/saldo')
 * @param {object} options - Fetch options
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  // Initialize headers
  options.headers = options.headers || {};

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Set content-type to JSON by default unless it's FormData
  if (!(options.body instanceof FormData) && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Auto logout if unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // If we are not already on the login page, redirect
      if (!window.location.pathname.endsWith('login.html') && window.location.pathname !== '/') {
        showToast('Su sesión ha expirado. Redirigiendo al inicio...', 'error');
        setTimeout(() => {
          window.location.href = resolvePagePath('login.html');
        }, 1500);
      }
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'No autorizado.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Ocurrió un error al procesar la solicitud.');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Displays a beautiful toast notification.
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-message';

  // Set background colors according to type
  let icon = 'ℹ️';
  let border = 'border-l-4 border-blue-500';
  if (type === 'success') {
    icon = '✅';
    border = 'border-l-4 border-green-600';
  } else if (type === 'error') {
    icon = '❌';
    border = 'border-l-4 border-red-500';
  } else if (type === 'warning') {
    icon = '⚠️';
    border = 'border-l-4 border-yellow-500';
  }

  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg">${icon}</span>
      <p class="text-sm font-medium">${message}</p>
    </div>
  `;

  toast.className += ` ${border}`;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}
