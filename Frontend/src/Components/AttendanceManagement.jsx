import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BridgeAuth from './BridgeAuth';
import './AttendanceManagement.css';

const AttendanceManagement = () => {
    const [activeTab, setActiveTab] = useState('auth');
    const [attendanceData, setAttendanceData] = useState([]);
    const [deviceStatus, setDeviceStatus] = useState(null);
    const [syncStats, setSyncStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoSync, setAutoSync] = useState(false);

    // Real-time status updates
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeTab === 'dashboard') {
                checkDeviceStatus();
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [activeTab]);

    const checkDeviceStatus = async () => {
        try {
            const response = await axios.get('/api/attendance/bridge-status');
            setDeviceStatus(response.data);
        } catch (error) {
            console.error('Status check failed:', error);
            setDeviceStatus({ error: 'Bridge service unavailable' });
        }
    };

    const syncAttendance = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/api/attendance/sync');
            setSyncStats(response.data);
            fetchAttendanceData();
            
            // Show success notification
            if (response.data.saved > 0) {
                alert(`✅ Successfully synced ${response.data.saved} new attendance records!`);
            } else {
                alert('ℹ️ No new attendance records to sync');
            }
        } catch (error) {
            alert('❌ Sync failed: ' + (error.response?.data?.error || error.message));
        }
        setLoading(false);
    };

    const fetchAttendanceData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`/api/attendance/records?date=${today}`);
            setAttendanceData(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch attendance data:', error);
        }
    };

    const connectDevice = async () => {
        try {
            const response = await axios.post('/api/attendance/connect');
            if (response.data.success) {
                alert('✅ Device connected successfully!');
                checkDeviceStatus();
            } else {
                alert('❌ Connection failed: ' + response.data.error);
            }
        } catch (error) {
            alert('❌ Connection error: ' + (error.response?.data?.error || error.message));
        }
    };

    // Auto-sync functionality
    useEffect(() => {
        let interval;
        if (autoSync && deviceStatus?.connected) {
            interval = setInterval(() => {
                syncAttendance();
            }, 30000); // Auto-sync every 30 seconds
        }
        return () => clearInterval(interval);
    }, [autoSync, deviceStatus?.connected]);

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getVerifyModeIcon = (mode) => {
        switch (mode?.toLowerCase()) {
            case 'fingerprint': return '👆';
            case 'face': return '👤';
            case 'card': return '💳';
            case 'password': return '🔢';
            default: return '❓';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        📊 StaffInn Attendance Management
                    </h1>
                    <p className="text-gray-600">
                        Biometric device integration with real-time attendance tracking
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('auth')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'auth'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            🔐 Authentication
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'dashboard'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📈 Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('records')}
                            className={`px-6 py-3 font-medium ${
                                activeTab === 'records'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📋 Records
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'auth' && (
                        <div className="flex justify-center">
                            <BridgeAuth />
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Device Status Card */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-semibold mb-4">🔌 Device Status</h3>
                                {deviceStatus ? (
                                    <div className="space-y-3">
                                        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                                            deviceStatus.connected ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                            <span className={`w-3 h-3 rounded-full ${
                                                deviceStatus.connected ? 'bg-green-500' : 'bg-red-500'
                                            }`}></span>
                                            <span className="font-medium">
                                                {deviceStatus.connected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Device IP</p>
                                                <p className="font-medium">{deviceStatus.deviceIP}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Port</p>
                                                <p className="font-medium">{deviceStatus.devicePort}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Device ID</p>
                                                <p className="font-medium">{deviceStatus.deviceId}</p>
                                            </div>
                                            {deviceStatus.serialNumber && (
                                                <div>
                                                    <p className="text-gray-500">Serial</p>
                                                    <p className="font-medium">{deviceStatus.serialNumber}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Loading device status...</p>
                                )}
                                
                                <div className="mt-4 space-y-2">
                                    <button
                                        onClick={connectDevice}
                                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                                    >
                                        🔌 Connect Device
                                    </button>
                                    <button
                                        onClick={checkDeviceStatus}
                                        className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                                    >
                                        🔄 Refresh Status
                                    </button>
                                </div>
                            </div>

                            {/* Sync Controls Card */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-xl font-semibold mb-4">⚡ Sync Controls</h3>
                                
                                {syncStats && (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-blue-800">
                                            Last sync: {syncStats.saved} saved / {syncStats.total} total
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        onClick={syncAttendance}
                                        disabled={loading}
                                        className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
                                    >
                                        {loading ? '⏳ Syncing...' : '🔄 Sync Now'}
                                    </button>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="autoSync"
                                            checked={autoSync}
                                            onChange={(e) => setAutoSync(e.target.checked)}
                                            className="rounded"
                                        />
                                        <label htmlFor="autoSync" className="text-sm">
                                            Auto-sync every 30 seconds
                                        </label>
                                    </div>

                                    <button
                                        onClick={fetchAttendanceData}
                                        className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600"
                                    >
                                        📋 Refresh Records
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">📋 Today's Attendance Records</h3>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    {attendanceData.length} records
                                </span>
                            </div>

                            {attendanceData.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Employee
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Verify Mode
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Device
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {attendanceData.map((record, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.employeeId}
                                                        </div>
                                                        {record.employeeName && (
                                                            <div className="text-sm text-gray-500">
                                                                {record.employeeName}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatTime(record.timestamp)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {getVerifyModeIcon(record.verifyMode)} {record.verifyMode}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        Device {record.deviceId}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No attendance records found for today</p>
                                    <button
                                        onClick={fetchAttendanceData}
                                        className="mt-2 text-blue-500 hover:text-blue-700"
                                    >
                                        🔄 Refresh
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceManagement;