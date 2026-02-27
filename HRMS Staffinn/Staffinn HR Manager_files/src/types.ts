export  interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'hr' | 'manager' | 'employee'
  password?: string
  companyId?: string
  companyName?: string
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive'
  createdAt: string
  createdBy: string
}

export interface Attendance {
  id: string
  employeeId: string
  date: string
  checkIn: string
  checkOut: string
  hours: number
  status: 'present' | 'absent' | 'late'
  createdAt: string
}

export interface Leave {
  id: string
  employeeId: string
  type: string
  startDate: string
  endDate: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  createdAt: string
}

export interface Candidate {
  id: string
  name: string
  email: string
  position: string
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  resume?: string
  createdAt: string
  interviewDate?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  assignedTo: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdAt: string
  createdBy: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  resetPassword: (email: string) => Promise<boolean>
  isLoading: boolean
}
 