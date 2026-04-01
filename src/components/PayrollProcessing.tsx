'use client';

import { useState, useEffect } from 'react';
import { Play, Eye, CheckCircle, X, DollarSign, Download } from 'lucide-react';
import { getPayrollRuns, processPayroll, savePayrollRuns, getEmployees, formatNPR } from '@/lib/store';
import type { PayrollRun, Employee, Payslip } from '@/types';

const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const monthNames: Record<string, string> = {
  '01': 'Baishakh', '02': 'Jestha', '03': 'Ashadh', '04': 'Shrawan',
  '05': 'Bhadra', '06': 'Ashwin', '07': 'Kartik', '08': 'Mangsir',
  '09': 'Poush', '10': 'Magh', '11': 'Falgun', '12': 'Chaitra',
};

export default function PayrollProcessing() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [selectedYear, setSelectedYear] = useState(2082);
  const [showPayslip, setShowPayslip] = useState<Payslip | null>(null);
  const [showRunDetail, setShowRunDetail] = useState<PayrollRun | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setRuns(getPayrollRuns());
    setEmployees(getEmployees());
  }, []);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const getEmployeeEmpId = (id: string) => {
    return employees.find(e => e.id === id)?.employeeId || '';
  };

  const handleProcess = () => {
    const activeEmps = employees.filter(e => e.status === 'Active');
    if (activeEmps.length === 0) {
      alert('No active employees found. Please add employees first.');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      const run = processPayroll(selectedMonth, selectedYear);
      setRuns(getPayrollRuns());
      setShowRunDetail(run);
      setProcessing(false);
    }, 500);
  };

  const handleFinalize = (run: PayrollRun) => {
    const updated = runs.map(r => r.id === run.id ? { ...r, status: 'Finalized' as const } : r);
    savePayrollRuns(updated);
    setRuns(updated);
    if (showRunDetail?.id === run.id) {
      setShowRunDetail({ ...run, status: 'Finalized' });
    }
  };

  const totalNetPay = (run: PayrollRun) => run.payslips.reduce((s, p) => s + p.netPay, 0);
  const totalGross = (run: PayrollRun) => run.payslips.reduce((s, p) => s + p.grossEarnings, 0);
  const totalDeductions = (run: PayrollRun) => run.payslips.reduce((s, p) => s + p.totalDeductions, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Process Payroll</h1>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Run New Payroll</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Month (BS)</label>
            <select className="form-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {months.map(m => <option key={m} value={m}>{monthNames[m]} ({m})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Year (BS)</label>
            <input className="form-input" type="number" value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))} style={{ width: 100 }} />
          </div>
          <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
            <Play size={16} /> {processing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Payroll History</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Processed Date</th>
              <th>Employees</th>
              <th>Gross Pay</th>
              <th>Total Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No payroll runs yet. Process your first payroll above.
              </td></tr>
            ) : (
              [...runs].reverse().map(run => (
                <tr key={run.id}>
                  <td style={{ fontWeight: 600 }}>{monthNames[run.month]} {run.year}</td>
                  <td>{run.processedDate}</td>
                  <td>{run.payslips.length}</td>
                  <td>{formatNPR(totalGross(run))}</td>
                  <td style={{ color: 'var(--accent)' }}>{formatNPR(totalDeductions(run))}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatNPR(totalNetPay(run))}</td>
                  <td>
                    <span className={`badge ${
                      run.status === 'Finalized' ? 'badge-success' :
                      run.status === 'Processed' ? 'badge-info' : 'badge-warning'
                    }`}>{run.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowRunDetail(run)}>
                        <Eye size={12} /> View
                      </button>
                      {run.status !== 'Finalized' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleFinalize(run)}>
                          <CheckCircle size={12} /> Finalize
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Run Detail Modal */}
      {showRunDetail && (
        <div className="modal-overlay" onClick={() => setShowRunDetail(null)}>
          <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 950 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                Payroll - {monthNames[showRunDetail.month]} {showRunDetail.year}
              </h2>
              <button onClick={() => setShowRunDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 16, background: '#dcfce7', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#166534' }}>Total Gross</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{formatNPR(totalGross(showRunDetail))}</div>
              </div>
              <div style={{ padding: 16, background: '#fecaca', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#991b1b' }}>Total Deductions</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#991b1b' }}>{formatNPR(totalDeductions(showRunDetail))}</div>
              </div>
              <div style={{ padding: 16, background: '#dbeafe', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#1e40af' }}>Net Payable</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1e40af' }}>{formatNPR(totalNetPay(showRunDetail))}</div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Employee</th>
                  <th>Basic</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Tax</th>
                  <th>Net Pay</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {showRunDetail.payslips.map(slip => (
                  <tr key={slip.id}>
                    <td>{getEmployeeEmpId(slip.employeeId)}</td>
                    <td style={{ fontWeight: 600 }}>{getEmployeeName(slip.employeeId)}</td>
                    <td>{formatNPR(slip.basicSalary)}</td>
                    <td>{formatNPR(slip.grossEarnings)}</td>
                    <td style={{ color: 'var(--accent)' }}>{formatNPR(slip.totalDeductions)}</td>
                    <td>{formatNPR(slip.tax)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatNPR(slip.netPay)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShowPayslip(slip)}>
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Detail Modal */}
      {showPayslip && (
        <div className="modal-overlay" onClick={() => setShowPayslip(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Payslip - {getEmployeeName(showPayslip.employeeId)}</h2>
              <button onClick={() => setShowPayslip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><strong>Employee:</strong> {getEmployeeName(showPayslip.employeeId)}</div>
                <div><strong>Employee ID:</strong> {getEmployeeEmpId(showPayslip.employeeId)}</div>
                <div><strong>Working Days:</strong> {showPayslip.workingDays}</div>
                <div><strong>Present Days:</strong> {showPayslip.presentDays}</div>
                <div><strong>Leave Days:</strong> {showPayslip.leaveDays}</div>
                <div><strong>Absent Days:</strong> {showPayslip.absentDays}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>Earnings</h4>
                {showPayslip.earnings.map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{e.name}</span>
                    <span>{formatNPR(e.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '8px 0', borderTop: '2px solid var(--border)', marginTop: 4 }}>
                  <span>Total Earnings</span>
                  <span style={{ color: 'var(--success)' }}>{formatNPR(showPayslip.grossEarnings)}</span>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>Deductions</h4>
                {showPayslip.deductions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span>{d.name}</span>
                    <span>{formatNPR(d.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '8px 0', borderTop: '2px solid var(--border)', marginTop: 4 }}>
                  <span>Total Deductions</span>
                  <span style={{ color: 'var(--accent)' }}>{formatNPR(showPayslip.totalDeductions)}</span>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: 16, padding: 16, borderRadius: 8,
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Net Pay</span>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{formatNPR(showPayslip.netPay)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
