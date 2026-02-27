import  { User, Employee, Attendance, Leave, Candidate, Task } from '../types'
import { hashPassword } from '../utils/auth'

class Database {
  private users: User[] = []
  private employees: Employee[] = []
  private attendance: Attendance[] = []
  private leaves: Leave[] = []
  private candidates: Candidate[] = []
  private tasks: Task[] = []
  private resetTokens: Map<string, string> = new Map()

  constructor() {
    this.loadFromStorage()
    this.initializeAdmin()
  }

  private saveToStorage() {
    localStorage.setItem('hrms_users', JSON.stringify(this.users))
    localStorage.setItem('hrms_employees', JSON.stringify(this.employees))
    localStorage.setItem('hrms_attendance', JSON.stringify(this.attendance))
    localStorage.setItem('hrms_leaves', JSON.stringify(this.leaves))
    localStorage.setItem('hrms_candidates', JSON.stringify(this.candidates))
    localStorage.setItem('hrms_tasks', JSON.stringify(this.tasks))
  }

  private loadFromStorage() {
    this.users = JSON.parse(localStorage.getItem('hrms_users') || '[]')
    this.employees = JSON.parse(localStorage.getItem('hrms_employees') || '[]')
    this.attendance = JSON.parse(localStorage.getItem('hrms_attendance') || '[]')
    this.leaves = JSON.parse(localStorage.getItem('hrms_leaves') || '[]')
    this.candidates = JSON.parse(localStorage.getItem('hrms_candidates') || '[]')
    this.tasks = JSON.parse(localStorage.getItem('hrms_tasks') || '[]')
  }

  private async initializeAdmin() {
    if (this.users.length === 0) {
      const hashedPassword = await hashPassword('Admin@123')
      const adminUser: User = {
        id: '1',
        name: 'System Admin',
        email: 'admin@staffinn.com',
        role: 'admin',
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }
      this.users.push(adminUser)
      this.saveToStorage()
    }
  }

  // User methods
  async createUser(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await hashPassword(password)
    const user: User = {
      id: Date.now().toString(),
      name,
      email,
      role: 'hr',
      password: hashedPassword,
      createdAt: new Date().toISOString()
    }
    this.users.push(user)
    this.saveToStorage()
    return user
  }

  getUserByEmail(email: string): User | null {
    return this.users.find(user => user.email === email) || null
  }

  getUserById(id: string): User | null {
    return this.users.find(user => user.id === id) || null
  }

  getAllUsers(): User[] {
    return this.users.map(user => ({ ...user, password: undefined }))
  }

  storeResetToken(email: string, token: string): void {
    this.resetTokens.set(email, token)
  }

  validateResetToken(email: string, token: string): boolean {
    return this.resetTokens.get(email) === token
  }

  async updatePassword(email: string, newPassword: string): Promise<boolean> {
    const user = this.getUserByEmail(email)
    if (!user) return false

    const hashedPassword = await hashPassword(newPassword)
    user.password = hashedPassword
    this.saveToStorage()
    this.resetTokens.delete(email)
    return true
  }

  // Employee methods
  createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Employee {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    this.employees.push(newEmployee)
    this.saveToStorage()
    return newEmployee
  }

  getEmployees(): Employee[] {
    return this.employees
  }

  getEmployeeById(id: string): Employee | null {
    return this.employees.find(emp => emp.id === id) || null
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const index = this.employees.findIndex(emp => emp.id === id)
    if (index === -1) return null

    this.employees[index] = { ...this.employees[index], ...updates }
    this.saveToStorage()
    return this.employees[index]
  }

  deleteEmployee(id: string): boolean {
    const index = this.employees.findIndex(emp => emp.id === id)
    if (index === -1) return false

    this.employees.splice(index, 1)
    this.saveToStorage()
    return true
  }

  bulkCreateEmployees(employees: Omit<Employee, 'id' | 'createdAt' | 'createdBy'>[], createdBy: string): Employee[] {
    const newEmployees = employees.map(emp => ({
      ...emp,
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      createdAt: new Date().toISOString(),
      createdBy
    }))
    this.employees.push(...newEmployees)
    this.saveToStorage()
    return newEmployees
  }

  // Attendance methods
  markAttendance(employeeId: string, checkIn: string, checkOut?: string): Attendance {
    const today = new Date().toISOString().split('T')[0]
    const existing = this.attendance.find(att => att.employeeId === employeeId && att.date === today)

    if (existing) {
      existing.checkOut = checkOut || existing.checkOut
      if (existing.checkOut && existing.checkIn) {
        const checkInTime = new Date(`${today} ${existing.checkIn}`)
        const checkOutTime = new Date(`${today} ${existing.checkOut}`)
        existing.hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)
      }
      this.saveToStorage()
      return existing
    }

    const newAttendance: Attendance = {
      id: Date.now().toString(),
      employeeId,
      date: today,
      checkIn,
      checkOut: checkOut || '',
      hours: 0,
      status: checkIn > '09:30' ? 'late' : 'present',
      createdAt: new Date().toISOString()
    }

    this.attendance.push(newAttendance)
    this.saveToStorage()
    return newAttendance
  }

  getAttendance(): Attendance[] {
    return this.attendance
  }

  getAttendanceByDate(date: string): Attendance[] {
    return this.attendance.filter(att => att.date === date)
  }

  getAttendanceByEmployee(employeeId: string): Attendance[] {
    return this.attendance.filter(att => att.employeeId === employeeId)
  }

  // Leave methods
  createLeave(leave: Omit<Leave, 'id' | 'createdAt'>): Leave {
    const newLeave: Leave = {
      ...leave,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    this.leaves.push(newLeave)
    this.saveToStorage()
    return newLeave
  }

  getLeaves(): Leave[] {
    return this.leaves
  }

  updateLeaveStatus(id: string, status: Leave['status']): Leave | null {
    const leave = this.leaves.find(l => l.id === id)
    if (!leave) return null

    leave.status = status
    this.saveToStorage()
    return leave
  }

  // Candidate methods
  createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt'>): Candidate {
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    this.candidates.push(newCandidate)
    this.saveToStorage()
    return newCandidate
  }

  getCandidates(): Candidate[] {
    return this.candidates
  }

  updateCandidateStatus(id: string, status: Candidate['status'], interviewDate?: string): Candidate | null {
    const candidate = this.candidates.find(c => c.id === id)
    if (!candidate) return null

    candidate.status = status
    if (interviewDate) candidate.interviewDate = interviewDate
    this.saveToStorage()
    return candidate
  }

  // Task methods
  createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    this.tasks.push(newTask)
    this.saveToStorage()
    return newTask
  }

  getTasks(): Task[] {
    return this.tasks
  }

  updateTaskStatus(id: string, status: Task['status']): Task | null {
    const task = this.tasks.find(t => t.id === id)
    if (!task) return null

    task.status = status
    this.saveToStorage()
    return task
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return null

    this.tasks[index] = { ...this.tasks[index], ...updates }
    this.saveToStorage()
    return this.tasks[index]
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    this.saveToStorage()
    return true
  }

  // Statistics
  getStats() {
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = this.attendance.filter(att => att.date === today)

    return {
      totalEmployees: 0, // Will be overridden by API call
      presentToday: todayAttendance.filter(att => att.status === 'present' || att.status === 'late').length,
      totalPayroll: this.employees.reduce((sum, emp) => sum + emp.salary, 0),
      pendingLeaves: this.leaves.filter(leave => leave.status === 'pending').length,
      activeCandidates: this.candidates.filter(c => ['applied', 'screening', 'interview'].includes(c.status)).length,
      pendingTasks: this.tasks.filter(task => task.status === 'pending').length,
      lateArrivals: todayAttendance.filter(att => att.status === 'late').length,
      avgHours: todayAttendance.length > 0 
        ? todayAttendance.reduce((sum, att) => sum + att.hours, 0) / todayAttendance.length 
        : 0
    }
  }
}

export const database = new Database()
 