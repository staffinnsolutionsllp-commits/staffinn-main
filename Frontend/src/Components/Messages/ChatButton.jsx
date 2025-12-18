import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';
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
      >
        <i className="fas fa-comment"></i>
        {buttonText}
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