# Nepal Payroll Management System

A comprehensive web-based payroll management system built specifically for Nepal, compliant with Nepal Labour Act 2074, Social Security Act 2074, and Income Tax Act regulations.

Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS 4**.

## Features

### Employee Management
- Full CRUD operations for employee records
- Fields: Employee ID, PAN, bank details, department, designation, marital status
- Salary structure assignment per employee
- Search and filter employees
- Active/Inactive status tracking

### Leave Management
- **Nepal Labour Act 2074 compliant leave types** pre-configured:
  - Annual Leave (Bidhako Bida) - 18 days
  - Sick Leave (Birami Bida) - 12 days
  - Mourning Leave (Kriyaputri Bida) - 13 days
  - Maternity Leave (Prasuti Bida) - 98 days
  - Paternity Leave (Pitritwa Bida) - 15 days
  - Public Holiday (Sarbajanik Bida) - 13 days
  - Substitute Leave (Badla Bida)
- Leave application workflow (Apply → Approve/Reject)
- Carry forward support with configurable limits
- Custom leave type creation

### Attendance Tracking
- Daily attendance recording with check-in/check-out times
- Bulk mark attendance for all employees
- Status types: Present, Absent, Half Day, On Leave
- Working hours calculation
- Daily summary dashboard (Present/Absent/Half Day/On Leave counts)

### Payroll Configuration
- **Nepal FY 2081/82 Income Tax Slabs** (pre-configured):
  - Separate slabs for Single and Married individuals
  - 1%, 10%, 20%, 30%, 36% progressive tax rates
- **Social Security Fund (SSF)**: 20% employer / 11% employee
- **Provident Fund (PF)**: 10% employer / 10% employee
- **Citizen Investment Trust (CIT)** deduction
- **Dashain Allowance**: Configurable (default 1 month basic salary)
- **Insurance** deduction support
- Fully editable tax slabs - add/remove/modify

### Salary Structures
- Create multiple salary structures
- Configurable basic salary percentage of gross
- Add earning components (allowances):
  - Dearness Allowance
  - House Rent Allowance (HRA)
  - Medical Allowance
  - Transport Allowance
  - Custom allowances
- Add deduction components:
  - SSF Employee Contribution
  - Provident Fund
  - Custom deductions
- Percentage-based or fixed amount calculations
- Statutory component flagging

### Payroll Processing
- Process payroll by **Nepali month** (Baishakh to Chaitra) and year (BS)
- Automatic calculation of:
  - Gross earnings based on salary structure
  - SSF, PF deductions
  - Income Tax (TDS) using configured tax slabs
  - Attendance-based pro-rata adjustments
- Individual payslip generation with earnings/deductions breakdown
- Payroll run history with Draft → Finalized workflow
- Summary view: Total Gross, Total Deductions, Net Payable

### Reports
- **Payroll Summary** - Monthly overview with gross, tax, SSF, PF, net pay
- **Employee Directory** - Complete employee listing with bank details
- **Tax Report (TDS)** - Monthly TDS deductions per employee, total payable to IRD
- **Attendance Summary** - Per-employee attendance stats and percentage
- **Department Cost Analysis** - Cost breakdown by department with visual bars

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm

### Installation

```bash
cd payroll
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
payroll/
├── src/
│   ├── app/
│   │   ├── globals.css          # Global styles and component classes
│   │   ├── layout.tsx           # Root layout with metadata
│   │   └── page.tsx             # Main page with client-side routing
│   ├── components/
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   ├── Dashboard.tsx        # Dashboard with stats and quick actions
│   │   ├── EmployeeList.tsx     # Employee CRUD management
│   │   ├── LeaveTypes.tsx       # Leave type configuration
│   │   ├── LeaveApplications.tsx # Leave application workflow
│   │   ├── AttendanceManager.tsx # Attendance tracking
│   │   ├── PayrollConfiguration.tsx # Tax slabs, SSF, PF, CIT config
│   │   ├── SalaryStructures.tsx # Salary structure builder
│   │   ├── PayrollProcessing.tsx # Payroll run and payslip generation
│   │   └── Reports.tsx          # Payroll, tax, attendance reports
│   ├── lib/
│   │   ├── store.ts             # localStorage data store and payroll engine
│   │   └── hooks.ts             # Custom React hooks
│   └── types/
│       └── index.ts             # TypeScript interfaces
├── package.json
├── tsconfig.json
├── next.config.mjs
└── postcss.config.mjs
```

## Nepal-Specific Compliance

| Component | Details |
|-----------|---------|
| Income Tax | FY 2081/82 slabs for single and married individuals |
| SSF | 20% employer + 11% employee (Social Security Act 2074) |
| Provident Fund | 10% employer + 10% employee |
| CIT | Citizen Investment Trust deduction support |
| Dashain Allowance | 1 month basic salary (configurable) |
| Leave Types | Nepal Labour Act 2074 compliant |
| Calendar | Nepali months (Baishakh - Chaitra) in Bikram Sambat |
| Currency | NPR (Nepalese Rupee) |

## Data Storage

Data is persisted in the browser's **localStorage** for standalone demo usage. No backend or database required. Data keys:

- `np_employees` - Employee records
- `np_salary_structures` - Salary structures
- `np_leave_types` - Leave type configuration
- `np_leave_applications` - Leave applications
- `np_attendance` - Attendance records
- `np_payroll_config` - Payroll configuration (tax slabs, SSF, PF rates)
- `np_payroll_runs` - Processed payroll runs with payslips

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Lucide React** - Icon library
- **UUID** - Unique ID generation
- **localStorage** - Client-side data persistence

## License

MIT
