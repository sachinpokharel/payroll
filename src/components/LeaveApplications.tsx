'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, XCircle, X } from 'lucide-react';
import { getLeaveApplications, addLeaveApplication, updateLeaveApplication, getEmployees, getLeaveTypes } from '@/lib/store';
import type { LeaveApplication, Employee, LeaveType } from '@/types';

export default function LeaveApplications() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [formData, setFormData] = useState({
    employeeId: '', leaveTypeId: '', fromDate: '', toDate: '', reason: '',
  });

  useEffect(() => {
    setApplications(getLeaveApplications());
    setEmployees(getEmployees());
    setLeaveTypes(getLeaveTypes());
  }, []);

  const filtered = filter === 'All' ? applications : applications.filter(a => a.status === filter);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const getLeaveTypeName = (id: string) => leaveTypes.find(t => t.id === id)?.name || 'Unknown';

  const calcDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const d1 = new Date(from);
    const d2 = new Date(to);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = () => {
    if (!formData.employeeId || !formData.leaveTypeId || !formData.fromDate || !formData.toDate) return;
    addLeaveApplication({
      ...formData,
      totalDays: calcDays(formData.fromDate, formData.toDate),
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    });
    setApplications(getLeaveApplications());
    setShowModal(false);
    setFormData({ employeeId: '', leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
  };

  const handleStatusChange = (app: LeaveApplication, status: 'Approved' | 'Rejected') => {
    updateLeaveApplication({ ...app, status });
    setApplications(getLeaveApplications());
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leave Applications</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(f => (
            <button key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
            >{f}</button>
          ))}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave applications found.</td></tr>
            ) : (
              filtered.map(app => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{getEmployeeName(app.employeeId)}</td>
                  <td>{getLeaveTypeName(app.leaveTypeId)}</td>
                  <td>{app.fromDate}</td>
                  <td>{app.toDate}</td>
                  <td>{app.totalDays}</td>
                  <td>
                    <span className={`badge ${
                      app.status === 'Approved' ? 'badge-success' :
                      app.status === 'Rejected' ? 'badge-danger' : 'badge-warning'
                    }`}>{app.status}</span>
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.reason}</td>
                  <td>
                    {app.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(app, 'Approved')}>
                          <Check size={12} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(app, 'Rejected')}>
                          <XCircle size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Apply for Leave</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-input" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.filter(e => e.status === 'Active').map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type *</label>
              <select className="form-input" value={formData.leaveTypeId} onChange={e => setFormData({ ...formData, leaveTypeId: e.target.value })}>
                <option value="">Select Leave Type</option>
                {leaveTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.daysPerYear} days/year)</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">From Date *</label>
                <input className="form-input" type="date" value={formData.fromDate} onChange={e => setFormData({ ...formData, fromDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date *</label>
                <input className="form-input" type="date" value={formData.toDate} onChange={e => setFormData({ ...formData, toDate: e.target.value })} />
              </div>
            </div>
            {formData.fromDate && formData.toDate && (
              <p style={{ fontSize: 13, color: 'var(--primary)', marginBottom: 12 }}>
                Total Days: {calcDays(formData.fromDate, formData.toDate)}
              </p>
            )}
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className="form-input" rows={3} value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Submit Application</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
