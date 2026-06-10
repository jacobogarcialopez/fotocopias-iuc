// Session & Auth Utilities for IUC Monedero

/**
 * Get current logged in user from localStorage
 */
function getUser() {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error('Error parsing user details:', e);
    return null;
  }
}

/**
 * Returns the corresponding path for each role ID
 * 1: Estudiante, 2: Acudiente, 3: Operador, 4: Administrativo, 5: Rector
 */
function getRedirectPath(rolId) {
  switch (parseInt(rolId)) {
    case 1: return '/pages/estudiante.html';
    case 2: return '/pages/acudiente.html';
    case 3: return '/pages/operador.html';
    case 4: return '/pages/administrativo.html';
    case 5: return '/pages/rector.html';
    default: return '/pages/login.html';
  }
}

/**
 * Check if session is valid and user has permissions for the current page
 * @param {Array} allowedRoles - List of numeric role IDs allowed to view the page (empty means any logged in)
 */
function checkSession(allowedRoles = []) {
  const token = localStorage.getItem('token');
  const user = getUser();

  if (!token || !user) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
    return;
  }

  // If the user's role is not in the allowed list, redirect them to their home page
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rolId)) {
    console.warn(`User role ${user.rolId} is not allowed here. Redirecting...`);
    window.location.href = getRedirectPath(user.rolId);
  }

  // Render common UI elements if they exist (e.g. username on nav)
  document.addEventListener('DOMContentLoaded', () => {
    const userNameEl = document.getElementById('nav-user-name');
    if (userNameEl) {
      userNameEl.textContent = `${user.nombre} ${user.apellido}`;
    }
    const userRoleEl = document.getElementById('nav-user-role');
    if (userRoleEl) {
      userRoleEl.textContent = user.rolNombre;
    }
  });
}

/**
 * Logs out user and cleans localStorage
 */
async function logoutUser() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Error during backend logout call:', e);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  }
}
