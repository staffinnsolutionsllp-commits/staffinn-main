import React, { useState, useEffect } from 'react';
import './StaffinnPartner.css';
import TrainingCenterDetails from './TrainingCenterDetails';
import TrainingInfrastructure from './TrainingInfrastructure';
import CourseDetail from './CourseDetail';
import FacultyList from './FacultyList';
import StudentManagement from './StudentManagement';
import CreateBatch from './CreateBatch';
import AppliedBatch from './AppliedBatch';
import ApprovedBatches from './ApprovedBatches';
import RejectedBatches from './RejectedBatches';
import ClosedBatches from './ClosedBatches';
import Attendance from './Attendance';
import Report from './Report';
import PhysicalProgressReport from './PhysicalProgressReport';
import AssessedBatchesReport from './AssessedBatchesReport';
import PlacementSection from './Placement/PlacementSection';
import StaffinnPartnerDashboard from './StaffinnPartnerDashboard';
import CourseEnrollment from './CourseEnrollment';
import CourseEnrollmentHistory from './CourseEnrollmentHistory';

const StaffinnPartner = ({ 
    misStatus, 
    agreementFile, 
    uploadLoading, 
    activePartnerTab, 
    setActivePartnerTab, 
    setAgreementFile, 
    setUploadLoading, 
    apiService, 
    loadMisStatus,
    agreementLoaded,
    onStatusChange // Add callback for status changes
}) => {
    // Load existing agreement data when component mounts
    useEffect(() => {
        const loadExistingAgreement = async () => {
            // Always try to load agreement file on component mount, regardless of agreementLoaded state
            try {
                console.log('📄 Loading existing MIS agreement on component mount...');
                const response = await apiService.getMisStatus();
                if (response.success && response.data && response.data.agreementFile) {
                    const agreementData = response.data.agreementFile;
                    const existingFile = {
                        name: agreementData.fileName,
                        size: agreementData.fileSize || 0,
                        type: 'application/pdf',
                        url: agreementData.fileUrl,
                        isExisting: true
                    };
                    setAgreementFile(existingFile);
                    console.log('✅ Loaded existing agreement on mount:', existingFile.name);
                } else {
                    console.log('ℹ️ No existing agreement found on mount');
                    setAgreementFile(null);
                }
            } catch (error) {
                console.error('❌ Error loading existing agreement on mount:', error);
                setAgreementFile(null);
            }
        };
        
        loadExistingAgreement();
    }, [apiService, setAgreementFile]); // Removed agreementLoaded dependency
    // Before MIS approval - show instructions and agreement upload
    console.log('🔍 Checking MIS approval status:', {
        misStatus,
        isApproved: misStatus === 'approved',
        willShowPreApproval: misStatus !== 'approved'
    });
    
    if (misStatus !== 'approved') {
        console.log('📋 Showing pre-approval content for status:', misStatus);
        return (
            <div className="institute-partner-tab">
                <div className="institute-tab-header">
                    <h1>Staffinn Partner</h1>
                    <p>Complete the MIS approval process to access partner features</p>
                </div>
                
                <div className="institute-partner-pre-approval">
                    <div className="institute-partner-instructions">
                        <h2>Instructions</h2>
                        <div className="instructions-content">
                            <p>To become a verified Staffinn Partner and access exclusive features, please follow these steps:</p>
                            <ol>
                                <li>Download and review the Staffinn Partner Agreement below</li>
                                <li>Print and sign the agreement</li>
                                <li>Scan the signed agreement as a PDF file</li>
                                <li>Upload the signed PDF using the upload section below</li>
                                <li>Wait for admin approval (you will be notified via email)</li>
                            </ol>
                            <p><strong>Note:</strong> Once approved, you will have access to advanced partner features including MIS requests, talent acquisition tools, and exclusive training programs.</p>
                        </div>
                    </div>
                    
                    <div className="institute-partner-agreement">
                        <h2>Staffinn Partner Agreement</h2>
                        <div className="agreement-section">
                            <div className="agreement-preview">
                                <iframe 
                                    src="/staffinn-partner-agreement.pdf" 
                                    width="100%" 
                                    height="400px"
                                    title="Staffinn Partner Agreement"
                                >
                                    <p>Your browser does not support PDFs. <a href="/staffinn-partner-agreement.pdf" target="_blank" rel="noopener noreferrer">Download the PDF</a></p>
                                </iframe>
                            </div>
                            <div className="agreement-actions">
                                <a 
                                    href="/staffinn-partner-agreement.pdf" 
                                    download="Staffinn-Partner-Agreement.pdf"
                                    className="institute-primary-button"
                                >
                                    Download Agreement
                                </a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="institute-partner-upload">
                        <h2>Upload Signed Agreement</h2>
                        <div className="upload-section">
                            <div className="file-input-group">
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            if (file.type !== 'application/pdf') {
                                                alert('Please select a valid PDF file.');
                                                e.target.value = ''; // Clear invalid file
                                                return;
                                            }
                                            if (file.size > 10 * 1024 * 1024) {
                                                alert('PDF size should be less than 10MB.');
                                                e.target.value = ''; // Clear oversized file
                                                return;
                                            }
                                            setAgreementFile(file);
                                        }
                                    }}
                                    className="file-input"
                                    id="agreement-upload"
                                />
                                <label htmlFor="agreement-upload" className="file-input-label">
                                    {agreementFile ? agreementFile.name : 'Choose PDF File'}
                                </label>
                            </div>
                            {agreementFile && (
                                <div className="file-info">
                                    <p>
                                        {agreementFile.isExisting ? 'Uploaded: ' : 'Selected: '}
                                        {agreementFile.name} 
                                        {agreementFile.size > 0 && ` (${(agreementFile.size / 1024 / 1024).toFixed(2)} MB)`}
                                    </p>
                                    {agreementFile.isExisting && agreementFile.url && (
                                        <a 
                                            href={agreementFile.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                marginLeft: '10px',
                                                padding: '4px 8px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            View PDF
                                        </a>
                                    )}
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setAgreementFile(null);
                                            // Clear the file input
                                            const fileInput = document.getElementById('agreement-upload');
                                            if (fileInput) fileInput.value = '';
                                        }}
                                        className="remove-file-btn"
                                        style={{
                                            marginLeft: '10px',
                                            padding: '4px 8px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {agreementFile.isExisting ? 'Replace' : 'Remove'}
                                    </button>
                                </div>
                            )}
                            <button 
                                className="institute-primary-button"
                                onClick={async () => {
                                    if (!agreementFile) {
                                        alert('Please select a PDF file to upload.');
                                        return;
                                    }
                                    
                                    // If it's an existing file, don't upload again
                                    if (agreementFile.isExisting) {
                                        alert('This agreement has already been uploaded. Select a new file to replace it.');
                                        return;
                                    }
                                    
                                    try {
                                        setUploadLoading(true);
                                        console.log('📤 Uploading MIS agreement...');
                                        const response = await apiService.uploadMisAgreement(agreementFile);
                                        
                                        if (response.success) {
                                            alert('MIS agreement uploaded successfully! Your request has been sent for admin approval.');
                                            // Update the file to mark it as existing
                                            const updatedFile = {
                                                ...agreementFile,
                                                isExisting: true,
                                                url: response.data?.fileUrl || null
                                            };
                                            setAgreementFile(updatedFile);
                                            // Trigger status refresh
                                            if (loadMisStatus) loadMisStatus();
                                            console.log('📝 MIS agreement uploaded, status remains pending until admin approval');
                                        } else {
                                            alert(response.message || 'Failed to upload agreement');
                                        }
                                    } catch (error) {
                                        console.error('Error uploading agreement:', error);
                                        alert('Failed to upload agreement. Please try again.');
                                    } finally {
                                        setUploadLoading(false);
                                    }
                                }}
                                disabled={!agreementFile || uploadLoading || agreementFile.isExisting}
                            >
                                {uploadLoading ? 'Uploading...' : agreementFile?.isExisting ? 'Already Uploaded' : 'Upload Signed Agreement'}
                            </button>
                        </div>
                        
                        {misStatus === 'pending' && (
                            <div className="status-message pending">
                                <p>📋 Your MIS request is pending admin approval. You will be notified once it's processed.</p>
                                <div style={{marginTop: '10px', fontSize: '0.9rem', color: '#666'}}>
                                    <p>📡 Status updates automatically in real-time via WebSocket connection</p>
                                    <button 
                                        onClick={async () => {
                                            console.log('🔄 Manual refresh triggered');
                                            await loadMisStatus();
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        🔄 Refresh Status Now
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {misStatus === 'rejected' && (
                            <div className="status-message rejected">
                                <p>❌ Your MIS request was rejected. Please contact support for more information.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    // After MIS approval - show full partner menu
    console.log('🎉 Showing approved partner content for status:', misStatus);
    return (
        <div className="institute-partner-tab">
            <div className="institute-partner-content">
                {activePartnerTab === 'dashboard' && (
                    <StaffinnPartnerDashboard />
                )}
                
                {activePartnerTab === 'infrastructure' && (
                    <div className="partner-infrastructure">
                        <h2>🏢 Infrastructure Management</h2>
                        <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
                            <p>Manage and configure your institute's infrastructure details including:</p>
                            <ul style={{marginTop: '15px'}}>
                                <li>Building and facility information</li>
                                <li>Classroom and lab capacity</li>
                                <li>Equipment and technology resources</li>
                                <li>Safety and compliance details</li>
                            </ul>
                            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '6px'}}>
                                <strong>Coming Soon:</strong> Infrastructure management tools will be available in the next update.
                            </div>
                        </div>
                    </div>
                )}
                
                {activePartnerTab === 'training-center' && <TrainingCenterDetails />}
                
                {activePartnerTab === 'training-infrastructure' && <TrainingInfrastructure />}
                
                {activePartnerTab === 'course-detail' && <CourseDetail />}
                
                {activePartnerTab === 'faculty-list' && <FacultyList />}
                
                {activePartnerTab === 'student-management' && <StudentManagement />}
                
                {activePartnerTab === 'batches' && (
                    <div className="partner-batches">
                        <h2>📋 Batch Overview</h2>
                        <div style={{backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px'}}>
                            <p>View and manage all your training batches:</p>
                            <ul style={{marginTop: '15px'}}>
                                <li>Active training batches</li>
                                <li>Batch performance metrics</li>
                                <li>Student enrollment statistics</li>
                                <li>Completion and success rates</li>
                            </ul>
                            <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '6px'}}>
                                <strong>Coming Soon:</strong> Batch management dashboard will be available in the next update.
                            </div>
                        </div>
                    </div>
                )}
                
                {activePartnerTab === 'create-batch' && <CreateBatch />}
                
                {activePartnerTab === 'applied-batch' && <AppliedBatch />}
                
                {activePartnerTab === 'approved-batches' && <ApprovedBatches />}
                
                {activePartnerTab === 'rejected-batches' && <RejectedBatches />}
                
                {activePartnerTab === 'closed-batches' && <ClosedBatches />}
                
                {activePartnerTab === 'attendance' && <Attendance />}
                
                {activePartnerTab === 'report' && <Report />}
                
                {activePartnerTab === 'physical-progress-report' && <PhysicalProgressReport />}
                
                {activePartnerTab === 'assessed-batches-report' && <AssessedBatchesReport />}
                
                {activePartnerTab === 'placement' && (
                    <PlacementSection />
                )}
            </div>
        </div>
    );
};

export default StaffinnPartner;