import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';

const Chatbot = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const data = await apiService.getChatHistory();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'patient',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setError('');

    try {
      const response = await apiService.sendChatMessage(userMessage.content);
      
      const botMessage = {
        role: 'bot',
        content: response.botResponse,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all chat history?')) {
      try {
        await apiService.clearChatHistory();
        setMessages([]);
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-lg font-medium">Medical Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearHistory}
              className="text-white hover:text-gray-200 text-sm"
              title="Clear chat history"
            >
              🗑️ Clear
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <span className="text-4xl mb-4 block">🤖</span>
              <p>Hello! I'm your medical assistant.</p>
              <p className="text-sm mt-2">Ask me any medical questions and I'll do my best to help!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'patient'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'patient' ? 'text-indigo-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a medical question..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ This is for informational purposes only. Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;