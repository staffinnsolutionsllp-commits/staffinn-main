import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';
import { FaComments } from 'react-icons/fa';
import './ChatButton.css';

const ChatButton = ({ 
  recipientId, 
  recipientName, 
  recipientUserType = 'staff',
  buttonText = 'Chat',
  buttonClass = 'chat-button',
  disabled = false 
}) => {
  const { currentUser } = useContext(AuthContext);
  const [showChat, setShowChat] = useState(false);

  const handleChatOpen = () => {
    if (!currentUser) {
      alert('Please login to start a chat');
      return;
    }
    
    if (currentUser.userId === recipientId) {
      alert('You cannot chat with yourself');
      return;
    }
    
    setShowChat(true);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  return (
    <>
      <button 
        className={buttonClass}
        onClick={handleChatOpen}
        disabled={disabled || !currentUser}
        title={`Start a chat with ${recipientName}`}
        style={{
          background: 'white',
          color: '#4863f7',
          border: '2px solid #e5e7eb',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#4863f7';
          e.currentTarget.style.color = 'white';
          e.currentTarget.style.borderColor = '#4863f7';
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 99, 247, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = '#4863f7';
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }}
      >
        <FaComments style={{ fontSize: '30px' }} />
        {buttonText && <span style={{ marginLeft: '6px' }}>{buttonText}</span>}
      </button>

      {showChat && (
        <ChatWindow
          isOpen={true}
          onClose={handleChatClose}
          recipientId={recipientId}
          recipientName={recipientName}
        />
      )}
    </>
  );
};

export default ChatButton;