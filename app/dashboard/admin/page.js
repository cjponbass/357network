'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/app/components/ProtectedRoute'
import RoleGate from '@/app/components/RoleGate'
import { useAuth } from '@/lib/AuthContext'
import { useLanguage } from '@/lib/useLanguage'
import { getPendingJobs, approveJob, markJobFeatured, getPendingAdvertisingOrders, approveAdvertisingOrder } from '@/lib/adminService'

/**
 * Admin Dashboard (app/dashboard/admin/page.js)
 *
 * Purpose: Display dashboard for administrators
 * Protection: ProtectedRoute wrapper ensures only authenticated users can access
 * Role Check: RoleGate restricts access to admin role only
 *
 * Sections:
 * - System Statistics (placeholder)
 * - Pending Job Approvals (fetches from adminService)
 * - Pending Advertisement Approvals (fetches from adminService)
 * - User Management (placeholder)
 * - System Logs (placeholder)
 *
 * NOTE: All action buttons are disabled (Phase 1 placeholders)
 */

function AdminDashboardContent() {
  const { user, role } = useAuth()
  const { t } = useLanguage()
  const [pendingJobs, setPendingJobs] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [jobsError, setJobsError] = useState(null)
  const [ordersError, setOrdersError] = useState(null)

  // Fetch pending jobs on component mount
  useEffect(() => {
    async function fetchPendingJobs() {
      try {
        setLoadingJobs(true)
        const result = await getPendingJobs(10)
        if (result.error) {
          setJobsError(result.error)
        } else {
          setPendingJobs(result.jobs || [])
        }
      } catch (error) {
        setJobsError(error.message || 'Failed to fetch pending jobs')
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchPendingJobs()
  }, [])

  // Fetch pending advertising orders on component mount
  useEffect(() => {
    async function fetchPendingOrders() {
      try {
        setLoadingOrders(true)
        const result = await getPendingAdvertisingOrders(10)
        if (result.error) {
          setOrdersError(result.error)
        } else {
          setPendingOrders(result.orders || [])
        }
      } catch (error) {
        setOrdersError(error.message || 'Failed to fetch pending advertising orders')
      } finally {
        setLoadingOrders(false)
      }
    }

    fetchPendingOrders()
  }, [])

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <section className="page-header">
        <h1 className="page-title">{t('dashboard.admin.title')}</h1>
        <p className="page-subtitle">{t('dashboard.admin.subtitle')}</p>
        {user && (
          <p className="user-role">
            {t('component.dashboard.account_type')}: <strong>{role}</strong> {t('dashboard.admin.admin_only')}
          </p>
        )}
      </section>

      {/* System Statistics Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.admin.statistics')}</h2>
        <div className="statistics-grid">
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_total_users')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_job_seekers')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_employers')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_advertisers')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_active_jobs')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">{t('dashboard.admin.stat_pending_approvals')}</p>
            <p className="stat-value">—</p>
            <p className="stat-detail">{t('dashboard.admin.stat_placeholder')}</p>
          </div>
        </div>
      </section>

      {/* Pending Job Approvals Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.admin.pending_jobs')}</h2>
        <div className="pending-approvals">
          {loadingJobs ? (
            <div className="loading-state">
              <p>{t('dashboard.admin.loading_jobs')}</p>
            </div>
          ) : jobsError ? (
            <div className="error-state">
              <p>Error: {t(jobsError) || jobsError}</p>
            </div>
          ) : pendingJobs.length === 0 ? (
            <div className="empty-state">
              <h3>{t('dashboard.admin.no_pending_jobs')}</h3>
              <p>
                {t('dashboard.admin.pending_jobs_help')}
              </p>
            </div>
          ) : (
            <div className="jobs-table-wrapper">
              {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <div className="supabase-notice">
                  <p>{t('dashboard.admin.supabase_not_configured')}</p>
                </div>
              )}
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.admin.table_job_title')}</th>
                    <th>{t('dashboard.admin.table_company')}</th>
                    <th>{t('dashboard.admin.table_category')}</th>
                    <th>{t('dashboard.admin.table_location')}</th>
                    <th>{t('dashboard.admin.table_posted_by')}</th>
                    <th>{t('dashboard.admin.table_posted_at')}</th>
                    <th>{t('dashboard.admin.table_status')}</th>
                    <th>{t('dashboard.admin.table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="job-title">
                        <button className="link-button" disabled>{job.title}</button>
                      </td>
                      <td>{job.company_name}</td>
                      <td>{job.category}</td>
                      <td>{job.city}, {job.state}</td>
                      <td>{job.posted_by}</td>
                      <td className="date">{formatDate(job.posted_at)}</td>
                      <td>
                        <span className="status-badge pending">{job.status}</span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn btn-small btn-success"
                          disabled
                          title={t('dashboard.admin.tooltip_coming_phase2')}
                        >
                          {t('dashboard.admin.button_approve')}
                        </button>
                        <button
                          className="btn btn-small btn-info"
                          disabled
                          title={t('dashboard.admin.tooltip_coming_phase2')}
                        >
                          {t('dashboard.admin.button_featured')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Pending Advertisement Approvals Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.admin.pending_orders')}</h2>
        <div className="pending-ads">
          {loadingOrders ? (
            <div className="loading-state">
              <p>{t('dashboard.admin.loading_orders')}</p>
            </div>
          ) : ordersError ? (
            <div className="error-state">
              <p>Error: {t(ordersError) || ordersError}</p>
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="empty-state">
              <h3>{t('dashboard.admin.no_pending_orders')}</h3>
              <p>
                {t('dashboard.admin.pending_orders_help')}
              </p>
            </div>
          ) : (
            <div className="orders-table-wrapper">
              {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
                <div className="supabase-notice">
                  <p>{t('dashboard.admin.supabase_not_configured')}</p>
                </div>
              )}
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.admin.table_order_type')}</th>
                    <th>{t('dashboard.admin.table_price')}</th>
                    <th>{t('dashboard.admin.table_ordered_by')}</th>
                    <th>{t('dashboard.admin.table_created_at')}</th>
                    <th>{t('dashboard.admin.table_status')}</th>
                    <th>{t('dashboard.admin.table_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="order-type-badge">
                          {order.order_type === 'standard' && t('dashboard.admin.order_type_standard')}
                          {order.order_type === 'featured' && t('dashboard.admin.order_type_featured')}
                          {order.order_type === 'placement' && t('dashboard.admin.order_type_placement')}
                        </span>
                      </td>
                      <td className="price">${order.price.toFixed(2)}</td>
                      <td>{order.created_by}</td>
                      <td className="date">{formatDate(order.created_at)}</td>
                      <td>
                        <span className="status-badge pending">{order.status}</span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn btn-small btn-success"
                          disabled
                          title={t('dashboard.admin.tooltip_coming_phase2')}
                        >
                          {t('dashboard.admin.button_approve')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* User Management Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.admin.user_management')}</h2>
        <div className="user-management-header">
          <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_export_users')}</button>
        </div>
        <div className="user-management">
          <div className="management-content">
            <h3>{t('dashboard.admin.admin_header')}</h3>
            <p>{t('dashboard.admin.admin_help')}</p>
            <div className="management-actions">
              <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_search_users')}</button>
              <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_manage_roles')}</button>
              <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_user_activity')}</button>
              <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_suspend_users')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* System Logs Section */}
      <section className="dashboard-section">
        <h2 className="section-title">{t('dashboard.admin.system_logs')}</h2>
        <div className="system-logs">
          <div className="logs-header">
            <p>{t('dashboard.admin.logs_placeholder')}</p>
            <button className="btn btn-secondary" disabled>{t('dashboard.admin.button_download_logs')}</button>
          </div>
          <div className="logs-table">
            <p className="placeholder-text">{t('dashboard.admin.logs_help1')}</p>
            <p className="placeholder-text">
              {t('dashboard.admin.logs_help2')}
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .statistics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          text-align: center;
        }

        .stat-label {
          color: #666;
          font-size: 14px;
          margin: 0 0 10px;
          font-weight: 500;
        }

        .stat-value {
          color: #333;
          font-size: 32px;
          font-weight: bold;
          margin: 0 0 5px;
        }

        .stat-detail {
          color: #999;
          font-size: 12px;
          margin: 0;
        }

        .pending-approvals,
        .pending-ads {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 30px 20px;
          color: #666;
        }

        .error-state {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          color: #c33;
        }

        .supabase-notice {
          background: #fef3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 10px 15px;
          margin-bottom: 15px;
          color: #856404;
          font-size: 14px;
        }

        .jobs-table-wrapper,
        .orders-table-wrapper {
          overflow-x: auto;
        }

        .jobs-table,
        .orders-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .jobs-table thead,
        .orders-table thead {
          background: #f5f5f5;
        }

        .jobs-table th,
        .orders-table th {
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
          font-size: 14px;
        }

        .jobs-table td,
        .orders-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e0e0e0;
          color: #333;
          font-size: 14px;
        }

        .jobs-table tbody tr:hover,
        .orders-table tbody tr:hover {
          background: #f9f9f9;
        }

        .job-title {
          font-weight: 500;
          max-width: 200px;
        }

        .link-button {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font: inherit;
        }

        .link-button:hover {
          color: #5568d3;
        }

        .link-button:disabled {
          color: #999;
          cursor: not-allowed;
        }

        .date {
          white-space: nowrap;
          font-size: 13px;
          color: #666;
        }

        .price {
          font-weight: 600;
          color: #27ae60;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .order-type-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          background: #e3f2fd;
          color: #1976d2;
        }

        .actions {
          display: flex;
          gap: 8px;
          white-space: nowrap;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
          white-space: nowrap;
        }

        .btn-success {
          background: #27ae60;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #229954;
        }

        .btn-info {
          background: #3498db;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background: #2980b9;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .user-management-header {
          margin-bottom: 20px;
        }

        .user-management {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .management-content h3 {
          color: #333;
          margin: 0 0 15px;
          font-size: 20px;
        }

        .management-content > p {
          color: #666;
          margin: 0 0 20px;
          line-height: 1.6;
        }

        .management-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }

        .management-actions button {
          margin: 5px;
        }

        .system-logs {
          background: white;
          padding: 30px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .logs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e0e0e0;
        }

        .logs-header p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }

        .logs-table {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 4px;
          border: 1px dashed #e0e0e0;
        }

        .placeholder-text {
          color: #999;
          margin: 10px 0;
          font-size: 14px;
          text-align: center;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }

        .empty-state h3 {
          color: #333;
          margin: 0 0 10px;
          font-size: 18px;
        }

        .empty-state p {
          color: #666;
          margin: 0 0 20px;
          line-height: 1.6;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .statistics-grid {
            grid-template-columns: 1fr;
          }

          .logs-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .logs-header button {
            margin-top: 15px;
          }

          .management-actions {
            grid-template-columns: 1fr;
          }

          .jobs-table,
          .orders-table {
            font-size: 12px;
          }

          .jobs-table th,
          .orders-table th {
            padding: 10px 8px;
            font-size: 12px;
          }

          .jobs-table td,
          .orders-table td {
            padding: 10px 8px;
          }

          .actions {
            flex-direction: column;
            gap: 4px;
          }

          .btn-small {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Wrapped component with protection and role gating
 */
function AdminDashboardPage() {
  return (
    <RoleGate role="admin">
      <AdminDashboardContent />
    </RoleGate>
  )
}

export default ProtectedRoute(AdminDashboardPage)
