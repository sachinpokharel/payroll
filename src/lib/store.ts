'use client';

import { v4 as uuidv4 } from 'uuid';
import type {
  Employee, SalaryStructure, SalaryComponent, LeaveType, LeaveApplication,
  AttendanceRecord, PayrollConfig, TaxSlab, PayrollRun, Payslip, PayslipLine
} from '@/types';

const STORAGE_KEYS = {
  EMPLOYEES: 'np_employees',
  SALARY_STRUCTURES: 'np_salary_structures',
  LEAVE_TYPES: 'np_leave_types',
  LEAVE_APPLICATIONS: 'np_leave_applications',
  ATTENDANCE: 'np_attendance',
  PAYROLL_CONFIG: 'np_payroll_config',
  PAYROLL_RUNS: 'np_payroll_runs',
};

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Default Nepal tax slabs for FY 2081/82
const defaultTaxSlabs: TaxSlab[] = [
  { id: uuidv4(), label: 'First NPR 5,00,000', fromAmount: 0, toAmount: 500000, ratePercent: 1, forMarried: false },
  { id: uuidv4(), label: 'Next NPR 2,00,000', fromAmount: 500000, toAmount: 700000, ratePercent: 10, forMarried: false },
  { id: uuidv4(), label: 'Next NPR 3,00,000', fromAmount: 700000, toAmount: 1000000, ratePercent: 20, forMarried: false },
  { id: uuidv4(), label: 'Next NPR 10,00,000', fromAmount: 1000000, toAmount: 2000000, ratePercent: 30, forMarried: false },
  { id: uuidv4(), label: 'Above NPR 20,00,000', fromAmount: 2000000, toAmount: Infinity, ratePercent: 36, forMarried: false },
  { id: uuidv4(), label: 'First NPR 6,00,000', fromAmount: 0, toAmount: 600000, ratePercent: 1, forMarried: true },
  { id: uuidv4(), label: 'Next NPR 2,00,000', fromAmount: 600000, toAmount: 800000, ratePercent: 10, forMarried: true },
  { id: uuidv4(), label: 'Next NPR 3,00,000', fromAmount: 800000, toAmount: 1100000, ratePercent: 20, forMarried: true },
  { id: uuidv4(), label: 'Next NPR 10,00,000', fromAmount: 1100000, toAmount: 2100000, ratePercent: 30, forMarried: true },
  { id: uuidv4(), label: 'Above NPR 21,00,000', fromAmount: 2100000, toAmount: Infinity, ratePercent: 36, forMarried: true },
];

const defaultPayrollConfig: PayrollConfig = {
  fiscalYear: '2081/82',
  ssfEmployerPercent: 20,
  ssfEmployeePercent: 11,
  citPercent: 0,
  pfEmployerPercent: 10,
  pfEmployeePercent: 10,
  dashainAllowanceMonths: 1,
  taxSlabs: defaultTaxSlabs,
  insuranceDeduction: 0,
};

const defaultLeaveTypes: LeaveType[] = [
  { id: uuidv4(), name: 'Annual Leave (Bidhako Bida)', daysPerYear: 18, carryForward: true, maxCarryForwardDays: 30 },
  { id: uuidv4(), name: 'Sick Leave (Birami Bida)', daysPerYear: 12, carryForward: false, maxCarryForwardDays: 0 },
  { id: uuidv4(), name: 'Mourning Leave (Kriyaputri Bida)', daysPerYear: 13, carryForward: false, maxCarryForwardDays: 0 },
  { id: uuidv4(), name: 'Maternity Leave (Prasuti Bida)', daysPerYear: 98, carryForward: false, maxCarryForwardDays: 0 },
  { id: uuidv4(), name: 'Paternity Leave (Pitritwa Bida)', daysPerYear: 15, carryForward: false, maxCarryForwardDays: 0 },
  { id: uuidv4(), name: 'Public Holiday (Sarbajanik Bida)', daysPerYear: 13, carryForward: false, maxCarryForwardDays: 0 },
  { id: uuidv4(), name: 'Substitute Leave (Badla Bida)', daysPerYear: 0, carryForward: false, maxCarryForwardDays: 0 },
];

const defaultSalaryStructure: SalaryStructure = {
  id: uuidv4(),
  name: 'Standard Nepal Structure',
  basicSalaryPercent: 60,
  components: [
    { id: uuidv4(), name: 'Dearness Allowance', type: 'earning', calculationType: 'percentage', value: 10, basedOn: 'basic', isStatutory: false },
    { id: uuidv4(), name: 'House Rent Allowance', type: 'earning', calculationType: 'percentage', value: 15, basedOn: 'basic', isStatutory: false },
    { id: uuidv4(), name: 'Medical Allowance', type: 'earning', calculationType: 'fixed', value: 1500, isStatutory: false },
    { id: uuidv4(), name: 'Transport Allowance', type: 'earning', calculationType: 'fixed', value: 2000, isStatutory: false },
    { id: uuidv4(), name: 'SSF Employee (11%)', type: 'deduction', calculationType: 'percentage', value: 11, basedOn: 'basic', isStatutory: true },
    { id: uuidv4(), name: 'Provident Fund (10%)', type: 'deduction', calculationType: 'percentage', value: 10, basedOn: 'basic', isStatutory: true },
  ],
};

// ---- EMPLOYEES ----
export function getEmployees(): Employee[] {
  return getItem<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
}
export function saveEmployees(employees: Employee[]): void {
  setItem(STORAGE_KEYS.EMPLOYEES, employees);
}
export function addEmployee(emp: Omit<Employee, 'id'>): Employee {
  const employees = getEmployees();
  const newEmp: Employee = { ...emp, id: uuidv4() };
  employees.push(newEmp);
  saveEmployees(employees);
  return newEmp;
}
export function updateEmployee(emp: Employee): void {
  const employees = getEmployees().map(e => e.id === emp.id ? emp : e);
  saveEmployees(employees);
}
export function deleteEmployee(id: string): void {
  saveEmployees(getEmployees().filter(e => e.id !== id));
}

// ---- SALARY STRUCTURES ----
export function getSalaryStructures(): SalaryStructure[] {
  return getItem<SalaryStructure[]>(STORAGE_KEYS.SALARY_STRUCTURES, [defaultSalaryStructure]);
}
export function saveSalaryStructures(structures: SalaryStructure[]): void {
  setItem(STORAGE_KEYS.SALARY_STRUCTURES, structures);
}
export function addSalaryStructure(s: Omit<SalaryStructure, 'id'>): SalaryStructure {
  const structures = getSalaryStructures();
  const newS: SalaryStructure = { ...s, id: uuidv4() };
  structures.push(newS);
  saveSalaryStructures(structures);
  return newS;
}
export function updateSalaryStructure(s: SalaryStructure): void {
  saveSalaryStructures(getSalaryStructures().map(x => x.id === s.id ? s : x));
}
export function deleteSalaryStructure(id: string): void {
  saveSalaryStructures(getSalaryStructures().filter(x => x.id !== id));
}

// ---- LEAVE TYPES ----
export function getLeaveTypes(): LeaveType[] {
  return getItem<LeaveType[]>(STORAGE_KEYS.LEAVE_TYPES, defaultLeaveTypes);
}
export function saveLeaveTypes(types: LeaveType[]): void {
  setItem(STORAGE_KEYS.LEAVE_TYPES, types);
}

// ---- LEAVE APPLICATIONS ----
export function getLeaveApplications(): LeaveApplication[] {
  return getItem<LeaveApplication[]>(STORAGE_KEYS.LEAVE_APPLICATIONS, []);
}
export function saveLeaveApplications(apps: LeaveApplication[]): void {
  setItem(STORAGE_KEYS.LEAVE_APPLICATIONS, apps);
}
export function addLeaveApplication(app: Omit<LeaveApplication, 'id'>): LeaveApplication {
  const apps = getLeaveApplications();
  const newApp: LeaveApplication = { ...app, id: uuidv4() };
  apps.push(newApp);
  saveLeaveApplications(apps);
  return newApp;
}
export function updateLeaveApplication(app: LeaveApplication): void {
  saveLeaveApplications(getLeaveApplications().map(a => a.id === app.id ? app : a));
}

// ---- ATTENDANCE ----
export function getAttendanceRecords(): AttendanceRecord[] {
  return getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
}
export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  setItem(STORAGE_KEYS.ATTENDANCE, records);
}
export function addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
  const records = getAttendanceRecords();
  const newRec: AttendanceRecord = { ...record, id: uuidv4() };
  records.push(newRec);
  saveAttendanceRecords(records);
  return newRec;
}
export function updateAttendanceRecord(record: AttendanceRecord): void {
  saveAttendanceRecords(getAttendanceRecords().map(r => r.id === record.id ? record : r));
}

// ---- PAYROLL CONFIG ----
export function getPayrollConfig(): PayrollConfig {
  return getItem<PayrollConfig>(STORAGE_KEYS.PAYROLL_CONFIG, defaultPayrollConfig);
}
export function savePayrollConfig(config: PayrollConfig): void {
  setItem(STORAGE_KEYS.PAYROLL_CONFIG, config);
}

// ---- PAYROLL RUNS ----
export function getPayrollRuns(): PayrollRun[] {
  return getItem<PayrollRun[]>(STORAGE_KEYS.PAYROLL_RUNS, []);
}
export function savePayrollRuns(runs: PayrollRun[]): void {
  setItem(STORAGE_KEYS.PAYROLL_RUNS, runs);
}

// ---- PAYROLL CALCULATION ENGINE ----
export function calculateTax(annualIncome: number, isMarried: boolean, config: PayrollConfig): number {
  const slabs = config.taxSlabs.filter(s => s.forMarried === isMarried);
  let tax = 0;
  let remaining = annualIncome;

  for (const slab of slabs) {
    const slabRange = slab.toAmount === Infinity ? remaining : slab.toAmount - slab.fromAmount;
    const taxable = Math.min(remaining, slabRange);
    if (taxable <= 0) break;
    tax += taxable * (slab.ratePercent / 100);
    remaining -= taxable;
  }
  return Math.round(tax);
}

export function processPayroll(month: string, year: number): PayrollRun {
  const employees = getEmployees().filter(e => e.status === 'Active');
  const config = getPayrollConfig();
  const structures = getSalaryStructures();
  const attendance = getAttendanceRecords();
  const leaveApps = getLeaveApplications().filter(a => a.status === 'Approved');

  const payslips: Payslip[] = employees.map(emp => {
    const structure = structures.find(s => s.id === emp.salaryStructureId) || structures[0];
    if (!structure) {
      return createEmptyPayslip(emp.id, '');
    }

    // Get month attendance
    const monthAttendance = attendance.filter(
      a => a.employeeId === emp.id && a.date.startsWith(`${year}-${month.padStart(2, '0')}`)
    );
    const workingDays = 26;
    const presentDays = monthAttendance.filter(a => a.status === 'Present').length || workingDays;
    const leaveDays = monthAttendance.filter(a => a.status === 'On Leave').length;
    const absentDays = monthAttendance.filter(a => a.status === 'Absent').length;
    const halfDays = monthAttendance.filter(a => a.status === 'Half Day').length;
    const effectiveDays = presentDays + leaveDays + (halfDays * 0.5);
    const attendanceRatio = Math.min(effectiveDays / workingDays, 1);

    // Calculate gross from structure
    // We need a base salary - let's derive from structure or use a default
    const grossSalary = 50000; // This will be overridden per employee setup
    const basicSalary = Math.round(grossSalary * (structure.basicSalaryPercent / 100));

    const earnings: PayslipLine[] = [{ name: 'Basic Salary', amount: Math.round(basicSalary * attendanceRatio) }];
    const deductions: PayslipLine[] = [];

    let totalEarnings = earnings[0].amount;
    let totalDeductions = 0;

    for (const comp of structure.components) {
      let amount = 0;
      if (comp.calculationType === 'percentage') {
        const base = comp.basedOn === 'basic' ? basicSalary : totalEarnings;
        amount = Math.round(base * (comp.value / 100));
      } else {
        amount = comp.value;
      }
      amount = Math.round(amount * attendanceRatio);

      if (comp.type === 'earning') {
        earnings.push({ name: comp.name, amount });
        totalEarnings += amount;
      } else {
        deductions.push({ name: comp.name, amount });
        totalDeductions += amount;
      }
    }

    // Calculate SSF
    const ssfEmployee = Math.round(basicSalary * (config.ssfEmployeePercent / 100));

    // Calculate annual income for tax
    const annualIncome = totalEarnings * 12;
    const annualSSF = ssfEmployee * 12;
    const taxableIncome = annualIncome - annualSSF;
    const annualTax = calculateTax(Math.max(taxableIncome, 0), emp.maritalStatus === 'Married', config);
    const monthlyTax = Math.round(annualTax / 12);

    deductions.push({ name: 'Income Tax (TDS)', amount: monthlyTax });
    totalDeductions += monthlyTax;

    const netPay = totalEarnings - totalDeductions;

    return {
      id: uuidv4(),
      payrollRunId: '',
      employeeId: emp.id,
      basicSalary,
      grossEarnings: totalEarnings,
      totalDeductions,
      netPay,
      earnings,
      deductions,
      tax: monthlyTax,
      ssf: ssfEmployee,
      pf: Math.round(basicSalary * (config.pfEmployeePercent / 100)),
      cit: 0,
      workingDays,
      presentDays: Math.round(effectiveDays),
      leaveDays,
      absentDays,
    };
  });

  const run: PayrollRun = {
    id: uuidv4(),
    month,
    year,
    status: 'Draft',
    processedDate: new Date().toISOString().split('T')[0],
    payslips: payslips.map(p => ({ ...p, payrollRunId: '' })),
  };

  // Set payrollRunId on all payslips
  run.payslips = run.payslips.map(p => ({ ...p, payrollRunId: run.id }));

  const runs = getPayrollRuns();
  runs.push(run);
  savePayrollRuns(runs);

  return run;
}

function createEmptyPayslip(employeeId: string, payrollRunId: string): Payslip {
  return {
    id: uuidv4(), payrollRunId, employeeId,
    basicSalary: 0, grossEarnings: 0, totalDeductions: 0, netPay: 0,
    earnings: [], deductions: [], tax: 0, ssf: 0, pf: 0, cit: 0,
    workingDays: 0, presentDays: 0, leaveDays: 0, absentDays: 0,
  };
}

// ---- FORMATTING HELPERS ----
export function formatNPR(amount: number): string {
  return `NPR ${amount.toLocaleString('en-NP')}`;
}
