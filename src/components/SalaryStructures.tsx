'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Layers } from 'lucide-react';
import { getSalaryStructures, saveSalaryStructures } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import type { SalaryStructure, SalaryComponent } from '@/types';

const emptyComponent: Omit<SalaryComponent, 'id'> = {
  name: '', type: 'earning', calculationType: 'percentage', value: 0, basedOn: 'basic', isStatutory: false,
};

export default function SalaryStructures() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SalaryStructure | null>(null);
  const [formName, setFormName] = useState('');
  const [formBasicPercent, setFormBasicPercent] = useState(60);
  const [components, setComponents] = useState<SalaryComponent[]>([]);

  useEffect(() => { setStructures(getSalaryStructures()); }, []);

  const openNew = () => {
    setEditing(null);
    setFormName('');
    setFormBasicPercent(60);
    setComponents([]);
    setShowModal(true);
  };

  const openEdit = (s: SalaryStructure) => {
    setEditing(s);
    setFormName(s.name);
    setFormBasicPercent(s.basicSalaryPercent);
    setComponents([...s.components]);
    setShowModal(true);
  };

  const addComponent = () => {
    setComponents([...components, { ...emptyComponent, id: uuidv4() }]);
  };

  const updateComponent = (id: string, field: string, value: any) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const handleSubmit = () => {
    if (!formName) return;
    let updated: SalaryStructure[];
    if (editing) {
      updated = structures.map(s => s.id === editing.id ? {
        ...s, name: formName, basicSalaryPercent: formBasicPercent, components,
      } : s);
    } else {
      updated = [...structures, {
        id: uuidv4(), name: formName, basicSalaryPercent: formBasicPercent, components,
      }];
    }
    saveSalaryStructures(updated);
    setStructures(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this salary structure?')) {
      const updated = structures.filter(s => s.id !== id);
      saveSalaryStructures(updated);
      setStructures(updated);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Salary Structures</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> New Structure
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {structures.map(s => (
          <div key={s.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                  <Edit2 size={12} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
              Basic Salary: {s.basicSalaryPercent}% of Gross
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.components.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`badge ${c.type === 'earning' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                      {c.type === 'earning' ? '+' : '-'}
                    </span>
                    {c.name}
                    {c.isStatutory && <span className="badge badge-info" style={{ fontSize: 9 }}>Statutory</span>}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {c.calculationType === 'percentage' ? `${c.value}% of ${c.basedOn}` : `NPR ${c.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {structures.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No salary structures yet. Create one to define earnings and deductions.
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{editing ? 'Edit' : 'New'} Salary Structure</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Structure Name *</label>
                <input className="form-input" value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Basic Salary % of Gross</label>
                <input className="form-input" type="number" value={formBasicPercent} onChange={e => setFormBasicPercent(Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Components</h3>
              <button className="btn btn-primary btn-sm" onClick={addComponent}>
                <Plus size={12} /> Add Component
              </button>
            </div>

            {components.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No components added yet. Add earnings (allowances) and deductions.
              </p>
            )}

            {components.map((c, idx) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto auto', gap: 8, alignItems: 'end', marginBottom: 8 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Name</label>}
                  <input className="form-input" value={c.name} placeholder="Component Name"
                    onChange={e => updateComponent(c.id, 'name', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Type</label>}
                  <select className="form-input" value={c.type}
                    onChange={e => updateComponent(c.id, 'type', e.target.value)}>
                    <option value="earning">Earning</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Calc Type</label>}
                  <select className="form-input" value={c.calculationType}
                    onChange={e => updateComponent(c.id, 'calculationType', e.target.value)}>
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Value</label>}
                  <input className="form-input" type="number" value={c.value}
                    onChange={e => updateComponent(c.id, 'value', Number(e.target.value))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {idx === 0 && <label className="form-label">Based On</label>}
                  <select className="form-input" value={c.basedOn || 'basic'}
                    onChange={e => updateComponent(c.id, 'basedOn', e.target.value)}
                    disabled={c.calculationType === 'fixed'}>
                    <option value="basic">Basic</option>
                    <option value="gross">Gross</option>
                  </select>
                </div>
                <div style={{ paddingBottom: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <input type="checkbox" checked={c.isStatutory}
                      onChange={e => updateComponent(c.id, 'isStatutory', e.target.checked)} />
                    Statutory
                  </label>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeComponent(c.id)} style={{ marginBottom: 2 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'} Structure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
