'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, X } from 'lucide-react';
import { getAttendanceRecords, addAttendanceRecord, updateAttendanceRecord, getEmployees } from '@/lib/store';
import type { AttendanceRecord, Employee } from '@/types';

export default function AttendanceManager() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '', date: '', checkIn: '10:00', checkOut: '18:00', status: 'Present' as AttendanceRecord['status'],
  });

  useEffect(() => {
    setRecords(getAttendanceRecords());
    setEmployees(getEmployees().filter(e => e.status === 'Active'));
  }, []);

  const dateRecords = records.filter(r => r.date === selectedDate);

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const getEmployeeId = (id: string) => {
    return employees.find(e => e.id === id)?.employeeId || '';
  };

  const calcHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const [h1, m1] = checkIn.split(':').map(Number);
    const [h2, m2] = checkOut.split(':').map(Number);
    return Math.round(((h2 * 60 + m2) - (h1 * 60 + m1)) / 60 * 10) / 10;
  };

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
    const unmarked = employees.filter(e => !existing.includes(e.id));
    unmarked.forEach(emp => {
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

  const statusColors: Record<string, string> = {
    Present: 'badge-success',
    Absent: 'badge-danger',
    'Half Day': 'badge-warning',
    'On Leave': 'badge-info',
  };

  const summary = {
    present: dateRecords.filter(r => r.status === 'Present').length,
    absent: dateRecords.filter(r => r.status === 'Absent').length,
    halfDay: dateRecords.filter(r => r.status === 'Half Day').length,
    onLeave: dateRecords.filter(r => r.status === 'On Leave').length,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Attendance Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
            Bulk Mark
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormData({ ...formData, date: selectedDate });
            setShowSingleModal(true);
          }}>
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Calendar size={18} />
            <input
              className="form-input"
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ maxWidth: 200 }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div style={{ textAlign: 'center', padding: 12, background: '#dcfce7', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>{summary.present}</div>
              <div style={{ fontSize: 12, color: '#166534' }}>Present</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#fecaca', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#991b1b' }}>{summary.absent}</div>
              <div style={{ fontSize: 12, color: '#991b1b' }}>Absent</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#fef3c7', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#92400e' }}>{summary.halfDay}</div>
              <div style={{ fontSize: 12, color: '#92400e' }}>Half Day</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: '#dbeafe', borderRadius: 8 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1e40af' }}>{summary.onLeave}</div>
              <div style={{ fontSize: 12, color: '#1e40af' }}>On Leave</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Employee Name</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dateRecords.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No attendance records for {selectedDate}. Use &quot;Bulk Mark&quot; or &quot;Add Record&quot; to get started.
              </td></tr>
            ) : (
              dateRecords.map(rec => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: 600 }}>{getEmployeeId(rec.employeeId)}</td>
                  <td>{getEmployeeName(rec.employeeId)}</td>
                  <td>{rec.checkIn || '-'}</td>
                  <td>{rec.checkOut || '-'}</td>
                  <td>{rec.workingHours}h</td>
                  <td><span className={`badge ${statusColors[rec.status]}`}>{rec.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Bulk Mark Attendance - {selectedDate}</h2>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              Mark all employees without a record for this date. {employees.length - dateRecords.length} employees remaining.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={() => handleBulkMark('Present')}>Mark All Present</button>
              <button className="btn btn-danger" onClick={() => handleBulkMark('Absent')}>Mark All Absent</button>
              <button className="btn btn-secondary" onClick={() => handleBulkMark('Half Day')}>Mark All Half Day</button>
            </div>
          </div>
        </div>
      )}

      {showSingleModal && (
        <div className="modal-overlay" onClick={() => setShowSingleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Add Attendance Record</h2>
              <button onClick={() => setShowSingleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select className="form-input" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Check In</label>
                <input className="form-input" type="time" value={formData.checkIn} onChange={e => setFormData({ ...formData, checkIn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Check Out</label>
                <input className="form-input" type="time" value={formData.checkOut} onChange={e => setFormData({ ...formData, checkOut: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                <option>Present</option>
                <option>Absent</option>
                <option>Half Day</option>
                <option>On Leave</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowSingleModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSingleSubmit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
