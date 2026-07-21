import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FiExternalLink, FiUserPlus, FiUsers, FiKey, FiInfo, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import './HRMS.css';

const HRMS = () => {
    const { currentUser } = useContext(AuthContext);
    const hrmsUrl = currentUser?.userId ? `https://hrms.staffinn.com?recruiterId=${currentUser.userId}` : '#';
    const employeePortalUrl = 'https://employee.staffinn.com';

    return (
        <div className="hrms-info-container">
            <div className="hrms-info-card">
                {/* Header */}
                <div className="hrms-info-header">
                    <h2>Staffinn HRMS</h2>
                    <p>Human Resource Management System</p>
                </div>

                {/* HRMS Link */}
                <div className="hrms-link-section">
                    <div className="hrms-link-box">
                        <FiExternalLink className="hrms-link-icon" />
                        <div>
                            <p className="hrms-link-label">Your HRMS Admin Panel (Live)</p>
                            <a href={hrmsUrl} target="_blank" rel="noopener noreferrer" className="hrms-link-url">
                                hrms.staffinn.com <FiArrowRight size={12} style={{marginLeft: '4px'}} />
                            </a>
                        </div>
                    </div>
                    <a href={hrmsUrl} target="_blank" rel="noopener noreferrer" className="hrms-open-btn">
                        <FiExternalLink size={14} /> Open HRMS
                    </a>
                </div>

                {/* Instructions */}
                <div className="hrms-instructions">
                    <h3><FiInfo size={16} style={{marginRight: '8px', verticalAlign: 'middle'}} /> How it works</h3>
                    <div className="hrms-steps">
                        <div className="hrms-step">
                            <div className="hrms-step-num">1</div>
                            <div className="hrms-step-content">
                                <strong>One-time Sign Up</strong>
                                <p>You can sign up only once on HRMS. After registration, use the same credentials to login every time.</p>
                            </div>
                        </div>
                        <div className="hrms-step">
                            <div className="hrms-step-num">2</div>
                            <div className="hrms-step-content">
                                <strong>HR Admin Access</strong>
                                <p>From HRMS you get full HR Admin access — manage attendance, leaves, payroll, tasks, grievances, and more.</p>
                            </div>
                        </div>
                        <div className="hrms-step">
                            <div className="hrms-step-num">3</div>
                            <div className="hrms-step-content">
                                <strong>Onboard Employees</strong>
                                <p>Add your employees through the Onboarding section. Fill their details and they'll be added to your organization.</p>
                            </div>
                        </div>
                        <div className="hrms-step">
                            <div className="hrms-step-num">4</div>
                            <div className="hrms-step-content">
                                <strong>Employee Credentials</strong>
                                <p>After onboarding, you'll find employee login credentials in the employee list. Share these with your employees so they can access their own portal.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Portal Link */}
                <div className="hrms-employee-portal">
                    <FiUsers size={18} className="hrms-ep-icon" />
                    <div className="hrms-ep-info">
                        <strong>Employee Portal</strong>
                        <p>Share this link with your employees for their self-service portal:</p>
                        <a href={employeePortalUrl} target="_blank" rel="noopener noreferrer" className="hrms-ep-link">
                            employee.staffinn.com <FiExternalLink size={11} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRMS;
