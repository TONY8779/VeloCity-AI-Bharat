import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ── localStorage-based user store (no backend needed) ──────────────────
const STORAGE_KEYS = {
  USERS: 'velocity_users',
  CURRENT: 'velocity_current_user',
  TOKEN: 'velocity_token',
};

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT));
  } catch { return null; }
}

function saveCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'local_' + user.id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Simple hash for demo (NOT secure – this is client-side only)
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return 'h_' + Math.abs(h).toString(36);
}

// ── Provider ───────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seed a default admin user on first load if no users exist
  useEffect(() => {
    const users = getUsers();
    if (users.length === 0) {
      const admin = {
        id: generateId(),
        email: 'admin@velocity.app',
        passwordHash: simpleHash('Admin@123'),
        displayName: 'Admin',
        niche: '',
        role: 'admin',
        company: null,
        createdAt: new Date().toISOString(),
      };
      saveUsers([admin]);
    }
  }, []);

  const loadUser = useCallback(() => {
    const stored = getCurrentUser();
    if (stored) {
      setUser(stored);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password, _rememberMe = false) => {
    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!found) throw new Error('Invalid email or password');
    if (found.passwordHash !== simpleHash(password)) {
      throw new Error('Invalid email or password');
    }

    // Build the user object returned to the app (strip passwordHash)
    const { passwordHash, ...safeUser } = found;
    saveCurrentUser(safeUser);
    setUser(safeUser);
    return { user: safeUser, token: 'local_' + safeUser.id };
  };

  const register = async (email, password, displayName, niche) => {
    const users = getUsers();

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered');
    }
    if (users.some((u) => u.displayName.toLowerCase() === displayName.toLowerCase())) {
      throw new Error('Display name is already taken');
    }

    const newUser = {
      id: generateId(),
      email,
      passwordHash: simpleHash(password),
      displayName,
      niche: niche || '',
      role: 'user',
      company: null,
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);

    const { passwordHash, ...safeUser } = newUser;
    saveCurrentUser(safeUser);
    setUser(safeUser);
    return { user: safeUser, token: 'local_' + safeUser.id };
  };

  const logout = () => {
    saveCurrentUser(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('Not authenticated');

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error('User not found');

    // Merge updates (ignore protected fields)
    const { id, role, passwordHash, ...allowed } = updates;
    Object.assign(users[idx], allowed);
    saveUsers(users);

    const { passwordHash: _ph, ...safeUser } = users[idx];
    saveCurrentUser(safeUser);
    setUser(safeUser);
    return safeUser;
  };

  const refreshUser = () => loadUser();

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateProfile, refreshUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
