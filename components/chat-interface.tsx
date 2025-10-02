'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Loader2,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import { kombaiAI } from '@/lib/kombai-ai-service';
import { useResponsiveOptimization, getAnimationSettings } from '@/hooks/use-responsive-optimization';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: any[];
  images?: any[];
  videos?: any[];
  sources?: DocumentSource[];
  error?: boolean;
}

interface DocumentSource {
  id: string;
  name: string;
  category?: string;
  summary?: string;
}

interface Document {
  id: string;
  originalName: string;
  status: 'processing' | 'completed' | 'failed';
  category?: string;
  summary?: string;
  textContent?: string;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  favicon?: string;
}

// Real API integration for chat processing
const processQuery = async (query: string, selectedDocuments: string[] = [], documentContext?: string) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        documentIds: selectedDocuments,
        documentContext
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Graceful fallback for demo purposes
    return {
      llmResponse: `I understand you're asking about "${query}". I apologize, but I'm currently unable to process your request due to a technical issue. This could be due to:

• API configuration issues
• Network connectivity problems
• Service temporarily unavailable

Please try again in a moment or contact support if the issue persists.`,
      sources: [],
      searchResults: [],
      images: [],
      videos: [],
      error: true
    };
  }
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContext, setDocumentContext] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptimizationSuggestion, setShowOptimizationSuggestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get Kombai AI optimizations
  const chatAnalysis = kombaiAI.analyzeComponent('chat-interface');
  const animationConfig = kombaiAI.getAnimationConfig('enter');
  const a11yEnhancements = kombaiAI.getA11yEnhancements('chat-interface');
  
  // Get responsive optimizations
  const responsiveOpt = useResponsiveOptimization();
  const animationSettings = getAnimationSettings(responsiveOpt.viewport);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch available documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        const completedDocs = data.documents?.filter((doc: Document) => doc.status === 'completed') || [];
        setDocuments(completedDocs);
        
        // Auto-select all completed documents by default
        setSelectedDocuments(completedDocs.map((doc: Document) => doc.id));
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      // In demo mode, use mock documents
      const mockDocs = [
        {
          id: '1',
          originalName: 'Contract_2024.pdf',
          status: 'completed' as const,
          category: 'contract',
          summary: 'Service agreement between Company A and Company B for consulting services.',
          textContent: 'This agreement is made between Company A and Company B for consulting services worth $50,000...'
        },
        {
          id: '2',
          originalName: 'Q3_Financial_Report.docx', 
          status: 'completed' as const,
          category: 'report',
          summary: 'Quarterly financial performance analysis showing 15% revenue growth.',
          textContent: 'Q3 2024 financial results show strong performance with $2.5M revenue representing 15% growth...'
        }
      ];
      setDocuments(mockDocs);
      setSelectedDocuments(['1', '2']);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const queryInput = input;
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add realistic delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use real API with selected documents
      const response = await processQuery(queryInput, selectedDocuments, documentContext);
      
      // Simulate typing delay based on response length
      const typingDelay = Math.min(response.llmResponse.length * 10, 2000);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      setIsTyping(false);
      
      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.llmResponse,
        timestamp: new Date(),
        searchResults: response.searchResults || [],
        images: response.images || [],
        videos: response.videos || [],
        sources: response.sources || [],
        error: response.error || false
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check your internet connection.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Enhanced keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      setInput('');
      inputRef.current?.blur();
    }
  };

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple text extraction for demo - can be enhanced with proper document processing
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setDocumentContext(text.substring(0, 4000)); // Limit context size
        console.log('File uploaded:', file.name, 'Context length:', text.length);
      } else {
        alert('Currently only text files (.txt, .md) are supported for document upload.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error reading file. Please try again.');
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: animationSettings.duration, ease: "easeOut" }}
      className="flex items-center space-x-3 p-4 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <Bot className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-blue-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">AI is thinking...</span>
    </motion.div>
  );

  // Enhanced message component
  const MessageBubble = ({ message, index }: { message: Message; index: number }) => {
    const isUser = message.role === 'user';
    const messageClasses = kombaiAI.generateOptimizedClasses(
      'chat-message',
      'light' // TODO: Add theme detection
    ).join(' ');

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: animationSettings.reduceMotion ? 0.1 : 0.3, 
          ease: "easeOut",
          delay: animationSettings.reduceMotion ? 0 : index * 0.1 
        }}
        className={`mb-4 ${isUser ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[90%]'}`}
      >
        <div className="flex items-start space-x-3">
          {!isUser && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <div className={`${messageClasses} ${isUser ? 'bg-blue-600 text-white ml-auto' : ''}`}>
            <div className="prose prose-sm max-w-none">
              {message.content}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Sources:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      {source.name}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {message.error && (
              <div className="mt-2 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">There was an issue processing your request</span>
              </div>
            )}
          </div>
          {isUser && (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">LLM Answer Engine</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {documents.length} docs available
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Document Selection */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Search in:</label>
              <Select 
                value={selectedDocuments.length === documents.length ? 'all' : selectedDocuments.length === 0 ? 'none' : 'custom'} 
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedDocuments(documents.map(d => d.id));
                  } else if (value === 'none') {
                    setSelectedDocuments([]);
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents ({documents.length})</SelectItem>
                  <SelectItem value="none">No Documents</SelectItem>
                  <SelectItem value="custom">Custom Selection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Text File
            </Button>
            
            {/* Refresh Documents */}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDocuments}
              disabled={loadingDocuments}
            >
              <RefreshCw className={`h-4 w-4 ${loadingDocuments ? 'animate-spin' : ''}`} />
            </Button>
            
            {documentContext && (
              <Badge variant="secondary">
                Text Context ({Math.round(documentContext.length / 100)}0 chars)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100"
        {...a11yEnhancements}
      >
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: animationSettings.duration, ease: "easeOut" }}
            className="text-center text-gray-500 mt-8 max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to LLM Answer Engine</h2>
              <p className="text-gray-600 mb-6">Ask me anything about your documents! I can analyze, summarize, and answer questions with AI-powered intelligence.</p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-800 mb-2">✨ <strong>Enhanced with Kombai AI:</strong></p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Smart Animations
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Responsive Design
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    Real-time Analysis
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    Optimized UX
                  </div>
                </div>
              </div>
              
              {documents.length > 0 && (
                <div className="bg-white border-2 border-blue-100 rounded-xl p-4">
                  <p className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    📚 Available Documents ({documents.length})
                  </p>
                  <div className="space-y-2">
                    {documents.slice(0, 3).map(doc => (
                      <motion.div 
                        key={doc.id} 
                        className="text-blue-700 text-sm flex items-center gap-2 p-2 bg-blue-50 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <FileText className="h-3 w-3" />
                        <span className="flex-1 truncate">{doc.originalName}</span>
                        {doc.category && <Badge variant="outline" className="text-xs">{doc.category}</Badge>}
                      </motion.div>
                    ))}
                    {documents.length > 3 && (
                      <p className="text-blue-600 text-sm text-center py-2">...and {documents.length - 3} more documents</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Animated Message List */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <MessageBubble key={message.id} message={message} index={index} />
          ))}
          
          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Enhanced Input Area with Kombai AI */}
      <motion.div 
        className="border-t bg-white p-4 shadow-lg"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            {/* Optimized Input */}
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedDocuments.length > 0 
                  ? `Ask questions about ${selectedDocuments.length} selected document${selectedDocuments.length > 1 ? 's' : ''}...` 
                  : "Ask me anything about your documents..."
                }
                disabled={isLoading}
                className={kombaiAI.generateOptimizedClasses('chat-input', 'light').join(' ') + " min-h-[44px] pr-12"}
              />
              {input && (
                <motion.button
                  type="button"
                  onClick={() => setInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AlertCircle className="h-4 w-4" />
                </motion.button>
              )}
            </div>
            
            {/* Enhanced Send Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className={kombaiAI.generateOptimizedClasses('button-primary', 'light').join(' ') + " h-11"}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>
          
          {/* Input Status/Hints */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {selectedDocuments.length > 0 && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </span>
              )}
              {isTyping && (
                <motion.span 
                  className="flex items-center gap-1 text-blue-600"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Bot className="w-3 h-3" />
                  AI is typing...
                </motion.span>
              )}
            </div>
            <div className="text-right">
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}