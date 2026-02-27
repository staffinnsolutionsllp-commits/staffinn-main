import  { Employee, Attendance, Leave, Candidate, Task, User } from './types'

class HRMSStore {
  private employees: Employee[] = []
  private attendance: Attendance[] = []
  private leaves: Leave[] = []
  private candidates: Candidate[] = []
  private tasks: Task[] = []
  private users: User[] = []
  private holidays: string[] = []

  constructor() {
    this.loadFromStorage()
    if (this.employees.length === 0) {
      this.initializeDefaultData()
    }
  }

  private saveToStorage() {
    localStorage.setItem('hrms_employees', JSON.stringify(this.employees))
    localStorage.setItem('hrms_attendance', JSON.stringify(this.attendance))
    localStorage.setItem('hrms_leaves', JSON.stringify(this.leaves))
    localStorage.setItem('hrms_candidates', JSON.stringify(this.candidates))
    localStorage.setItem('hrms_tasks', JSON.stringify(this.tasks))
    localStorage.setItem('hrms_users', JSON.stringify(this.users))
    localStorage.setItem('hrms_holidays', JSON.stringify(this.holidays))
  }

  private loadFromStorage() {
    this.employees = JSON.parse(localStorage.getItem('hrms_employees') || '[]')
    this.attendance = JSON.parse(localStorage.getItem('hrms_attendance') || '[]')
    this.leaves = JSON.parse(localStorage.getItem('hrms_leaves') || '[]')
    this.candidates = JSON.parse(localStorage.getItem('hrms_candidates') || '[]')
    this.tasks = JSON.parse(localStorage.getItem('hrms_tasks') || '[]')
    this.users = JSON.parse(localStorage.getItem('hrms_users') || '[]')
    this.holidays = JSON.parse(localStorage.getItem('hrms_holidays') || '[]')
  }

  private initializeDefaultData() {
    const today = new Date().toISOString().split('T')[0]
    
    this.users = [{
      id: '1',
      name: 'John Admin',
      role: 'admin',
      email: 'admin@staffinn.com'
    }]

    this.employees = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@staffinn.com',
        position: 'Software Engineer',
        department: 'Engineering',
        salary: 80000,
        joinDate: '2023-01-15',
        status: 'active'
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@staffinn.com',
        position: 'HR Manager',
        department: 'Human Resources',
        salary: 75000,
        joinDate: '2022-08-10',
        status: 'active'
      }
    ]

    this.attendance = [
      {
        id: '1',
        employeeId: '1',
        date: today,
        checkIn: '09:15',
        checkOut: '18:30',
        hours: 8.25,
        status: 'present'
      },
      {
        id: '2',
        employeeId: '2',
        date: today,
        checkIn: '09:00',
        checkOut: '18:00',
        hours: 8,
        status: 'present'
      }
    ]

    this.candidates = [
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        position: 'Frontend Developer',
        status: 'interview',
        resume: 'alice_resume.pdf'
      }
    ]

    this.tasks = [
      {
        id: '1',
        title: 'Complete Q4 Sales Report',
        assignedTo: '1',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2024-01-15'
      }
    ]

    this.holidays = ['2024-01-26', '2024-03-29', '2024-08-15', '2024-10-02', '2024-12-25']
    this.saveToStorage()
  }

  // Employee methods
  getEmployees(): Employee[] {
    return this.employees
  }

  addEmployee(employee: Omit<Employee, 'id'>): Employee {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString()
    }
    this.employees.push(newEmployee)
    this.saveToStorage()
    return newEmployee
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

  // Attendance methods
  getAttendance(): Attendance[] {
    return this.attendance
  }

  markAttendance(employeeId: string, checkIn: string, checkOut?: string): Attendance {
    const today = new Date().toISOString().split('T')[0]
    const existing = this.attendance.find(att => att.employeeId === employeeId && att.date === today)
    
    if (existing) {
      existing.checkOut = checkOut || existing.checkOut
      if (existing.checkOut) {
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
      status: 'present'
    }

    this.attendance.push(newAttendance)
    this.saveToStorage()
    return newAttendance
  }

  // Leave methods
  getLeaves(): Leave[] {
    return this.leaves
  }

  addLeave(leave: Omit<Leave, 'id'>): Leave {
    const newLeave: Leave = {
      ...leave,
      id: Date.now().toString()
    }
    this.leaves.push(newLeave)
    this.saveToStorage()
    return newLeave
  }

  updateLeaveStatus(id: string, status: Leave['status']): Leave | null {
    const leave = this.leaves.find(l => l.id === id)
    if (!leave) return null
    
    leave.status = status
    this.saveToStorage()
    return leave
  }

  // Candidate methods
  getCandidates(): Candidate[] {
    return this.candidates
  }

  addCandidate(candidate: Omit<Candidate, 'id'>): Candidate {
    const newCandidate: Candidate = {
      ...candidate,
      id: Date.now().toString()
    }
    this.candidates.push(newCandidate)
    this.saveToStorage()
    return newCandidate
  }

  updateCandidateStatus(id: string, status: Candidate['status']): Candidate | null {
    const candidate = this.candidates.find(c => c.id === id)
    if (!candidate) return null
    
    candidate.status = status
    this.saveToStorage()
    return candidate
  }

  // Task methods
  getTasks(): Task[] {
    return this.tasks
  }

  addTask(task: Omit<Task, 'id'>): Task {
    const newTask: Task = {
      ...task,
      id: Date.now().toString()
    }
    this.tasks.push(newTask)
    this.saveToStorage()
    return newTask
  }

  updateTaskStatus(id: string, status: Task['status']): Task | null {
    const task = this.tasks.find(t => t.id === id)
    if (!task) return null
    
    task.status = status
    this.saveToStorage()
    return task
  }

  // Utility methods
  getEmployeeById(id: string): Employee | null {
    return this.employees.find(emp => emp.id === id) || null
  }

  getStats() {
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = this.attendance.filter(att => att.date === today)
    
    return {
      totalEmployees: this.employees.length,
      presentToday: todayAttendance.filter(att => att.status === 'present').length,
      totalPayroll: this.employees.reduce((sum, emp) => sum + emp.salary, 0),
      pendingLeaves: this.leaves.filter(leave => leave.status === 'pending').length,
      activeCandidates: this.candidates.filter(c => ['applied', 'screening', 'interview'].includes(c.status)).length,
      pendingTasks: this.tasks.filter(task => task.status === 'pending').length
    }
  }
}

export const store = new HRMSStore()
 