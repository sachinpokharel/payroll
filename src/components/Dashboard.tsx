'use client';

import { useEffect, useState } from 'react';
import { Users, Calendar, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { getEmployees, getLeaveApplications, getPayrollRuns, getAttendanceRecords, formatNPR } from '@/lib/store';
import type { PageName } from '@/types';

interface DashboardProps {
  onNavigate: (page: PageName) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaves: 0,
    totalPayrollCost: 0,
    todayPresent: 0,
    recentPayroll: null as any,
  });

  useEffect(() => {
    const employees = getEmployees();
    const leaves = getLeaveApplications();
    const payrolls = getPayrollRuns();
    const attendance = getAttendanceRecords();
    const today = new Date().toISOString().split('T')[0];

    const latestPayroll = payrolls.length > 0 ? payrolls[payrolls.length - 1] : null;
    const totalCost = latestPayroll
      ? latestPayroll.payslips.reduce((sum, p) => sum + p.netPay, 0)
      : 0;

    setStats({
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'Active').length,
      pendingLeaves: leaves.filter(l => l.status === 'Pending').length,
      totalPayrollCost: totalCost,
      todayPresent: attendance.filter(a => a.date === today && a.status === 'Present').length,
      recentPayroll: latestPayroll,
    });
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      subtitle: `${stats.activeEmployees} active`,
      icon: Users,
      color: '#3b82f6',
      bg: '#dbeafe',
      page: 'employees' as PageName,
    },
    {
      title: 'Pending Leaves',
      value: stats.pendingLeaves,
      subtitle: 'Awaiting approval',
      icon: Calendar,
      color: '#d97706',
      bg: '#fef3c7',
      page: 'leave-applications' as PageName,
    },
    {
      title: 'Last Payroll Cost',
      value: formatNPR(stats.totalPayrollCost),
      subtitle: stats.recentPayroll ? `${stats.recentPayroll.month}/${stats.recentPayroll.year}` : 'No payroll yet',
      icon: DollarSign,
      color: '#16a34a',
      bg: '#dcfce7',
      page: 'payroll-run' as PageName,
    },
    {
      title: 'Today Present',
      value: stats.todayPresent,
      subtitle: `of ${stats.activeEmployees} employees`,
      icon: Clock,
      color: '#7c3aed',
      bg: '#ede9fe',
      page: 'attendance' as PageName,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Nepal Payroll Management System - FY 2081/82
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigate(card.page)}
          >
            <div className="stat-icon" style={{ background: card.bg }}>
              <card.icon size={24} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{card.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => onNavigate('employees')}>
              <Users size={16} /> Add Employee
            </button>
            <button className="btn btn-success" onClick={() => onNavigate('payroll-run')}>
              <DollarSign size={16} /> Run Payroll
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('attendance')}>
              <Clock size={16} /> Mark Attendance
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('leave-applications')}>
              <Calendar size={16} /> Leave Requests
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Nepal Statutory Compliance</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Social Security Fund (SSF)</span>
              <span className="badge badge-success">Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Income Tax (TDS)</span>
              <span className="badge badge-success">FY 2081/82 Slabs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Provident Fund</span>
              <span className="badge badge-success">10% Employer + 10% Employee</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Dashain Allowance</span>
              <span className="badge badge-info">1 Month Basic</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          <AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />
          Getting Started Guide
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Step 1</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure payroll settings, tax slabs, and statutory components</div>
          </div>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Step 2</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add employees and assign salary structures</div>
          </div>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Step 3</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track attendance, manage leaves, and process monthly payroll</div>
          </div>
        </div>
      </div>
    </div>
  );
}
