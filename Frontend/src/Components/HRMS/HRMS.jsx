import React, { useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './HRMS.css';

const HRMS = () => {
    const { currentUser } = useContext(AuthContext);

    useEffect(() => {
        if (currentUser && currentUser.userId) {
            const hrmsUrl = `http://localhost:5175?recruiterId=${currentUser.userId}`;
            window.location.href = hrmsUrl;
        } else {
            console.error('User not found. Please login first.');
        }
    }, [currentUser]);

    return (
        <div className="hrms-redirect-container">
            <div className="hrms-redirect-content">
                <div className="hrms-loader">
                    <div className="hrms-spinner"></div>
                </div>
                <h2>Redirecting to STAFFINN HRMS</h2>
                <p>Please wait while we redirect you to the Human Resource Management System...</p>
                <p className="hrms-integration-note">Preparing your personalized HRMS workspace...</p>
            </div>
        </div>
    );
};

export default HRMS;