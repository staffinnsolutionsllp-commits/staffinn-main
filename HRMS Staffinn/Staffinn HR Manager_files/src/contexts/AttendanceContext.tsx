import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiService } from '../services/api'
import { useAuth } from './AuthContext'

interface AttendanceStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateArrivals: number
  attendanceRate: string
  avgHours: string
}

interface AttendanceContextType {
  stats: AttendanceStats
  refreshStats: () => Promise<void>
  isLoading: boolean
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined)

export const useAttendance = () => {
  const context = useContext(AttendanceContext)
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider')
  }
  return context
}

interface AttendanceProviderProps {
  children: ReactNode
}

export const AttendanceProvider = ({ children }: AttendanceProviderProps) => {
  const { user } = useAuth()
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    attendanceRate: '0',
    avgHours: '0.0'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])

  const refreshStats = async (date = null) => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    const targetDate = date || currentDate
    
    try {
      const statsResponse = await apiService.getAttendanceStats(targetDate)
      
      if (statsResponse.success) {
        setStats(statsResponse.data)
        setCurrentDate(targetDate)
      } else {
        console.error('Failed to get attendance stats:', statsResponse)
      }
    } catch (error) {
      console.error('Error refreshing attendance stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshStats()
      // Only auto-refresh for today's date
      const today = new Date().toISOString().split('T')[0]
      if (currentDate === today) {
        const interval = setInterval(() => refreshStats(), 30000)
        return () => clearInterval(interval)
      }
    } else {
      setIsLoading(false)
    }
  }, [user, currentDate])

  const value: AttendanceContextType = {
    stats,
    refreshStats,
    isLoading
  }

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}