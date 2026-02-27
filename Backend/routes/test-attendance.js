// Test attendance endpoint for manual entry
router.post('/test-attendance', async (req, res) => {
    try {
        const { employeeId, verifyMode = 'Fingerprint' } = req.body;
        
        if (!employeeId) {
            return res.status(400).json({ success: false, error: 'Employee ID required' });
        }

        const attendanceRecord = {
            id: `${employeeId}_${Date.now()}`,
            employeeId: employeeId,
            verifyMode: verifyMode,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            date: new Date().toISOString().split('T')[0],
            deviceId: '1',
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: ATTENDANCE_TABLE,
            Item: attendanceRecord
        }));

        console.log(`✅ Test attendance saved: ${employeeId}`);
        res.json({ 
            success: true, 
            message: 'Test attendance recorded',
            data: attendanceRecord
        });

    } catch (error) {
        console.error('Test attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});