import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { apiService } from '../services/api'
import { useAuth } from './AuthContext'

const WS_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.staffinn.com'
  : 'http://localhost:4001';

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
  refreshStats: (date?: string | null) => Promise<void>
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
  const socketRef = useRef<any>(null)

  const refreshStats = async (date: string | null = null) => {
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

  // WebSocket connection for real-time attendance updates from Bridge
  useEffect(() => {
    if (!user?.recruiterId) return

    let socket: any = null

    const connectSocket = async () => {
      try {
        const { io } = await import('socket.io-client')
        socket = io(WS_URL, { transports: ['websocket', 'polling'] })
        socketRef.current = socket

        socket.on('connect', () => {
          console.log('🔌 WebSocket connected')
          socket.emit('join-recruiter-room', user.recruiterId)
        })

        socket.on('attendance-update', () => {
          console.log('📡 Real-time attendance update received — refreshing')
          const today = new Date().toISOString().split('T')[0]
          refreshStats(today)
        })

        socket.on('disconnect', () => {
          console.log('🔌 WebSocket disconnected')
        })
      } catch (err) {
        console.warn('WebSocket unavailable, falling back to polling:', err)
      }
    }

    connectSocket()

    return () => {
      if (socket) socket.disconnect()
    }
  }, [user?.recruiterId])

  useEffect(() => {
    if (user) {
      refreshStats()
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