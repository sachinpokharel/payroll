'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight,
  LogIn, LogOut, Users, CalendarDays, Clock, Coffee
} from 'lucide-react';
import { getAttendanceRecords, addAttendanceRecord, getEmployees } from '@/lib/store';
import type { AttendanceRecord, Employee } from '@/types';

/* ── Helpers ── */

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return dateToStr(d);
  });
}

function getMonthDates(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => dateToStr(new Date(year, month, i + 1)));
}

function parseDate(str: string) {
  const d = new Date(str + 'T00:00:00');
  return {
    dayName: DAY_NAMES[d.getDay()],
    dayNum: d.getDate(),
    month: MONTH_NAMES[d.getMonth()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}

function fmt12(t: string): string {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function timeToPercent(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return Math.max(0, Math.min(100, ((h * 60 + m - 360) / 960) * 100));
}

function calcHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const [h1, m1] = checkIn.split(':').map(Number);
  const [h2, m2] = checkOut.split(':').map(Number);
  return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; fill: string }> = {
  Present: { color: '#166534', bg: '#dcfce7', fill: 'linear-gradient(90deg, #4ade80, #16a34a)' },
  Absent: { color: '#991b1b', bg: '#fee2e2', fill: 'linear-gradient(90deg, #f87171, #dc2626)' },
  'Half Day': { color: '#92400e', bg: '#fef3c7', fill: 'linear-gradient(90deg, #fbbf24, #d97706)' },
  'On Leave': { color: '#1e40af', bg: '#dbeafe', fill: 'linear-gradient(90deg, #60a5fa, #2563eb)' },
};

/* ── Sub-components ── */

function TimelineBar({ checkIn, checkOut, status }: { checkIn: string; checkOut: string; status: string }) {
  const left = timeToPercent(checkIn);
  const right = timeToPercent(checkOut);
  const width = right - left;
  const cfg = STATUS_STYLE[status] || STATUS_STYLE.Present;

  if (!checkIn || !checkOut || width <= 0) {
    return <div className="att-timeline-track" />;
  }

  return (
    <div className="att-timeline">
      <div className="att-timeline-track">
        <div
          className="att-timeline-fill"
          style={{ left: `${left}%`, width: `${width}%`, background: cfg.fill }}
        />
      </div>
      <div className="att-timeline-labels">
        <span className="att-timeline-time">
          <LogIn size={10} /> {fmt12(checkIn)}
        </span>
        <span className="att-timeline-time">
          {fmt12(checkOut)} <LogOut size={10} />
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_STYLE[status] || STATUS_STYLE.Present;
  return (
    <span className="att-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="att-status-dot" style={{ background: cfg.color }} />
      {status}
    </span>
  );
}

/* ── Main Component ── */

export default function AttendanceManager() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [monthYear, setMonthYear] = useState(() => ({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  }));
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()));
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    checkIn: '10:00',
    checkOut: '18:00',
    status: 'Present' as AttendanceRecord['status'],
  });

  useEffect(() => {
    setRecords(getAttendanceRecords());
    setEmployees(getEmployees().filter(e => e.status === 'Active'));
  }, []);

  const isEmployeeView = selectedEmployee !== 'all';

  const dateRange = useMemo(() => {
    if (!isEmployeeView) return [selectedDate];
    if (viewMode === 'weekly') return getWeekDates(weekStart);
    return getMonthDates(monthYear.year, monthYear.month);
  }, [isEmployeeView, selectedDate, viewMode, weekStart, monthYear]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const inRange = dateRange.includes(r.date);
      const matchesEmp = !isEmployeeView || r.employeeId === selectedEmployee;
      return inRange && matchesEmp;
    });
  }, [records, dateRange, isEmployeeView, selectedEmployee]);

  const summary = useMemo(() => {
    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const halfDay = filteredRecords.filter(r => r.status === 'Half Day').length;
    const onLeave = filteredRecords.filter(r => r.status === 'On Leave').length;
    const totalHours = filteredRecords.reduce((s, r) => s + (r.workingHours || 0), 0);
    return { present, absent, halfDay, onLeave, totalHours: Math.round(totalHours * 10) / 10 };
  }, [filteredRecords]);

  /* ── Navigation ── */
  const navPrev = () => {
    if (!isEmployeeView) {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      setSelectedDate(dateToStr(d));
    } else if (viewMode === 'weekly') {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setWeekStart(d);
    } else {
      setMonthYear(prev => prev.month === 0
        ? { month: 11, year: prev.year - 1 }
        : { month: prev.month - 1, year: prev.year });
    }
  };

  const navNext = () => {
    if (!isEmployeeView) {
      const d = new Date(selectedDate + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      setSelectedDate(dateToStr(d));
    } else if (viewMode === 'weekly') {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    } else {
      setMonthYear(prev => prev.month === 11
        ? { month: 0, year: prev.year + 1 }
        : { month: prev.month + 1, year: prev.year });
    }
  };

  const dateRangeLabel = useMemo(() => {
    if (!isEmployeeView) {
      const p = parseDate(selectedDate);
      return `${p.dayName}, ${p.month} ${p.dayNum}`;
    }
    if (viewMode === 'weekly') {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const s = parseDate(dateToStr(weekStart));
      const e = parseDate(dateToStr(end));
      return `${s.month} ${s.dayNum} \u2013 ${e.month} ${e.dayNum}, ${weekStart.getFullYear()}`;
    }
    return `${FULL_MONTHS[monthYear.month]} ${monthYear.year}`;
  }, [isEmployeeView, selectedDate, viewMode, weekStart, monthYear]);

  /* ── Employee helpers ── */
  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };
  const getEmpInitials = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName[0]}${emp.lastName[0]}` : '??';
  };
  const getEmpCode = (id: string) => employees.find(e => e.id === id)?.employeeId || '';

  /* ── Handlers ── */
  const handleSingleSubmit = () => {
    if (!formData.employeeId || !formData.date) return;
    addAttendanceRecord({
      employeeId: formData.employeeId,
      date: formData.date,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      status: formData.status,
      workingHours: calcHours(formData.checkIn, formData.checkOut),
    });
    setRecords(getAttendanceRecords());
    setShowSingleModal(false);
  };

  const handleBulkMark = (status: AttendanceRecord['status']) => {
    const existing = records.filter(r => r.date === selectedDate).map(r => r.employeeId);
    employees.filter(e => !existing.includes(e.id)).forEach(emp => {
      addAttendanceRecord({
        employeeId: emp.id,
        date: selectedDate,
        checkIn: status === 'Present' ? '10:00' : '',
        checkOut: status === 'Present' ? '18:00' : '',
        status,
        workingHours: status === 'Present' ? 8 : status === 'Half Day' ? 4 : 0,
      });
    });
    setRecords(getAttendanceRecords());
    setShowBulkModal(false);
  };

  const unmarkedCount = employees.length - records.filter(r => r.date === selectedDate).length;

  /* ── Stat config ── */
  const stats = [
    { value: summary.present, label: 'Present', color: '#16a34a' },
    { value: summary.absent, label: 'Absent', color: '#dc2626' },
    { value: summary.halfDay, label: 'Half Day', color: '#d97706' },
    { value: summary.onLeave, label: 'On Leave', color: '#2563eb' },
    { value: `${summary.totalHours}h`, label: 'Total Hours', color: '#7c3aed' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            <Users size={15} /> Bulk Mark
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormData(f => ({ ...f, date: selectedDate }));
            setShowSingleModal(true);
          }}>
            <Plus size={15} /> Add Record
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="att-controls-bar">
        {/* Employee selector */}
        <select
          className="form-input"
          style={{ maxWidth: 220, fontSize: 13 }}
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
        >
          <option value="all">All Employees</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName} ({e.employeeId})
            </option>
          ))}
        </select>

        <div className="att-controls-divider" />

        {/* Weekly / Monthly toggle (employee view only) */}
        {isEmployeeView && (
          <>
            <div className="att-toggle">
              {(['weekly', 'monthly'] as const).map(mode => (
                <button
                  key={mode}
                  className={`att-toggle-btn ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
            <div className="att-controls-divider" />
          </>
        )}

        {/* Date navigation */}
        <div className="att-nav">
          <button className="att-nav-btn" onClick={navPrev}>
            <ChevronLeft size={16} />
          </button>
          <div className="att-nav-label">
            <CalendarDays size={14} />
            <span>{dateRangeLabel}</span>
          </div>
          <button className="att-nav-btn" onClick={navNext}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="att-stats-ribbon">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="att-stat-cell"
            style={{ borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div className="att-stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="att-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="att-card-list">
        {isEmployeeView ? (
          /* ── Employee View: one card per day ── */
          dateRange.map(dateStr => {
            const record = filteredRecords.find(r => r.date === dateStr);
            const { dayName, dayNum, month, isWeekend } = parseDate(dateStr);
            const cfg = record ? STATUS_STYLE[record.status] || STATUS_STYLE.Present : null;

            return (
              <div
                key={dateStr}
                className="att-card"
                style={{ opacity: !record && isWeekend ? 0.55 : 1 }}
              >
                {/* Date column */}
                <div className={`att-card-date ${isWeekend ? 'weekend' : ''}`}>
                  <span className="att-card-day" style={{ color: isWeekend ? 'var(--accent)' : undefined }}>
                    {dayName}
                  </span>
                  <span className="att-card-num">{dayNum}</span>
                  <span className="att-card-month">{month}</span>
                </div>

                {/* Content */}
                <div className="att-card-body">
                  {record ? (
                    <>
                      <div className="att-card-row">
                        <StatusBadge status={record.status} />
                        <div className="att-card-hours">
                          <Clock size={13} />
                          {record.workingHours}<span className="att-card-hours-unit">hrs</span>
                        </div>
                      </div>
                      <TimelineBar
                        checkIn={record.checkIn}
                        checkOut={record.checkOut}
                        status={record.status}
                      />
                    </>
                  ) : (
                    <div className="att-card-empty">
                      {isWeekend ? (
                        <><Coffee size={14} /> Weekend</>
                      ) : (
                        'No record'
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* ── Date View: one card per employee ── */
          filteredRecords.length === 0 ? (
            <div className="att-empty-state">
              <CalendarDays size={44} strokeWidth={1.2} />
              <div className="att-empty-title">No attendance records</div>
              <div className="att-empty-desc">
                No records for {dateRangeLabel}. Use &quot;Bulk Mark&quot; or &quot;Add Record&quot; to get started.
              </div>
            </div>
          ) : (
            filteredRecords.map(record => {
              const cfg = STATUS_STYLE[record.status] || STATUS_STYLE.Present;
              return (
                <div key={record.id} className="att-card">
                  {/* Avatar column */}
                  <div className="att-card-avatar-col">
                    <div
                      className="att-card-avatar"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {getEmpInitials(record.employeeId)}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="att-card-body">
                    <div className="att-card-row">
                      <div className="att-card-emp-info">
                        <span className="att-card-emp-name">
                          {getEmpName(record.employeeId)}
                        </span>
                        <span className="att-card-emp-id">
                          {getEmpCode(record.employeeId)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <StatusBadge status={record.status} />
                        <div className="att-card-hours">
                          <Clock size={13} />
                          {record.workingHours}<span className="att-card-hours-unit">hrs</span>
                        </div>
                      </div>
                    </div>
                    <TimelineBar
                      checkIn={record.checkIn}
                      checkOut={record.checkOut}
                      status={record.status}
                    />
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* ── Bulk Mark Modal ── */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h2 className="att-modal-title">Bulk Mark Attendance</h2>
              <button className="att-modal-close" onClick={() => setShowBulkModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p className="att-modal-date">Date: <strong>{selectedDate}</strong></p>
            <p className="att-modal-hint">
              {unmarkedCount} employee{unmarkedCount !== 1 ? 's' : ''} without records will be marked.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={() => handleBulkMark('Present')}>
                Mark All Present
              </button>
              <button className="btn btn-danger" onClick={() => handleBulkMark('Absent')}>
                Mark All Absent
              </button>
              <button className="btn btn-secondary" onClick={() => handleBulkMark('Half Day')}>
                Mark All Half Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Record Modal ── */}
      {showSingleModal && (
        <div className="modal-overlay" onClick={() => setShowSingleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="att-modal-header">
              <h2 className="att-modal-title">Add Attendance Record</h2>
              <button className="att-modal-close" onClick={() => setShowSingleModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select
                className="form-input"
                value={formData.employeeId}
                onChange={e => setFormData(f => ({ ...f, employeeId: e.target.value }))}
              >
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                className="form-input"
                type="date"
                value={formData.date}
                onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input
                  className="form-input"
                  type="time"
                  value={formData.checkIn}
                  onChange={e => setFormData(f => ({ ...f, checkIn: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input
                  className="form-input"
                  type="time"
                  value={formData.checkOut}
                  onChange={e => setFormData(f => ({ ...f, checkOut: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={e => setFormData(f => ({ ...f, status: e.target.value as AttendanceRecord['status'] }))}
              >
                <option>Present</option>
                <option>Absent</option>
                <option>Half Day</option>
                <option>On Leave</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSingleModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSingleSubmit}>
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
