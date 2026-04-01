'use client';

import {
  LayoutDashboard, Users, Calendar, CalendarCheck, Clock,
  Settings, Layers, DollarSign, BarChart3, ChevronDown, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import type { PageName } from '@/types';

interface SidebarProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    leave: true,
    payroll: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #dc2626, #fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700
          }}>
            <span style={{color: '#1e3a8a'}}>NP</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Nepal Payroll</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Management System</div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '12px 0' }}>
        <div
          className={`sidebar-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </div>

        <div
          className={`sidebar-nav-item ${currentPage === 'employees' ? 'active' : ''}`}
          onClick={() => onNavigate('employees')}
        >
          <Users size={18} />
          Employees
        </div>

        {/* Leave Section */}
        <div
          className="sidebar-nav-item"
          onClick={() => toggleSection('leave')}
          style={{ marginTop: 8 }}
        >
          <Calendar size={18} />
          Leave Management
          {expandedSections.leave ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
        </div>
        {expandedSections.leave && (
          <>
            <div
              className={`sidebar-nav-item ${currentPage === 'leave-types' ? 'active' : ''}`}
              onClick={() => onNavigate('leave-types')}
              style={{ paddingLeft: 50 }}
            >
              Leave Types
            </div>
            <div
              className={`sidebar-nav-item ${currentPage === 'leave-applications' ? 'active' : ''}`}
              onClick={() => onNavigate('leave-applications')}
              style={{ paddingLeft: 50 }}
            >
              Applications
            </div>
          </>
        )}

        <div
          className={`sidebar-nav-item ${currentPage === 'attendance' ? 'active' : ''}`}
          onClick={() => onNavigate('attendance')}
        >
          <Clock size={18} />
          Attendance
        </div>

        {/* Payroll Section */}
        <div
          className="sidebar-nav-item"
          onClick={() => toggleSection('payroll')}
          style={{ marginTop: 8 }}
        >
          <DollarSign size={18} />
          Payroll
          {expandedSections.payroll ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
        </div>
        {expandedSections.payroll && (
          <>
            <div
              className={`sidebar-nav-item ${currentPage === 'payroll-config' ? 'active' : ''}`}
              onClick={() => onNavigate('payroll-config')}
              style={{ paddingLeft: 50 }}
            >
              Configuration
            </div>
            <div
              className={`sidebar-nav-item ${currentPage === 'salary-structures' ? 'active' : ''}`}
              onClick={() => onNavigate('salary-structures')}
              style={{ paddingLeft: 50 }}
            >
              Salary Structures
            </div>
            <div
              className={`sidebar-nav-item ${currentPage === 'payroll-run' ? 'active' : ''}`}
              onClick={() => onNavigate('payroll-run')}
              style={{ paddingLeft: 50 }}
            >
              Process Payroll
            </div>
          </>
        )}

        <div
          className={`sidebar-nav-item ${currentPage === 'reports' ? 'active' : ''}`}
          onClick={() => onNavigate('reports')}
          style={{ marginTop: 8 }}
        >
          <BarChart3 size={18} />
          Reports
        </div>
      </nav>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: 11, opacity: 0.5, textAlign: 'center'
      }}>
        Nepal Payroll System v1.0<br />
        FY 2081/82 Compliant
      </div>
    </div>
  );
}
