'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight,
  Users, CalendarDays, Clock, Coffee, History
} from 'lucide-react';
import { getAttendanceRecords, addAttendanceRecord, getEmployees } from '@/lib/store';
import type { AttendanceRecord, Employee } from '@/types';

/* ── Constants & Helpers ── */

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SHIFT_START = '10:00'; // expected check-in
const SHIFT_END = '18:00';   // expected check-out

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
    fullYear: d.getFullYear(),
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}

function fmt12(t: string): string {
  if (!t) return '--:--';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Map a time string to a 0-100% position on a 6AM–10PM track */
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

function minutesBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const [h1, m1] = a.split(':').map(Number);
  const [h2, m2] = b.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function getShiftLabel(checkIn: string): string {
  if (!checkIn) return '';
  const [h] = checkIn.split(':').map(Number);
  if (h < 12) return 'Morning Shift';
  if (h < 17) return 'Day Shift';
  return 'Night Shift';
}

function fmtMinToHrs(min: number): string {
  if (min <= 0) return '0';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}`;
  return `${h}h ${m}m`;
}

const STATUS_COLORS: Record<string, { dot: string; bg: string; barColor: string }> = {
  Present:    { dot: '#22c55e', bg: 'rgba(34,197,94,0.1)',  barColor: '#22c55e' },
  Absent:     { dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',  barColor: '#ef4444' },
  'Half Day': { dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)', barColor: '#f59e0b' },
  'On Leave': { dot: '#3b82f6', bg: 'rgba(59,130,246,0.1)', barColor: '#3b82f6' },
};

/* ── Timeline Bar (matches screenshot style, decluttered) ── */

function TimelineBar({ checkIn, checkOut, status }: { checkIn: string; checkOut: string; status: string }) {
  const inPos = timeToPercent(checkIn);
  const outPos = timeToPercent(checkOut);
  const width = outPos - inPos;
  const sc = STATUS_COLORS[status] || STATUS_COLORS.Present;
  const isLate = checkIn > SHIFT_START;
  const lateMarkerPos = timeToPercent(SHIFT_START);

  if (!checkIn || !checkOut || width <= 0) {
    return (
      <div className="att-tl-section">
        <div className="att-tl-track-wrap">
          <div className="att-tl-track"><div className="att-tl-bar-empty" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="att-tl-section">
      {/* Clocked In / Clocked Out header labels */}
      <div className="att-tl-clock-labels">
        <span>Clocked In</span>
        <span>Clocked Out</span>
      </div>

      {/* Timeline track with dots and bar */}
      <div className="att-tl-track-wrap">
        {/* Start dot */}
        <div className="att-tl-endpoint" style={{ left: `${inPos}%`, borderColor: sc.barColor }} />
        {/* End dot */}
        <div className="att-tl-endpoint" style={{ left: `${outPos}%`, borderColor: sc.barColor }} />
        {/* Track */}
        <div className="att-tl-track">
          <div
            className="att-tl-bar"
            style={{ left: `${inPos}%`, width: `${width}%`, background: sc.barColor }}
          />
        </div>
        {/* Late-in marker */}
        {isLate && (
          <div className="att-tl-late-marker" style={{ left: `${lateMarkerPos}%` }} />
        )}
      </div>

      {/* Time labels row */}
      <div className="att-tl-time-labels">
        <span className="att-tl-time" style={{ left: `${inPos}%` }}>
          {fmt12(checkIn)}
          {isLate && <span className="att-tl-late-tag">Late In</span>}
        </span>
        <span className="att-tl-time att-tl-time-right" style={{ right: `${100 - outPos}%` }}>
          {fmt12(checkOut)}
        </span>
      </div>
    </div>
  );
}

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.Present;
  return (
    <span className="att-badge" style={{ background: sc.bg, color: sc.dot }}>
      <span className="att-badge-dot" style={{ background: sc.dot }} />
      {status}
    </span>
  );
}

function ShiftBadge({ label }: { label: string }) {
  if (!label) return null;
  return (
    <span className="att-badge att-badge-muted">
      <span className="att-badge-dot" style={{ background: '#94a3b8' }} />
      {label}
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

  /* ── Summary stats (matching screenshot categories) ── */
  const summary = useMemo(() => {
    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const halfDay = filteredRecords.filter(r => r.status === 'Half Day').length;
    const onLeave = filteredRecords.filter(r => r.status === 'On Leave').length;

    // Late-ins: total late minutes (when checkIn > SHIFT_START)
    let lateMinutes = 0;
    filteredRecords.forEach(r => {
      if (r.checkIn && r.checkIn > SHIFT_START) {
        lateMinutes += minutesBetween(SHIFT_START, r.checkIn);
      }
    });

    // Early-outs: total early minutes (when checkOut < SHIFT_END)
    let earlyMinutes = 0;
    filteredRecords.forEach(r => {
      if (r.checkOut && r.checkOut < SHIFT_END && r.status !== 'Half Day') {
        earlyMinutes += minutesBetween(r.checkOut, SHIFT_END);
      }
    });

    // Weekend days in range
    const weekendDays = dateRange.filter(d => {
      const day = new Date(d + 'T00:00:00').getDay();
      return day === 0 || day === 6;
    }).length;

    return { present, absent, halfDay, onLeave, lateMinutes, earlyMinutes, weekendDays };
  }, [filteredRecords, dateRange]);

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
      return `${p.dayNum} ${p.month} ${p.fullYear}`;
    }
    if (viewMode === 'weekly') {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 6);
      const s = parseDate(dateToStr(weekStart));
      const e = parseDate(dateToStr(end));
      return `${s.dayNum} ${s.month} ${s.fullYear} - ${e.dayNum} ${e.month} ${e.fullYear}`;
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

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">Attendance Records</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            <Users size={15} /> Bulk Mark
          </button>
          <button className="btn btn-primary" style={{ background: '#16a34a' }} onClick={() => {
            setFormData(f => ({ ...f, date: selectedDate }));
            setShowSingleModal(true);
          }}>
            <Plus size={15} /> Add Attendance
          </button>
        </div>
      </div>

      {/* ── Employee Selector ── */}
      <div style={{ marginBottom: 16 }}>
        <select
          className="form-input"
          style={{ maxWidth: 280, fontSize: 14 }}
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
      </div>

      {/* ── Controls Row: Weekly/Monthly + Date Nav ── */}
      <div className="att-controls-row">
        <div className="att-controls-left">
          {/* Weekly / Monthly tabs */}
          {isEmployeeView && (
            <div className="att-view-tabs">
              {(['weekly', 'monthly'] as const).map(mode => (
                <button
                  key={mode}
                  className={`att-view-tab ${viewMode === mode ? 'active' : ''}`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          )}

          {/* Date range nav */}
          <div className="att-date-nav">
            <CalendarDays size={15} className="att-date-nav-icon" />
            <span className="att-date-nav-label">{dateRangeLabel}</span>
            <button className="att-date-nav-btn" onClick={navPrev}>
              <ChevronLeft size={16} />
            </button>
            <button className="att-date-nav-btn" onClick={navNext}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Stats (matching screenshot layout) ── */}
      <div className="att-summary">
        {/* Primary stat */}
        <div className="att-summary-primary">
          <span className="att-summary-primary-num">{String(summary.present).padStart(2, '0')}</span>
          <span className="att-summary-primary-label">Total Present Days</span>
        </div>

        {/* Paired stats with dashed separators */}
        <div className="att-summary-pairs">
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">Early - Outs</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{fmtMinToHrs(summary.earlyMinutes)}</span>
            <span className="att-summary-pair-unit">Hrs.</span>
          </div>
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">Late - Ins</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{fmtMinToHrs(summary.lateMinutes)}</span>
            <span className="att-summary-pair-unit">Hrs.</span>
          </div>
        </div>

        <div className="att-summary-pairs">
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">On Leave</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{String(summary.onLeave).padStart(2, '0')}</span>
            <span className="att-summary-pair-unit">Days</span>
          </div>
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">Absent</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{String(summary.absent).padStart(2, '0')}</span>
            <span className="att-summary-pair-unit">Days</span>
          </div>
        </div>

        <div className="att-summary-pairs">
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">Half Days</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{String(summary.halfDay).padStart(2, '0')}</span>
            <span className="att-summary-pair-unit">Days</span>
          </div>
          <div className="att-summary-pair">
            <span className="att-summary-pair-label">Weekends</span>
            <span className="att-summary-pair-dash" />
            <span className="att-summary-pair-value">{summary.weekendDays}</span>
            <span className="att-summary-pair-unit">Days</span>
          </div>
        </div>
      </div>

      {/* ── Attendance Cards ── */}
      <div className="att-day-cards">
        {isEmployeeView ? (
          /* ── Employee View: one card per day ── */
          dateRange.map(dateStr => {
            const record = filteredRecords.find(r => r.date === dateStr);
            const { dayName, dayNum, month, isWeekend } = parseDate(dateStr);

            return (
              <div
                key={dateStr}
                className={`att-day-card ${!record && isWeekend ? 'att-day-card--muted' : ''}`}
              >
                {/* Left: Day & Date */}
                <div className="att-day-card-left">
                  <span className={`att-day-card-dayname ${isWeekend ? 'weekend' : ''}`}>
                    {dayName}
                  </span>
                  <span className="att-day-card-date">{dayNum} {month}</span>
                </div>

                {/* Right: Content */}
                <div className="att-day-card-content">
                  {record ? (
                    <>
                      {/* Header row: badges + worked hours */}
                      <div className="att-day-card-header">
                        <div className="att-day-card-badges">
                          <StatusBadge status={record.status} />
                          <ShiftBadge label={getShiftLabel(record.checkIn)} />
                        </div>
                        <div className="att-day-card-worked">
                          Worked <strong>{record.workingHours}</strong> Hrs.
                        </div>
                      </div>

                      {/* Timeline */}
                      <TimelineBar
                        checkIn={record.checkIn}
                        checkOut={record.checkOut}
                        status={record.status}
                      />
                    </>
                  ) : (
                    <div className="att-day-card-empty">
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
                No records for this date. Use &quot;Bulk Mark&quot; or &quot;Add Attendance&quot; to get started.
              </div>
            </div>
          ) : (
            filteredRecords.map(record => {
              const sc = STATUS_COLORS[record.status] || STATUS_COLORS.Present;
              return (
                <div key={record.id} className="att-day-card">
                  {/* Left: Employee avatar */}
                  <div className="att-day-card-left">
                    <div className="att-day-card-avatar" style={{ background: sc.bg, color: sc.dot }}>
                      {getEmpInitials(record.employeeId)}
                    </div>
                  </div>

                  {/* Right: Content */}
                  <div className="att-day-card-content">
                    <div className="att-day-card-header">
                      <div className="att-day-card-badges">
                        <span className="att-day-card-empname">{getEmpName(record.employeeId)}</span>
                        <span className="att-day-card-empid">{getEmpCode(record.employeeId)}</span>
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="att-day-card-worked">
                        Worked <strong>{record.workingHours}</strong> Hrs.
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
              <button className="att-modal-close" onClick={() => setShowBulkModal(false)}><X size={20} /></button>
            </div>
            <p className="att-modal-date">Date: <strong>{selectedDate}</strong></p>
            <p className="att-modal-hint">
              {unmarkedCount} employee{unmarkedCount !== 1 ? 's' : ''} without records will be marked.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={() => handleBulkMark('Present')}>Mark All Present</button>
              <button className="btn btn-danger" onClick={() => handleBulkMark('Absent')}>Mark All Absent</button>
              <button className="btn btn-secondary" onClick={() => handleBulkMark('Half Day')}>Mark All Half Day</button>
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
              <button className="att-modal-close" onClick={() => setShowSingleModal(false)}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-input" value={formData.employeeId} onChange={e => setFormData(f => ({ ...f, employeeId: e.target.value }))}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input className="form-input" type="time" value={formData.checkIn} onChange={e => setFormData(f => ({ ...f, checkIn: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input className="form-input" type="time" value={formData.checkOut} onChange={e => setFormData(f => ({ ...f, checkOut: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as AttendanceRecord['status'] }))}>
                <option>Present</option>
                <option>Absent</option>
                <option>Half Day</option>
                <option>On Leave</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSingleModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSingleSubmit}>Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
