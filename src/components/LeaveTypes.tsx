'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { getLeaveTypes, saveLeaveTypes } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import type { LeaveType } from '@/types';

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({ name: '', daysPerYear: 0, carryForward: false, maxCarryForwardDays: 0 });

  useEffect(() => { setLeaveTypes(getLeaveTypes()); }, []);

  const handleSubmit = () => {
    if (!formData.name) return;
    let updated: LeaveType[];
    if (editing) {
      updated = leaveTypes.map(t => t.id === editing.id ? { ...editing, ...formData } : t);
    } else {
      updated = [...leaveTypes, { id: uuidv4(), ...formData }];
    }
    saveLeaveTypes(updated);
    setLeaveTypes(updated);
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', daysPerYear: 0, carryForward: false, maxCarryForwardDays: 0 });
  };

  const handleEdit = (lt: LeaveType) => {
    setEditing(lt);
    setFormData({ name: lt.name, daysPerYear: lt.daysPerYear, carryForward: lt.carryForward, maxCarryForwardDays: lt.maxCarryForwardDays });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const updated = leaveTypes.filter(t => t.id !== id);
    saveLeaveTypes(updated);
    setLeaveTypes(updated);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leave Types</h1>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormData({ name: '', daysPerYear: 0, carryForward: false, maxCarryForwardDays: 0 }); setShowModal(true); }}>
          <Plus size={16} /> Add Leave Type
        </button>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
          As per Nepal Labour Act 2074, employees are entitled to various types of leave. Configure them below.
        </p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Days Per Year</th>
              <th>Carry Forward</th>
              <th>Max Carry Forward Days</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map(lt => (
              <tr key={lt.id}>
                <td style={{ fontWeight: 600 }}>{lt.name}</td>
                <td>{lt.daysPerYear}</td>
                <td>
                  <span className={`badge ${lt.carryForward ? 'badge-success' : 'badge-danger'}`}>
                    {lt.carryForward ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{lt.maxCarryForwardDays}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(lt)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(lt.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Leave Type Name *</label>
              <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Days Per Year</label>
              <input className="form-input" type="number" value={formData.daysPerYear} onChange={e => setFormData({ ...formData, daysPerYear: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.carryForward} onChange={e => setFormData({ ...formData, carryForward: e.target.checked })} />
                <span className="form-label" style={{ marginBottom: 0 }}>Allow Carry Forward</span>
              </label>
            </div>
            {formData.carryForward && (
              <div className="form-group">
                <label className="form-label">Max Carry Forward Days</label>
                <input className="form-input" type="number" value={formData.maxCarryForwardDays} onChange={e => setFormData({ ...formData, maxCarryForwardDays: Number(e.target.value) })} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
