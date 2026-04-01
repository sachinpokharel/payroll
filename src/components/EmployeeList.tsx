'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, getSalaryStructures } from '@/lib/store';
import type { Employee, SalaryStructure } from '@/types';

const emptyEmployee: Omit<Employee, 'id'> = {
  employeeId: '', firstName: '', lastName: '', email: '', phone: '',
  department: '', designation: '', dateOfJoining: '', dateOfBirth: '',
  gender: 'Male', maritalStatus: 'Single', pan: '', bankName: '',
  bankAccountNumber: '', address: '', status: 'Active', salaryStructureId: '',
};

const departments = ['Engineering', 'Finance', 'HR', 'Marketing', 'Operations', 'Sales', 'Administration', 'IT'];

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState(emptyEmployee);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setEmployees(getEmployees());
    setStructures(getSalaryStructures());
  }, []);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeId} ${e.department}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.employeeId) return;
    if (editingEmployee) {
      const updated = { ...editingEmployee, ...formData };
      updateEmployee(updated);
      setEmployees(getEmployees());
    } else {
      addEmployee(formData);
      setEmployees(getEmployees());
    }
    setShowModal(false);
    setEditingEmployee(null);
    setFormData(emptyEmployee);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData(emp);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
      setEmployees(getEmployees());
    }
  };

  const openNew = () => {
    setEditingEmployee(null);
    setFormData({ ...emptyEmployee, employeeId: `EMP-${String(employees.length + 1).padStart(4, '0')}` });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, maxWidth: 400 }}
          />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>PAN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No employees found. Click &quot;Add Employee&quot; to get started.
                </td>
              </tr>
            ) : (
              filtered.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.employeeId}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>
                    <span className={`badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>{emp.pan}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)}>
                        <Edit2 size={12} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Employee ID *</label>
                <input className="form-input" value={formData.employeeId}
                  onChange={e => setFormData({ ...formData, employeeId: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" value={formData.lastName}
                  onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-input" value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" value={formData.designation}
                  onChange={e => setFormData({ ...formData, designation: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Joining</label>
                <input className="form-input" type="date" value={formData.dateOfJoining}
                  onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value as any })}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marital Status</label>
                <select className="form-input" value={formData.maritalStatus}
                  onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}>
                  <option>Single</option>
                  <option>Married</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">PAN Number</label>
                <input className="form-input" value={formData.pan}
                  onChange={e => setFormData({ ...formData, pan: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Salary Structure</label>
                <select className="form-input" value={formData.salaryStructureId}
                  onChange={e => setFormData({ ...formData, salaryStructureId: e.target.value })}>
                  <option value="">Select Structure</option>
                  {structures.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input className="form-input" value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Account Number</label>
                <input className="form-input" value={formData.bankAccountNumber}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingEmployee ? 'Update Employee' : 'Add Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
