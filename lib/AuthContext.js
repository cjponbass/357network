'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from './authService';

/**
 * AuthContext
 *
 * Global authentication context that holds:
 * - user: Current authenticated user object (or null)
 * - role: User's role (job_seeker, employer, advertiser, admin, or null)
 * - loading: Boolean indicating async operation in progress
 * - error: Error message if auth operation failed
 * - isAuthenticated: Boolean derived from user presence
 *
 * NOTE: This is a placeholder implementation until Supabase is connected.
 * Methods call authService functions which will be integrated with the backend.
 */
const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 *
 * Wraps the application to provide authentication state and methods to all child components.
 *
 * Features:
 * - Restores user session on mount by calling getCurrentUser()
 * - Manages loading state during auth operations
 * - Updates user, role, and isAuthenticated on auth state changes
 * - Handles logout by clearing user and role
 * - Provides error handling and clearing
 */
export function AuthProvider({ children }) {
  // State: user object from backend
  const [user, setUser] = useState(null);

  // State: user role (job_seeker, employer, advertiser, admin, or null)
  const [role, setRole] = useState(null);

  // State: loading flag for async operations
  const [loading, setLoading] = useState(true);

  // State: error message
  const [error, setError] = useState(null);

  // Derived state: whether user is authenticated
  const isAuthenticated = user !== null;

  /**
   * Effect: Restore session on mount
   *
   * Attempts to restore the user session from the backend.
   * Sets loading state appropriately.
   *
   * NOTE: Until Supabase is connected, this will work with the mock authService.
   */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        setError(null);

        // Attempt to get current user from backend
        const currentUser = await authService.getCurrentUser();

        if (currentUser?.user) {
          setUser(currentUser.user);
          setRole(currentUser.user.role || null);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        setError(err.message);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Login method
   *
   * Authenticates user with email and password.
   * Updates user and role state on success.
   * Sets error state on failure.
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.login(email, password);

      // Check if authService returned an error
      if (result.error) {
        setError(result.error);
        setUser(null);
        setRole(null);
        throw new Error(result.error);
      }

      setUser(result.user);
      setRole(result.user.role || null);

      return result;
    } catch (err) {
      setError(err.message);
      setUser(null);
      setRole(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signup method
   *
   * Creates a new user account with email, password, and profile information.
   * Updates user and role state on success.
   * Sets error state on failure.
   */
  const signup = async (email, password, firstName, lastName, role) => {
    try {
      setLoading(true);
      setError(null);

      const result = await authService.signup(email, password, firstName, lastName, role);

      // Check if authService returned an error
      if (result.error) {
        setError(result.error);
        setUser(null);
        setRole(null);
        throw new Error(result.error);
      }

      setUser(result.user);
      setRole(result.user.role || role);

      return result;
    } catch (err) {
      setError(err.message);
      setUser(null);
      setRole(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout method
   *
   * Clears authentication by:
   * - Calling authService.logout() to end backend session
   * - Clearing user and role state
   * - Clearing error state
   */
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      await authService.logout();

      setUser(null);
      setRole(null);
    } catch (err) {
      console.error('Error during logout:', err);
      setError(err.message);
      // Clear local state even if backend logout fails
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error method
   *
   * Resets the error state.
   * Useful for dismissing error messages in UI.
   */
  const clearError = () => {
    setError(null);
  };

  // Context value object
  const value = {
    // State
    user,
    role,
    loading,
    error,
    isAuthenticated,

    // Methods
    login,
    signup,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 *
 * Custom hook to access authentication state and methods from any component.
 *
 * Returns:
 * {
 *   user: current authenticated user object (or null),
 *   role: user's role (job_seeker, employer, advertiser, admin, or null),
 *   loading: boolean indicating async operation in progress,
 *   error: error message if auth operation failed,
 *   isAuthenticated: boolean derived from user presence,
 *   login: async function(email, password),
 *   signup: async function(email, password, firstName, lastName, role),
 *   logout: async function(),
 *   clearError: function()
 * }
 *
 * Throws: Error if used outside AuthProvider
 *
 * Example usage:
 * ```
 * function MyComponent() {
 *   const { user, login, loading } = useAuth();
 *
 *   if (!user) {
 *     return <LoginForm onSubmit={login} />;
 *   }
 *
 *   return <Dashboard user={user} />;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider>.'
    );
  }

  return context;
}

// Export the context itself for advanced use cases
export default AuthContext;
