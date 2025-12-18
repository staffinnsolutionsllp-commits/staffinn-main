import React, { useState } from 'react';
import QuickContactModal from './QuickContactModal';

const MessageButton = ({ recipientId, recipientName, className = '', size = 'medium' }) => {
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    small: 'message-btn-small',
    medium: 'message-btn-medium',
    large: 'message-btn-large'
  };

  return (
    <>
      <button
        className={`message-btn ${sizeClasses[size]} ${className}`}
        onClick={() => setShowModal(true)}
        title={`Send message to ${recipientName}`}
      >
        <i className="fas fa-envelope"></i>
        <span>Message</span>
      </button>

      <QuickContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        recipientId={recipientId}
        recipientName={recipientName}
      />
    </>
  );
};

export default MessageButton;