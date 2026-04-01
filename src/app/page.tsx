'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import EmployeeList from '@/components/EmployeeList';
import LeaveTypes from '@/components/LeaveTypes';
import LeaveApplications from '@/components/LeaveApplications';
import AttendanceManager from '@/components/AttendanceManager';
import PayrollConfiguration from '@/components/PayrollConfiguration';
import SalaryStructures from '@/components/SalaryStructures';
import PayrollProcessing from '@/components/PayrollProcessing';
import Reports from '@/components/Reports';
import type { PageName } from '@/types';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageName>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'employees': return <EmployeeList />;
      case 'leave-types': return <LeaveTypes />;
      case 'leave-applications': return <LeaveApplications />;
      case 'attendance': return <AttendanceManager />;
      case 'payroll-config': return <PayrollConfiguration />;
      case 'salary-structures': return <SalaryStructures />;
      case 'payroll-run': return <PayrollProcessing />;
      case 'reports': return <Reports />;
      default: return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
