import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import RecruiterInviteEnvelope from './RecruiterInviteEnvelope';

const RecruiterInvitesList = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecruiterInvites();
    }, []);

    const loadRecruiterInvites = async () => {
        try {
            setLoading(true);
            const response = await apiService.getInstituteRecruiterInvites();
            if (response.success && response.data) {
                setInvites(response.data);
            } else {
                setInvites([]);
            }
        } catch (error) {
            console.error('Error loading recruiter invites:', error);
            setInvites([]);
        } finally {
            setLoading(false);
        }
    };

    /* ── Page header — shown in all states ── */
    const PageHeader = () => (
        <div style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)',
            border: '1.5px solid #ddd6fe',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            maxWidth: '1200px',
            margin: '0 auto 28px',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                {/* Icon */}
                <div style={{
                    width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                }}>
                    📬
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{
                        margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 800,
                        color: '#1e1b4b', letterSpacing: '-0.01em',
                    }}>
                        Recruiter Invites
                    </h2>
                    <p style={{
                        margin: '0 0 16px', fontSize: '13.5px', color: '#4b5563', lineHeight: 1.6,
                    }}>
                        This section shows <strong>campus drive invitations sent directly to your institute by recruiters</strong>.
                        When a recruiter finds your institute on Staffinn and wants to conduct a campus placement drive,
                        they send a formal invite here — specifying the job roles, number of vacancies, preferred schedule,
                        selection process, and any additional requirements.
                    </p>

                    {/* How it works steps */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '10px',
                    }}>
                        {[
                            { step: '1', text: 'Recruiter sends you a campus drive invite' },
                            { step: '2', text: 'You review the invite details here' },
                            { step: '3', text: 'Accept & fill your response, or Decline' },
                            { step: '4', text: 'Recruiter sees your confirmation instantly' },
                        ].map(({ step, text }) => (
                            <div key={step} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: '10px', padding: '7px 13px',
                                fontSize: '12.5px', color: '#374151', fontWeight: 500,
                            }}>
                                <span style={{
                                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                                    color: '#fff', fontSize: '11px', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {step}
                                </span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ padding: '24px 20px' }}>
                <PageHeader />
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>Loading invites...</p>
                </div>
            </div>
        );
    }

    if (invites.length === 0) {
        return (
            <div style={{ padding: '24px 20px' }}>
                <PageHeader />
                <div style={{
                    textAlign: 'center', padding: '48px 20px', color: '#94a3b8',
                    background: '#fff', border: '1.5px dashed #e2e8f0',
                    borderRadius: '16px', maxWidth: '1200px', margin: '0 auto',
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <h3 style={{ margin: '0 0 8px', color: '#475569', fontWeight: 700 }}>
                        No Recruiter Invites Yet
                    </h3>
                    <p style={{ margin: 0, fontSize: '13.5px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                        When recruiters send your institute a campus drive invitation, it will appear here as an interactive card for you to review and respond to.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 20px' }}>
            <PageHeader />
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '20px',
                maxWidth: '1200px',
                margin: '0 auto',
            }}>
                {invites.map(invite => (
                    <RecruiterInviteEnvelope
                        key={invite.inviteId}
                        invite={invite}
                        onRefresh={loadRecruiterInvites}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecruiterInvitesList;
