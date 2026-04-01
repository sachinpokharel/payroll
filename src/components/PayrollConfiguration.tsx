'use client';

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { getPayrollConfig, savePayrollConfig } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import type { PayrollConfig, TaxSlab } from '@/types';

export default function PayrollConfiguration() {
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'tax-single' | 'tax-married'>('general');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setConfig(getPayrollConfig()); }, []);

  if (!config) return null;

  const handleSave = () => {
    savePayrollConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const singleSlabs = config.taxSlabs.filter(s => !s.forMarried);
  const marriedSlabs = config.taxSlabs.filter(s => s.forMarried);

  const updateSlab = (id: string, field: keyof TaxSlab, value: any) => {
    setConfig({
      ...config,
      taxSlabs: config.taxSlabs.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  const addSlab = (forMarried: boolean) => {
    setConfig({
      ...config,
      taxSlabs: [...config.taxSlabs, {
        id: uuidv4(), label: 'New Slab', fromAmount: 0, toAmount: 0, ratePercent: 0, forMarried,
      }],
    });
  };

  const removeSlab = (id: string) => {
    setConfig({ ...config, taxSlabs: config.taxSlabs.filter(s => s.id !== id) });
  };

  const renderSlabTable = (slabs: TaxSlab[], forMarried: boolean) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>
          {forMarried ? 'Married' : 'Single'} Tax Slabs - FY {config.fiscalYear}
        </h3>
        <button className="btn btn-primary btn-sm" onClick={() => addSlab(forMarried)}>
          <Plus size={12} /> Add Slab
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Label</th>
            <th>From (NPR)</th>
            <th>To (NPR)</th>
            <th>Rate (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {slabs.map(slab => (
            <tr key={slab.id}>
              <td>
                <input className="form-input" value={slab.label} style={{ minWidth: 150 }}
                  onChange={e => updateSlab(slab.id, 'label', e.target.value)} />
              </td>
              <td>
                <input className="form-input" type="number" value={slab.fromAmount}
                  onChange={e => updateSlab(slab.id, 'fromAmount', Number(e.target.value))} style={{ width: 130 }} />
              </td>
              <td>
                <input className="form-input" type="number"
                  value={slab.toAmount === Infinity ? '' : slab.toAmount}
                  placeholder="Infinity"
                  onChange={e => updateSlab(slab.id, 'toAmount', e.target.value === '' ? Infinity : Number(e.target.value))}
                  style={{ width: 130 }} />
              </td>
              <td>
                <input className="form-input" type="number" value={slab.ratePercent}
                  onChange={e => updateSlab(slab.id, 'ratePercent', Number(e.target.value))} style={{ width: 80 }} />
              </td>
              <td>
                <button className="btn btn-danger btn-sm" onClick={() => removeSlab(slab.id)}>
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payroll Configuration</h1>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> {saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>

      <div className="tab-bar">
        <div className={`tab-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          General & Statutory
        </div>
        <div className={`tab-item ${activeTab === 'tax-single' ? 'active' : ''}`} onClick={() => setActiveTab('tax-single')}>
          Tax Slabs (Single)
        </div>
        <div className={`tab-item ${activeTab === 'tax-married' ? 'active' : ''}`} onClick={() => setActiveTab('tax-married')}>
          Tax Slabs (Married)
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>General Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div className="form-group">
              <label className="form-label">Fiscal Year (BS)</label>
              <input className="form-input" value={config.fiscalYear}
                onChange={e => setConfig({ ...config, fiscalYear: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Dashain Allowance (Months of Basic)</label>
              <input className="form-input" type="number" value={config.dashainAllowanceMonths}
                onChange={e => setConfig({ ...config, dashainAllowanceMonths: Number(e.target.value) })} />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>
            Social Security Fund (SSF)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            As per Social Security Act 2074, both employer and employee contribute to SSF.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div className="form-group">
              <label className="form-label">Employer Contribution (%)</label>
              <input className="form-input" type="number" value={config.ssfEmployerPercent}
                onChange={e => setConfig({ ...config, ssfEmployerPercent: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Contribution (%)</label>
              <input className="form-input" type="number" value={config.ssfEmployeePercent}
                onChange={e => setConfig({ ...config, ssfEmployeePercent: Number(e.target.value) })} />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>
            Provident Fund (PF)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div className="form-group">
              <label className="form-label">Employer Contribution (%)</label>
              <input className="form-input" type="number" value={config.pfEmployerPercent}
                onChange={e => setConfig({ ...config, pfEmployerPercent: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Employee Contribution (%)</label>
              <input className="form-input" type="number" value={config.pfEmployeePercent}
                onChange={e => setConfig({ ...config, pfEmployeePercent: Number(e.target.value) })} />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>
            Citizen Investment Trust (CIT)
          </h3>
          <div className="form-group">
            <label className="form-label">CIT Deduction (%)</label>
            <input className="form-input" type="number" value={config.citPercent}
              onChange={e => setConfig({ ...config, citPercent: Number(e.target.value) })}
              style={{ maxWidth: 200 }} />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>
            Insurance
          </h3>
          <div className="form-group">
            <label className="form-label">Annual Insurance Deduction (NPR)</label>
            <input className="form-input" type="number" value={config.insuranceDeduction}
              onChange={e => setConfig({ ...config, insuranceDeduction: Number(e.target.value) })}
              style={{ maxWidth: 200 }} />
          </div>
        </div>
      )}

      {activeTab === 'tax-single' && (
        <div className="card">
          {renderSlabTable(singleSlabs, false)}
        </div>
      )}

      {activeTab === 'tax-married' && (
        <div className="card">
          {renderSlabTable(marriedSlabs, true)}
        </div>
      )}
    </div>
  );
}
