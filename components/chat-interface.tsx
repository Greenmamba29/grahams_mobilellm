'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  ExternalLink,
  Loader2
} from 'lucide-react';
// import { processQuery } from '@/app/action'; // Replaced with standalone function

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: any[];
  images?: any[];
  videos?: any[];
  documentContext?: string;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  favicon?: string;
}

// Standalone process query function for demo
const processQuery = async (query: string, documentContext?: string) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock responses based on query content
  const mockResponses = {
    web: {
      llmResponse: `Based on web search results for "${query}", I found relevant information. This is a demonstration of how the LLM Answer Engine processes queries and provides comprehensive answers with sources.`,
      searchResults: [
        {
          title: `Information about ${query}`,
          link: 'https://example.com/result1',
          snippet: `Relevant information about ${query} from trusted sources...`,
          favicon: 'https://www.google.com/favicon.ico'
        },
        {
          title: `More details on ${query}`,
          link: 'https://example.com/result2', 
          snippet: `Additional context and details about your query...`,
          favicon: 'https://www.google.com/favicon.ico'
        }
      ],
      images: [],
      videos: []
    },
    document: {
      llmResponse: `Based on the uploaded document and your question "${query}", I can provide specific insights from the content. The document contains relevant information that directly answers your question.\n\nKey points from the document:\n- Context-aware analysis\n- Document-specific insights\n- Precise answers based on your content`,
      searchResults: [],
      images: [],
      videos: []
    },
    general: {
      llmResponse: `I understand you're asking about "${query}". This is a comprehensive answer that demonstrates the LLM Answer Engine's ability to provide detailed, thoughtful responses to user questions.\n\nThe system combines:\n• Web search capabilities\n• Document analysis\n• AI-powered reasoning\n• Multi-source information synthesis`,
      searchResults: [],
      images: [],
      videos: []
    }
  };
  
  // Determine response type
  if (documentContext && documentContext.length > 10) {
    return mockResponses.document;
  } else if (query.toLowerCase().includes('search') || query.toLowerCase().includes('find') || query.toLowerCase().includes('what is')) {
    return mockResponses.web;
  } else {
    return mockResponses.general;
  }
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContext, setDocumentContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      documentContext: documentContext || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await processQuery(input, documentContext || undefined);
      
      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.llmResponse,
        timestamp: new Date(),
        searchResults: response.searchResults,
        images: response.images,
        videos: response.videos
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
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
          <h1 className="text-2xl font-bold">LLM Answer Engine</h1>
          <div className="flex items-center gap-2">
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
              Add Document
            </Button>
            {documentContext && (
              <Badge variant="secondary">
                Document Loaded ({Math.round(documentContext.length / 100)}0 chars)
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
            <p>Ask me anything! I can search the web, process documents, and provide detailed answers.</p>
            <div className="mt-4 text-sm">
              <p>✨ <strong>Powered by:</strong> Web Search + Document Intelligence + AI</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'} rounded-lg p-4 shadow-sm`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
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