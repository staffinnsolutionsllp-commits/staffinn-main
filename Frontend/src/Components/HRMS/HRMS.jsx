import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FiExternalLink, FiUsers, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import './HRMS.css';

const HRMS = () => {
    const { currentUser } = useContext(AuthContext);
    const hrmsUrl = currentUser?.userId ? `https://hrms.staffinn.com?recruiterId=${currentUser.userId}` : '#';
    const employeePortalUrl = 'https://employee.staffinn.com';

    return (
        <div className="hrms-page">
            {/* Hero Section with Logo */}
            <div className="hrms-hero">
                <div className="hrms-hero-content">
                    <img src="/HRMS NEW LOGO.jpeg" alt="Staffinn HRMS" className="hrms-logo" />
                    <div className="hrms-hero-text">
                        <h1>Staffinn HRMS</h1>
                        <p>Complete Human Resource Management System for your organization</p>
                    </div>
                </div>
                <a href={hrmsUrl} target="_blank" rel="noopener noreferrer" className="hrms-cta-btn">
                    Open HRMS <FiExternalLink size={14} />
                </a>
            </div>

            {/* Live Link Card */}
            <div className="hrms-link-card">
                <div className="hrms-link-left">
                    <div className="hrms-live-dot"></div>
                    <div>
                        <span className="hrms-link-label">Your HRMS Admin Panel</span>
                        <a href={hrmsUrl} target="_blank" rel="noopener noreferrer" className="hrms-link-url">
                            hrms.staffinn.com <FiArrowRight size={12} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Steps Section */}
            <div className="hrms-steps-section">
                <h2 className="hrms-steps-title">How it works</h2>
                <div className="hrms-steps-grid">
                    <div className="hrms-step-card">
                        <div className="hrms-step-number">1</div>
                        <h3>One-time Sign Up</h3>
                        <p>You can sign up only once on HRMS. After registration, use the same credentials to login every time.</p>
                    </div>
                    <div className="hrms-step-card">
                        <div className="hrms-step-number">2</div>
                        <h3>HR Admin Access</h3>
                        <p>Full HR Admin access — manage attendance, leaves, payroll, tasks, grievances, and more.</p>
                    </div>
                    <div className="hrms-step-card">
                        <div className="hrms-step-number">3</div>
                        <h3>Onboard Employees</h3>
                        <p>Add your employees through the Onboarding section. Fill their details and they'll be added to your organization.</p>
                    </div>
                    <div className="hrms-step-card">
                        <div className="hrms-step-number">4</div>
                        <h3>Employee Credentials</h3>
                        <p>After onboarding, find employee login credentials in the employee list. Share these with your employees.</p>
                    </div>
                </div>
            </div>

            {/* Employee Portal Section */}
            <div className="hrms-emp-portal">
                <div className="hrms-emp-portal-left">
                    <FiUsers size={24} className="hrms-emp-icon" />
                    <div>
                        <h3>Employee Portal</h3>
                        <p>Share this link with your employees for their self-service portal</p>
                    </div>
                </div>
                <a href={employeePortalUrl} target="_blank" rel="noopener noreferrer" className="hrms-emp-link">
                    employee.staffinn.com <FiExternalLink size={12} />
                </a>
            </div>

            {/* Features List */}
            <div className="hrms-features">
                <h3>What you can manage</h3>
                <div className="hrms-features-grid">
                    {['Attendance & Biometric', 'Leave Management', 'Payroll & Salary', 'Task Assignment', 'Employee Onboarding', 'Grievances & Warnings', 'Performance Reviews', 'Organization Chart'].map(feature => (
                        <div key={feature} className="hrms-feature-item">
                            <FiCheckCircle className="hrms-feature-check" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HRMS;
