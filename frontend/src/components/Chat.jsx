import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';
import { BACKEND_URL } from '../config.js';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';

const Chat = ({ skillMateId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [skillMateInfo, setSkillMateInfo] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat history when component mounts
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/chat/history/${skillMateId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const data = await response.json();
        setMessages(data.messages || []);
        setSkillMateInfo(data.skillMateInfo || null);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [skillMateId]);

  // Set up socket listeners for real-time chat
  useEffect(() => {
    // Listen for new messages
    const handleMessageReceived = (data) => {
      if (data.message && data.message.senderId === skillMateId) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
    };
    
    socket.on('chat-message-received', handleMessageReceived);
    
    // Listen for errors
    const handleChatError = (data) => {
      toast.error(data.message || 'Error with chat');
    };
    
    socket.on('chat-error', handleChatError);

    return () => {
      socket.off('chat-message-received', handleMessageReceived);
      socket.off('chat-error', handleChatError);
    };
  }, [skillMateId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Emit message via socket
    socket.emit('send-chat-message', {
      recipientId: skillMateId,
      content: newMessage.trim()
    });

    // Optimistically add message to UI
    const messageObj = {
      _id: Date.now().toString(),
      senderId: user._id,
      recipientId: skillMateId,
      content: newMessage.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((prevMessages) => [...prevMessages, messageObj]);
    setNewMessage('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[80vh] flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center justify-between bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center">
            {skillMateInfo?.profilePic ? (
              <img 
                src={`${BACKEND_URL}${skillMateInfo.profilePic}`} 
                alt={skillMateInfo.firstName} 
                className="w-10 h-10 rounded-full mr-3 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center text-blue-700 font-bold mr-3">
                {skillMateInfo?.firstName?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h3 className="font-semibold">
                {skillMateInfo ? `${skillMateInfo.firstName} ${skillMateInfo.lastName}` : 'SkillMate'}
              </h3>
              <p className="text-xs text-blue-100">
                {skillMateInfo?.username ? `@${skillMateInfo.username}` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation by sending a message</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === user._id;
                return (
                  <div 
                    key={message._id} 
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                    >
                      <p>{message.content}</p>
                      <p className={`text-xs mt-1 text-right ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t bg-white rounded-b-lg">
          <div className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 transition-colors"
              disabled={!newMessage.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;