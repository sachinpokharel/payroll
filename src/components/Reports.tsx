'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, DollarSign, FileText, Download } from 'lucide-react';
import { getEmployees, getPayrollRuns, getAttendanceRecords, getLeaveApplications, formatNPR } from '@/lib/store';
import type { Employee, PayrollRun } from '@/types';

type ReportType = 'payroll-summary' | 'employee-list' | 'tax-report' | 'attendance-summary' | 'department-cost';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('payroll-summary');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);

  useEffect(() => {
    setEmployees(getEmployees());
    setPayrollRuns(getPayrollRuns());
  }, []);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const reports = [
    { id: 'payroll-summary' as ReportType, name: 'Payroll Summary', icon: DollarSign, desc: 'Monthly payroll overview' },
    { id: 'employee-list' as ReportType, name: 'Employee Directory', icon: Users, desc: 'All employees with details' },
    { id: 'tax-report' as ReportType, name: 'Tax Report (TDS)', icon: FileText, desc: 'Monthly tax deductions' },
    { id: 'attendance-summary' as ReportType, name: 'Attendance Summary', icon: BarChart3, desc: 'Attendance statistics' },
    { id: 'department-cost' as ReportType, name: 'Department Cost', icon: BarChart3, desc: 'Cost breakdown by department' },
  ];

  const renderPayrollSummary = () => {
    if (payrollRuns.length === 0) {
      return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No payroll data available. Process a payroll first.</p>;
    }
    return (
      <div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Employees</th>
              <th>Gross Salary</th>
              <th>Total Tax</th>
              <th>Total SSF</th>
              <th>Total PF</th>
              <th>Total Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[...payrollRuns].reverse().map(run => {
              const totals = run.payslips.reduce(
                (acc, p) => ({
                  gross: acc.gross + p.grossEarnings,
                  tax: acc.tax + p.tax,
                  ssf: acc.ssf + p.ssf,
                  pf: acc.pf + p.pf,
                  deductions: acc.deductions + p.totalDeductions,
                  net: acc.net + p.netPay,
                }),
                { gross: 0, tax: 0, ssf: 0, pf: 0, deductions: 0, net: 0 }
              );
              return (
                <tr key={run.id}>
                  <td style={{ fontWeight: 600 }}>{run.month}/{run.year}</td>
                  <td>{run.payslips.length}</td>
                  <td>{formatNPR(totals.gross)}</td>
                  <td>{formatNPR(totals.tax)}</td>
                  <td>{formatNPR(totals.ssf)}</td>
                  <td>{formatNPR(totals.pf)}</td>
                  <td style={{ color: 'var(--accent)' }}>{formatNPR(totals.deductions)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatNPR(totals.net)}</td>
                  <td><span className={`badge ${run.status === 'Finalized' ? 'badge-success' : 'badge-warning'}`}>{run.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary cards */}
        {payrollRuns.length > 0 && (() => {
          const latest = payrollRuns[payrollRuns.length - 1];
          const totals = latest.payslips.reduce(
            (acc, p) => ({
              gross: acc.gross + p.grossEarnings,
              tax: acc.tax + p.tax,
              ssf: acc.ssf + p.ssf,
              pf: acc.pf + p.pf,
              net: acc.net + p.netPay,
            }),
            { gross: 0, tax: 0, ssf: 0, pf: 0, net: 0 }
          );
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 20 }}>
              <div style={{ padding: 16, background: '#dbeafe', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#1e40af' }}>Total Gross</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1e40af' }}>{formatNPR(totals.gross)}</div>
              </div>
              <div style={{ padding: 16, background: '#fecaca', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#991b1b' }}>Tax (TDS)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#991b1b' }}>{formatNPR(totals.tax)}</div>
              </div>
              <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#92400e' }}>SSF</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e' }}>{formatNPR(totals.ssf)}</div>
              </div>
              <div style={{ padding: 16, background: '#ede9fe', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#5b21b6' }}>PF</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#5b21b6' }}>{formatNPR(totals.pf)}</div>
              </div>
              <div style={{ padding: 16, background: '#dcfce7', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#166534' }}>Net Paid</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#166534' }}>{formatNPR(totals.net)}</div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderEmployeeList = () => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Name</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Date of Joining</th>
          <th>PAN</th>
          <th>Bank</th>
          <th>Account No</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {employees.length === 0 ? (
          <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees.</td></tr>
        ) : (
          employees.map(emp => (
            <tr key={emp.id}>
              <td style={{ fontWeight: 600 }}>{emp.employeeId}</td>
              <td>{emp.firstName} {emp.lastName}</td>
              <td>{emp.department}</td>
              <td>{emp.designation}</td>
              <td>{emp.dateOfJoining}</td>
              <td>{emp.pan}</td>
              <td>{emp.bankName}</td>
              <td>{emp.bankAccountNumber}</td>
              <td><span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{emp.status}</span></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );

  const renderTaxReport = () => {
    if (payrollRuns.length === 0) {
      return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No payroll data available.</p>;
    }
    const latest = payrollRuns[payrollRuns.length - 1];
    return (
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          TDS Report - {latest.month}/{latest.year}
        </h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Gross Salary</th>
              <th>SSF Deduction</th>
              <th>PF Deduction</th>
              <th>Taxable Income (Monthly)</th>
              <th>TDS Amount</th>
            </tr>
          </thead>
          <tbody>
            {latest.payslips.map(slip => (
              <tr key={slip.id}>
                <td style={{ fontWeight: 600 }}>{employees.find(e => e.id === slip.employeeId)?.employeeId}</td>
                <td>{getEmployeeName(slip.employeeId)}</td>
                <td>{formatNPR(slip.grossEarnings)}</td>
                <td>{formatNPR(slip.ssf)}</td>
                <td>{formatNPR(slip.pf)}</td>
                <td>{formatNPR(slip.grossEarnings - slip.ssf)}</td>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatNPR(slip.tax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16, padding: 16, background: '#fecaca', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Total TDS Payable to IRD</span>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{formatNPR(latest.payslips.reduce((s, p) => s + p.tax, 0))}</span>
        </div>
      </div>
    );
  };

  const renderAttendanceSummary = () => {
    const records = getAttendanceRecords();
    const empStats = employees.map(emp => {
      const empRecords = records.filter(r => r.employeeId === emp.id);
      return {
        emp,
        total: empRecords.length,
        present: empRecords.filter(r => r.status === 'Present').length,
        absent: empRecords.filter(r => r.status === 'Absent').length,
        halfDay: empRecords.filter(r => r.status === 'Half Day').length,
        onLeave: empRecords.filter(r => r.status === 'On Leave').length,
        avgHours: empRecords.length > 0
          ? Math.round(empRecords.reduce((s, r) => s + r.workingHours, 0) / empRecords.length * 10) / 10
          : 0,
      };
    });

    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Total Records</th>
            <th>Present</th>
            <th>Absent</th>
            <th>Half Day</th>
            <th>On Leave</th>
            <th>Avg Hours/Day</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {empStats.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No data.</td></tr>
          ) : (
            empStats.map(s => (
              <tr key={s.emp.id}>
                <td style={{ fontWeight: 600 }}>{s.emp.firstName} {s.emp.lastName}</td>
                <td>{s.total}</td>
                <td style={{ color: 'var(--success)' }}>{s.present}</td>
                <td style={{ color: 'var(--accent)' }}>{s.absent}</td>
                <td>{s.halfDay}</td>
                <td>{s.onLeave}</td>
                <td>{s.avgHours}h</td>
                <td>
                  <span className={`badge ${
                    s.total === 0 ? 'badge-info' :
                    (s.present / s.total * 100) >= 90 ? 'badge-success' :
                    (s.present / s.total * 100) >= 75 ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {s.total === 0 ? 'N/A' : `${Math.round(s.present / s.total * 100)}%`}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );
  };

  const renderDepartmentCost = () => {
    if (payrollRuns.length === 0) {
      return <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No payroll data available.</p>;
    }
    const latest = payrollRuns[payrollRuns.length - 1];
    const deptMap: Record<string, { gross: number; net: number; tax: number; count: number }> = {};

    latest.payslips.forEach(slip => {
      const emp = employees.find(e => e.id === slip.employeeId);
      const dept = emp?.department || 'Unassigned';
      if (!deptMap[dept]) deptMap[dept] = { gross: 0, net: 0, tax: 0, count: 0 };
      deptMap[dept].gross += slip.grossEarnings;
      deptMap[dept].net += slip.netPay;
      deptMap[dept].tax += slip.tax;
      deptMap[dept].count += 1;
    });

    const departments = Object.entries(deptMap).sort((a, b) => b[1].gross - a[1].gross);
    const totalGross = departments.reduce((s, [, d]) => s + d.gross, 0);

    return (
      <div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Headcount</th>
              <th>Gross Cost</th>
              <th>Tax Contribution</th>
              <th>Net Payout</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(([dept, data]) => (
              <tr key={dept}>
                <td style={{ fontWeight: 600 }}>{dept}</td>
                <td>{data.count}</td>
                <td>{formatNPR(data.gross)}</td>
                <td>{formatNPR(data.tax)}</td>
                <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatNPR(data.net)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: 'var(--primary)',
                        width: `${totalGross > 0 ? (data.gross / totalGross * 100) : 0}%`,
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {totalGross > 0 ? Math.round(data.gross / totalGross * 100) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderReport = () => {
    switch (activeReport) {
      case 'payroll-summary': return renderPayrollSummary();
      case 'employee-list': return renderEmployeeList();
      case 'tax-report': return renderTaxReport();
      case 'attendance-summary': return renderAttendanceSummary();
      case 'department-cost': return renderDepartmentCost();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {reports.map(r => (
          <div
            key={r.id}
            className="card"
            style={{
              cursor: 'pointer', textAlign: 'center', padding: 16,
              border: activeReport === r.id ? '2px solid var(--primary)' : '1px solid var(--border)',
              background: activeReport === r.id ? '#eff6ff' : 'white',
            }}
            onClick={() => setActiveReport(r.id)}
          >
            <r.icon size={24} color={activeReport === r.id ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>
            {reports.find(r => r.id === activeReport)?.name}
          </h3>
        </div>
        {renderReport()}
      </div>
    </div>
  );
}
