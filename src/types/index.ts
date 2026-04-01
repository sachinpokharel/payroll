export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married';
  pan: string;
  bankName: string;
  bankAccountNumber: string;
  address: string;
  status: 'Active' | 'Inactive';
  salaryStructureId?: string;
}

export interface SalaryStructure {
  id: string;
  name: string;
  basicSalaryPercent: number;
  components: SalaryComponent[];
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: 'earning' | 'deduction';
  calculationType: 'percentage' | 'fixed';
  value: number;
  basedOn?: 'basic' | 'gross';
  isStatutory: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  daysPerYear: number;
  carryForward: boolean;
  maxCarryForwardDays: number;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
  workingHours: number;
}

export interface PayrollConfig {
  fiscalYear: string;
  ssfEmployerPercent: number;
  ssfEmployeePercent: number;
  citPercent: number;
  pfEmployerPercent: number;
  pfEmployeePercent: number;
  dashainAllowanceMonths: number;
  taxSlabs: TaxSlab[];
  insuranceDeduction: number;
}

export interface TaxSlab {
  id: string;
  label: string;
  fromAmount: number;
  toAmount: number;
  ratePercent: number;
  forMarried: boolean;
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'Draft' | 'Processed' | 'Finalized';
  processedDate: string;
  payslips: Payslip[];
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  employeeId: string;
  basicSalary: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  tax: number;
  ssf: number;
  pf: number;
  cit: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
}

export interface PayslipLine {
  name: string;
  amount: number;
}

export type PageName = 'dashboard' | 'employees' | 'leave-types' | 'leave-applications' | 'attendance' | 'payroll-config' | 'salary-structures' | 'payroll-run' | 'reports';
