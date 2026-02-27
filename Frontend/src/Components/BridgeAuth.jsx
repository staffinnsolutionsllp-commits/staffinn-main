import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BridgeAuth = () => {
    const [credentials, setCredentials] = useState({
        companyId: '',
        apiKey: ''
    });
    const [bridgeStatus, setBridgeStatus] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    const checkBridgeStatus = async () => {
        try {
            const response = await axios.get('/api/attendance/bridge-status');
            setBridgeStatus(response.data);
            setIsConnected(response.data.connected || false);
        } catch (error) {
            console.error('Bridge status check failed:', error);
            setBridgeStatus({ error: 'Bridge service not available' });
        }
    };

    const handleConnect = async () => {
        if (!credentials.companyId || !credentials.apiKey) {
            alert('Please enter both Company ID and API Key');
            return;
        }

        setLoading(true);
        try {
            // Store credentials (in production, send to backend for validation)
            localStorage.setItem('bridgeCredentials', JSON.stringify(credentials));
            
            // Connect to device
            const response = await axios.post('/api/attendance/connect');
            
            if (response.data.success) {
                setIsConnected(true);
                alert('✅ Bridge connected successfully!');
                checkBridgeStatus();
            } else {
                alert('❌ Connection failed: ' + response.data.error);
            }
        } catch (error) {
            alert('❌ Connection error: ' + error.response?.data?.error);
        }
        setLoading(false);
    };

    const handleDisconnect = async () => {
        try {
            await axios.get('/api/attendance/disconnect');
            setIsConnected(false);
            localStorage.removeItem('bridgeCredentials');
            alert('🔌 Disconnected from bridge');
            checkBridgeStatus();
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    };

    useEffect(() => {
        // Load saved credentials
        const saved = localStorage.getItem('bridgeCredentials');
        if (saved) {
            setCredentials(JSON.parse(saved));
        }
        checkBridgeStatus();
    }, []);

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🔐 Bridge Authentication</h2>
                <p className="text-gray-600 mt-2">Connect to StaffInn HRMS</p>
            </div>

            {/* Status Indicator */}
            <div className={`p-3 rounded-lg mb-4 text-center ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                <div className="flex items-center justify-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    <span className="font-medium">
                        {isConnected ? '✅ Connected' : '❌ Disconnected'}
                    </span>
                </div>
                {bridgeStatus?.deviceIP && (
                    <p className="text-sm mt-1">Device: {bridgeStatus.deviceIP}:{bridgeStatus.devicePort}</p>
                )}
            </div>

            {/* Authentication Form */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company ID
                    </label>
                    <input
                        type="text"
                        value={credentials.companyId}
                        onChange={(e) => setCredentials({...credentials, companyId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your company ID"
                        disabled={isConnected}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                    </label>
                    <input
                        type="password"
                        value={credentials.apiKey}
                        onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your API key"
                        disabled={isConnected}
                    />
                </div>

                <div className="flex space-x-2">
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={loading}
                            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 font-medium"
                        >
                            {loading ? '⏳ Connecting...' : '🔌 Connect'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDisconnect}
                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 font-medium"
                        >
                            🔌 Disconnect
                        </button>
                    )}
                    
                    <button
                        onClick={checkBridgeStatus}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Bridge Service Info */}
            {bridgeStatus && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Bridge Service Info</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                        {bridgeStatus.error ? (
                            <p className="text-red-600">❌ {bridgeStatus.error}</p>
                        ) : (
                            <>
                                <p>Device IP: {bridgeStatus.deviceIP}</p>
                                <p>Device Port: {bridgeStatus.devicePort}</p>
                                <p>Device ID: {bridgeStatus.deviceId}</p>
                                {bridgeStatus.serialNumber && (
                                    <p>Serial: {bridgeStatus.serialNumber}</p>
                                )}
                                {bridgeStatus.productCode && (
                                    <p>Product: {bridgeStatus.productCode}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BridgeAuth;