'use client';

import { useState, useEffect, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim()) return;

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

    try {
      // Use real API with selected documents
      const response = await processQuery(queryInput, selectedDocuments, documentContext);
      
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
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check your internet connection.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simple text extraction for demo - can be enhanced with proper document processing
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setDocumentContext(text.substring(0, 4000)); // Limit context size
      } else {
        alert('Currently only text files (.txt, .md) are supported for document upload.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error reading file. Please try again.');
    }
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <h2 className="text-xl mb-2">Welcome to LLM Answer Engine</h2>
            <p>Ask me anything about your documents! I can analyze, summarize, and answer questions.</p>
            <div className="mt-4 text-sm space-y-2">
              <p>✨ <strong>Powered by:</strong> OpenAI GPT + Document Intelligence + Real-time Analysis</p>
              {documents.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
                  <p className="font-medium text-blue-800 mb-2">📚 Available Documents:</p>
                  <div className="space-y-1">
                    {documents.slice(0, 3).map(doc => (
                      <div key={doc.id} className="text-blue-700 text-xs flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        <span>{doc.originalName}</span>
                        {doc.category && <Badge variant="outline" className="text-xs">{doc.category}</Badge>}
                      </div>
                    ))}
                    {documents.length > 3 && (
                      <p className="text-blue-600 text-xs">...and {documents.length - 3} more documents</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'bg-blue-500 text-white' : `${message.error ? 'bg-red-50 border-red-200' : 'bg-white border'}`} rounded-lg p-4 shadow-sm`}>
              {message.error && (
                <div className="flex items-center gap-2 mb-3 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error occurred</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Document Sources */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Sources from your documents:
                  </p>
                  <div className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-2 border">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 mt-0.5 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{source.name}</p>
                            {source.category && (
                              <Badge variant="outline" className="text-xs mt-1">{source.category}</Badge>
                            )}
                            {source.summary && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{source.summary}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {message.role === 'assistant' && (message.searchResults || message.images || message.videos) && (
                <div className="mt-4">
                  <Tabs defaultValue="sources" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      {message.searchResults && message.searchResults.length > 0 && (
                        <TabsTrigger value="sources" className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Sources ({message.searchResults.length})
                        </TabsTrigger>
                      )}
                      {message.images && message.images.length > 0 && (
                        <TabsTrigger value="images" className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Images ({message.images.length})
                        </TabsTrigger>
                      )}
                      {message.videos && message.videos.length > 0 && (
                        <TabsTrigger value="videos" className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Videos ({message.videos.length})
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    {message.searchResults && message.searchResults.length > 0 && (
                      <TabsContent value="sources" className="space-y-2">
                        {message.searchResults.map((result: SearchResult, idx: number) => (
                          <Card key={idx} className="p-3">
                            <a href={result.link} target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                {result.favicon && <img src={result.favicon} alt="" className="w-4 h-4 mt-1" />}
                                <div>
                                  <h4 className="font-medium text-sm">{result.title}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{result.snippet}</p>
                                </div>
                              </div>
                            </a>
                          </Card>
                        ))}
                      </TabsContent>
                    )}
                    
                    {message.images && message.images.length > 0 && (
                      <TabsContent value="images" className="grid grid-cols-2 gap-2">
                        {message.images.map((img: any, idx: number) => (
                          <img key={idx} src={img.imageUrl} alt={img.title} className="w-full h-32 object-cover rounded" />
                        ))}
                      </TabsContent>
                    )}
                    
                    {message.videos && message.videos.length > 0 && (
                      <TabsContent value="videos" className="space-y-2">
                        {message.videos.map((video: any, idx: number) => (
                          <Card key={idx} className="p-3">
                            <a href={video.link} target="_blank" rel="noopener noreferrer" className="block">
                              <div className="flex items-center gap-3">
                                <img src={video.thumbnail} alt="" className="w-16 h-12 object-cover rounded" />
                                <div>
                                  <h4 className="font-medium text-sm">{video.title}</h4>
                                  {video.duration && <p className="text-xs text-gray-600">{video.duration}</p>}
                                </div>
                              </div>
                            </a>
                          </Card>
                        ))}
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-lg p-4 flex items-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching and thinking...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}