import  { Users, Clock, CreditCard, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import { database } from '../store/database'
import { apiService } from '../services/api'
import { useState, useEffect } from 'react'
import { useAttendance } from '../contexts/AttendanceContext'

export default function Dashboard() {
  const { stats: attendanceStats, refreshStats } = useAttendance()
  const [stats, setStats] = useState({ ...database.getStats(), totalEmployees: 0 })
  const [recentActivities, setRecentActivities] = useState<string[]>([])

  useEffect(() => {
    const updateStats = async () => {
      try {
        // Get real-time candidate count from API
        const candidateStatsResponse = await apiService.getCandidateStats()
        console.log('Dashboard: Candidate stats response:', candidateStatsResponse)
        
        if (candidateStatsResponse.success) {
          const candidateCount = candidateStatsResponse.data.total || 0
          const localStats = database.getStats()
          const newStats = {
            ...localStats,
            totalEmployees: candidateCount,
            // Use real-time attendance data
            presentToday: attendanceStats.presentToday,
            lateArrivals: attendanceStats.lateArrivals,
            avgHours: parseFloat(attendanceStats.avgHours)
          }
          setStats(newStats)
        } else {
          console.error('API call failed:', candidateStatsResponse)
          const localStats = database.getStats()
          setStats({ 
            ...localStats, 
            totalEmployees: 0,
            presentToday: attendanceStats.presentToday,
            lateArrivals: attendanceStats.lateArrivals,
            avgHours: parseFloat(attendanceStats.avgHours)
          })
        }
        
        // Generate recent activities based on current stats
        const currentStats = {
          ...stats,
          presentToday: attendanceStats.presentToday,
          lateArrivals: attendanceStats.lateArrivals,
          avgHours: parseFloat(attendanceStats.avgHours)
        }
        const activities = [
          `${attendanceStats.totalEmployees} total candidates in system`,
          `${attendanceStats.presentToday} employees marked present today`,
          `${currentStats.pendingLeaves} leave requests pending approval`,
          `${currentStats.activeCandidates} candidates in recruitment pipeline`,
          `Total payroll: ₹${(currentStats.totalPayroll / 100000).toFixed(1)}L monthly`,
          `${attendanceStats.lateArrivals} late arrivals today`
        ]
        setRecentActivities(activities)

      } catch (error) {
        console.error('Error updating stats:', error)
        // Fallback: set totalEmployees to 0 if API fails
        const localStats = database.getStats()
        setStats({ 
          ...localStats, 
          totalEmployees: 0,
          presentToday: attendanceStats.presentToday,
          lateArrivals: attendanceStats.lateArrivals,
          avgHours: parseFloat(attendanceStats.avgHours)
        })
      }
    }
    
    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds for real-time
    return () => clearInterval(interval)
  }, [attendanceStats]) // Re-run when attendance stats change

  const statCards = [
    { 
      label: 'Total Candidates', 
      value: attendanceStats.totalEmployees.toString(), 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Present Today', 
      value: `${attendanceStats.presentToday}/${attendanceStats.totalEmployees}`, 
      icon: CheckCircle, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Total Payroll', 
      value: `₹${(stats.totalPayroll / 100000).toFixed(1)}L`, 
      icon: CreditCard, 
      color: 'bg-purple-500' 
    },
    { 
      label: 'Pending Tasks', 
      value: stats.pendingTasks.toString(), 
      icon: TrendingUp, 
      color: 'bg-orange-500' 
    },
  ]

  const quickStats = [
    { label: 'Late Arrivals', value: attendanceStats.lateArrivals, color: 'text-orange-600' },
    { label: 'Avg Hours', value: `${attendanceStats.avgHours}h`, color: 'text-blue-600' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, color: 'text-yellow-600' },
    { label: 'Active Candidates', value: stats.activeCandidates, color: 'text-green-600' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Real-time Activities</h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">{activity}</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {quickStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Today's Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Clock className="mx-auto mb-2 text-green-600" size={32} />
            <p className="text-2xl font-bold text-green-600">{attendanceStats.presentToday}</p>
            <p className="text-sm text-green-700">Employees Present</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Calendar className="mx-auto mb-2 text-orange-600" size={32} />
            <p className="text-2xl font-bold text-orange-600">{attendanceStats.lateArrivals}</p>
            <p className="text-sm text-orange-700">Late Arrivals</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="mx-auto mb-2 text-blue-600" size={32} />
            <p className="text-2xl font-bold text-blue-600">{attendanceStats.avgHours}h</p>
            <p className="text-sm text-blue-700">Average Hours</p>
          </div>
        </div>
      </div>
    </div>
  )
}
 