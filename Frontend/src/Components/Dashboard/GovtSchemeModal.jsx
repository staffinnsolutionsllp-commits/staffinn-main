import React from 'react';

const GovtSchemeModal = ({ 
    showGovtSchemeModal, 
    selectedGovtScheme, 
    setShowGovtSchemeModal 
}) => {
    if (!showGovtSchemeModal || !selectedGovtScheme) return null;

    return (
        <div className="institute-modal-overlay" onClick={() => setShowGovtSchemeModal(false)}>
            <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="institute-modal-header">
                    <h2>Government Scheme Details</h2>
                    <button className="institute-close-button" onClick={() => setShowGovtSchemeModal(false)}>×</button>
                </div>
                
                <div className="institute-govt-scheme-details">
                    <div className="institute-scheme-info">
                        <h3>{selectedGovtScheme.schemeName}</h3>
                        
                        <div className="institute-scheme-description">
                            <h4>Description:</h4>
                            <p>{selectedGovtScheme.description}</p>
                        </div>
                        
                        <div className="institute-scheme-link">
                            <h4>Link:</h4>
                            <a href={selectedGovtScheme.link} target="_blank" rel="noopener noreferrer">
                                {selectedGovtScheme.link}
                            </a>
                        </div>
                    </div>
                </div>
                
                <div className="institute-form-buttons">
                    <button 
                        type="button" 
                        className="institute-secondary-button" 
                        onClick={() => setShowGovtSchemeModal(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GovtSchemeModal;