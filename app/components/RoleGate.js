'use client';

import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/useLanguage';

/**
 * RoleGate Component
 *
 * Role-based access control (RBAC) component for conditional rendering.
 *
 * FEATURES:
 * - Restricts component rendering based on user role
 * - Supports multiple roles for flexible access control
 * - Shows fallback content if user lacks required role
 * - Provides meaningful error/unauthorized messages
 * - Non-intrusive: silent about role mismatches unless fallback provided
 *
 * SUPPORTED ROLES:
 * - job_seeker: Job seeking users
 * - employer: Employer account holders
 * - advertiser: Advertising/sponsorship users
 * - admin: Administrative users with full access
 *
 * USAGE:
 * 
 * // Single role requirement
 * <RoleGate role="employer">
 *   <EmployerContent />
 * </RoleGate>
 *
 * // Multiple roles (OR logic)
 * <RoleGate role={['employer', 'admin']}>
 *   <SpecialContent />
 *   <Fallback>You don't have access to this feature</Fallback>
 * </RoleGate>
 *
 * // With custom fallback
 * <RoleGate
 *   role="admin"
 *   fallback={<AdminOnlyMessage />}
 * >
 *   <AdminPanel />
 * </RoleGate>
 *
 * INTEGRATION:
 * - Used within pages/components that are already wrapped by ProtectedRoute
 * - Works alongside middleware for defense-in-depth
 * - Phase 2: Will integrate with Supabase role verification
 */

export default function RoleGate({ role, children, fallback = null }) {
  const { role: userRole, loading } = useAuth();

  /**
   * Input Validation
   *
   * Ensure role prop is properly formatted.
   * Convert single string to array for unified handling.
   */
  if (!role) {
    console.error('RoleGate: role prop is required');
    return fallback || null;
  }

  const requiredRoles = Array.isArray(role) ? role : [role];

  /**
   * LOADING STATE
   *
   * While auth context is initializing, don't render content.
   * This prevents flash of unauthorized content.
   */
  if (loading) {
    return null;
  }

  /**
   * ROLE VALIDATION
   *
   * Check if user's role is in the list of required roles.
   * Empty role (not authenticated) is treated as unauthorized.
   */
  const hasRequiredRole = userRole && requiredRoles.includes(userRole);

  if (!hasRequiredRole) {
    // No required role - return fallback if provided, otherwise null
    if (fallback) {
      return fallback;
    }
    // Silent fallback: render nothing if no fallback provided
    return null;
  }

  /**
   * AUTHORIZED STATE
   *
   * User has one of the required roles.
   * Render the protected content.
   */
  return children;
}

/**
 * FALLBACK COMPONENT EXAMPLES
 *
 * Use with RoleGate's fallback prop:
 */

/**
 * DefaultUnauthorizedMessage
 *
 * Generic unauthorized message when user lacks required role.
 * Can be used as a fallback component.
 */
export function DefaultUnauthorizedMessage() {
  const { t } = useLanguage();
  return (
    <div className="role-gate-unauthorized">
      <div className="unauthorized-content">
        <h3>{t('component.role_gate.access_restricted')}</h3>
        <p>{t('component.role_gate.no_permission')}</p>
        <p className="hint">{t('component.role_gate.contact_support')}</p>
      </div>
      <style jsx>{`
        .role-gate-unauthorized {
          padding: 20px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          margin: 20px 0;
        }

        .unauthorized-content {
          text-align: center;
        }

        h3 {
          color: #856404;
          margin: 0 0 10px;
        }

        p {
          color: #856404;
          margin: 5px 0;
        }

        .hint {
          font-size: 14px;
          font-style: italic;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}

/**
 * EmployerOnlyMessage
 *
 * Specific message for employer-only features.
 */
export function EmployerOnlyMessage() {
  const { t } = useLanguage();
  return (
    <div className="role-gate-message">
      <h3>{t('component.role_gate.employer_feature_title')}</h3>
      <p>{t('component.role_gate.employer_feature_desc')}</p>
    </div>
  );
}

/**
 * AdminOnlyMessage
 *
 * Specific message for admin-only features.
 */
export function AdminOnlyMessage() {
  const { t } = useLanguage();
  return (
    <div className="role-gate-message">
      <h3>{t('component.role_gate.admin_only_title')}</h3>
      <p>{t('component.role_gate.admin_only_desc')}</p>
    </div>
  );
}

/**
 * COMMON PATTERNS
 *
 * Show content only to job seekers:
 * <RoleGate role="job_seeker">
 *   <JobSeekerDashboard />
 * </RoleGate>
 *
 * Show different content based on role:
 * <>
 *   <RoleGate role="employer">
 *     <EmployerSection />
 *   </RoleGate>
 *   <RoleGate role="advertiser">
 *     <AdvertiserSection />
 *   </RoleGate>
 * </>
 *
 * Show admin-only feature with custom message:
 * <RoleGate
 *   role="admin"
 *   fallback={<AdminOnlyMessage />}
 * >
 *   <AdminPanel />
 * </RoleGate>
 */
