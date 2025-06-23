'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Loader2, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Use timestamp number instead of Date object
  isLoading?: boolean;
}

interface Position {
  symbol: string;
  side: string;
  quantity: number;
  status: string;
}

const TradingChatUI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize component after client-side hydration
  useEffect(() => {
    setIsClient(true);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "👋 Welcome to your AI Trading Assistant! I can help you check your positions, analyze trades, and answer trading questions. Try asking 'What are my current positions?' to get started.",
        timestamp: Date.now()
      }
    ]);
    // Load positions on component mount
    fetchPositions();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Remove the separate useEffect for positions since it's now in the first useEffect

  const fetchPositions = async () => {
    try {
      const response = await fetch('http://localhost:3000/positions');
      const data = await response.json();
      if (data.status) {
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Here you would call your MCP client through an API endpoint
      // For now, we'll simulate the response based on the query
      const response = await processQuery(inputValue);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const processQuery = async (query: string): Promise<string> => {
    try {
      // Get the current conversation history (excluding loading messages)
      const conversationHistory = messages
        .filter(msg => !msg.isLoading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Call your Next.js API route that integrates with MCP
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: query,
          history: conversationHistory // Send conversation history
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Also refresh positions if the query was about positions
        if (query.toLowerCase().includes('position') || query.toLowerCase().includes('holdings')) {
          await fetchPositions();
        }
        return data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    'What are my current positions?',
    'Show me my P&L for today',
    'What are the market trends?',
    'Help me analyze my portfolio'
  ];

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Trading Assistant
              </h1>
              <p className="text-slate-400 text-sm">
                Powered by MCP • {positions.length} positions tracked
              </p>
            </div>
            <button
              onClick={fetchPositions}
              className="ml-auto p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              title="Refresh positions"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages - Added bottom padding to prevent overlap with fixed input */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-12'
                    : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-100'
                }`}
              >
                {message.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-slate-400">Thinking...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {isClient ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="mt-8">
            <p className="text-slate-400 text-sm font-medium mb-4">Quick actions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(action)}
                  className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-left text-slate-300 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-200 hover:shadow-lg"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your positions, trades, or market analysis..."
              className="w-full px-6 py-4 pr-14 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none backdrop-blur-sm"
              rows={1}
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Connected to MCP Server</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingChatUI;