'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useViewportScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  Clock,
  Brain,
  Zap,
  Activity,
  Database,
  MessageCircle,
  ChevronRight,
  Eye,
  Star,
  Globe,
  Sparkles,
  Bot,
  User
} from 'lucide-react';
import { kombaiAI } from '@/lib/kombai-ai-service';
import { useResponsiveOptimization, getAnimationSettings } from '@/hooks/use-responsive-optimization';
import ChatInterface from '@/components/chat-interface';

interface Document {
  id: string;
  filename: string;
  originalName: string;
  status: 'processing' | 'completed' | 'failed';
  category?: string;
  summary?: string;
  wordCount?: number;
  createdAt: string;
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
}

interface AnalyticsData {
  totalDocuments: number;
  processedDocuments: number;
  totalQueries: number;
  averageResponseTime: number;
  topCategories: { name: string; count: number; }[];
  recentActivity: { type: string; message: string; timestamp: string; }[];
}

export default function EnhancedDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  
  // Kombai AI and responsive optimizations
  const dashboardAnalysis = kombaiAI.analyzeComponent('dashboard');
  const responsiveOpt = useResponsiveOptimization();
  const animationSettings = getAnimationSettings(responsiveOpt.viewport);
  
  // Update viewportWidth from responsive optimization
  useEffect(() => {
    setViewportWidth(responsiveOpt.viewport.width);
  }, [responsiveOpt.viewport.width]);
  
  // Parallax and scroll effects
  const { scrollY } = useViewportScroll();
  const headerY = useTransform(scrollY, [0, 200], [0, -50]);
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);

  // Mock user session
  const mockSession = {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      organization: {
        plan: 'Professional',
        documentsUsed: 12,
        documentsLimit: 100,
        queriesUsed: 247,
        queriesLimit: 1000
      }
    }
  };

  useEffect(() => {
    // Set viewport width for responsive optimizations
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    
    fetchDashboardData();
    
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Simulate API delay for realistic loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock documents data
    const mockDocuments: Document[] = [
      {
        id: '1',
        filename: 'sample-contract.pdf',
        originalName: 'Contract_2024.pdf',
        status: 'completed',
        category: 'contract',
        summary: 'Service agreement between Company A and Company B for consulting services.',
        wordCount: 1250,
        createdAt: new Date().toISOString(),
        entities: [
          { text: 'Company A', type: 'ORGANIZATION', confidence: 0.95 },
          { text: '$50,000', type: 'MONEY', confidence: 0.92 },
          { text: 'December 2024', type: 'DATE', confidence: 0.88 }
        ]
      },
      {
        id: '2',
        filename: 'financial-report.docx',
        originalName: 'Q3_Financial_Report.docx',
        status: 'completed',
        category: 'report',
        summary: 'Quarterly financial performance analysis showing 15% revenue growth.',
        wordCount: 2100,
        createdAt: new Date(Date.now() - 24*60*60*1000).toISOString(),
        entities: [
          { text: '15%', type: 'PERCENTAGE', confidence: 0.96 },
          { text: 'Q3 2024', type: 'DATE', confidence: 0.94 },
          { text: '$2.5M', type: 'MONEY', confidence: 0.91 }
        ]
      },
      {
        id: '3',
        filename: 'processing-invoice.pdf',
        originalName: 'Invoice_1234.pdf',
        status: 'processing',
        createdAt: new Date(Date.now() - 5*60*1000).toISOString(),
      },
      {
        id: '4',
        filename: 'marketing-strategy.pptx',
        originalName: 'Marketing_Strategy_2024.pptx',
        status: 'completed',
        category: 'strategy',
        summary: 'Comprehensive marketing strategy for 2024 including digital transformation initiatives.',
        wordCount: 3200,
        createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      }
    ];
    
    // Mock analytics data
    const mockAnalytics: AnalyticsData = {
      totalDocuments: mockDocuments.length,
      processedDocuments: mockDocuments.filter(d => d.status === 'completed').length,
      totalQueries: 247,
      averageResponseTime: 1.4,
      topCategories: [
        { name: 'Reports', count: 8 },
        { name: 'Contracts', count: 5 },
        { name: 'Strategy', count: 3 },
        { name: 'Other', count: 2 }
      ],
      recentActivity: [
        { type: 'upload', message: 'Uploaded Marketing_Strategy_2024.pptx', timestamp: new Date(Date.now() - 5*60*1000).toISOString() },
        { type: 'query', message: 'Asked about Q3 financial performance', timestamp: new Date(Date.now() - 15*60*1000).toISOString() },
        { type: 'processing', message: 'Completed processing Contract_2024.pdf', timestamp: new Date(Date.now() - 30*60*1000).toISOString() },
        { type: 'query', message: 'Searched for revenue trends', timestamp: new Date(Date.now() - 45*60*1000).toISOString() }
      ]
    };
    
    setDocuments(mockDocuments);
    setAnalytics(mockAnalytics);
    setLoading(false);
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    
    for (const file of Array.from(files)) {
      const mockDocument: Document = {
        id: Date.now().toString(),
        filename: file.name,
        originalName: file.name,
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      
      setDocuments(prev => [mockDocument, ...prev]);
      
      // Simulate processing
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => 
          doc.id === mockDocument.id 
            ? {
                ...doc,
                status: 'completed' as const,
                category: 'other',
                summary: 'Document processed successfully with AI analysis.',
                wordCount: Math.floor(Math.random() * 2000) + 500,
                entities: [
                  { text: 'AI Generated', type: 'ORGANIZATION', confidence: 0.85 }
                ]
              }
            : doc
        ));
        
        // Update analytics
        if (analytics) {
          setAnalytics({
            ...analytics,
            totalDocuments: analytics.totalDocuments + 1,
            processedDocuments: analytics.processedDocuments + 1,
            recentActivity: [
              { type: 'upload', message: `Uploaded ${file.name}`, timestamp: new Date().toISOString() },
              ...analytics.recentActivity.slice(0, 3)
            ]
          });
        }
      }, 3000);
    }
    
    setUploading(false);
  };

  // Enhanced stat card component
  const StatCard = ({ title, value, change, icon: Icon, trend = 'up', delay = 0 }: any) => {
    const cardClasses = kombaiAI.generateOptimizedClasses('dashboard-card', 'light');
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={`${cardClasses.join(' ')} cursor-pointer relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-4 translate-x-4"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change && (
            <div className={`text-xs flex items-center gap-1 mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              {change}
            </div>
          )}
        </CardContent>
      </motion.div>
    );
  };

  // Document card component
  const DocumentCard = ({ document, index }: { document: Document; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
              {document.originalName}
            </span>
            <Badge 
              variant={document.status === 'completed' ? 'default' : document.status === 'processing' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {document.status}
            </Badge>
          </div>
          
          {document.summary && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{document.summary}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(document.createdAt).toLocaleDateString()}
            </span>
            {document.wordCount && (
              <span>{document.wordCount.toLocaleString()} words</span>
            )}
            {document.category && (
              <Badge variant="outline" className="text-xs">{document.category}</Badge>
            )}
          </div>
          
          {document.entities && document.entities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {document.entities.slice(0, 3).map((entity, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700"
                >
                  {entity.text}
                </span>
              ))}
              {document.entities.length > 3 && (
                <span className="text-xs text-gray-500">+{document.entities.length - 3} more</span>
              )}
            </div>
          )}
        </div>
        
        {document.status === 'processing' && (
          <div className="ml-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <motion.header 
        className="bg-white border-b shadow-sm sticky top-0 z-50 backdrop-blur-md"
        style={{ y: headerY, opacity: headerOpacity }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LLM Answer Engine</h1>
                  <p className="text-xs text-gray-500">Enhanced with Kombai AI</p>
                </div>
              </motion.div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="hidden sm:flex">
                {responsiveOpt.breakpoint.name} • {responsiveOpt.recommendations.layout}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{mockSession.user.name}</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">AI Chat</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Upload Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className={kombaiAI.generateOptimizedClasses('button-primary', 'light').join(' ')}
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Document
              </Button>
              <input
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                multiple
              />
            </motion.div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Documents"
                  value={analytics.totalDocuments}
                  change="+12% this month"
                  icon={Database}
                  delay={0}
                />
                <StatCard
                  title="Processed"
                  value={analytics.processedDocuments}
                  change="+8% this week"
                  icon={Zap}
                  delay={0.1}
                />
                <StatCard
                  title="AI Queries"
                  value={analytics.totalQueries.toLocaleString()}
                  change="+23% this week"
                  icon={Brain}
                  delay={0.2}
                />
                <StatCard
                  title="Avg Response"
                  value={`${analytics.averageResponseTime}s`}
                  change="-15% faster"
                  icon={Activity}
                  delay={0.3}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card className={kombaiAI.generateOptimizedClasses('dashboard-card', 'light').join(' ')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.recentActivity.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'upload' ? 'bg-green-400' :
                            activity.type === 'query' ? 'bg-blue-400' :
                            activity.type === 'processing' ? 'bg-orange-400' :
                            'bg-gray-400'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Card className={kombaiAI.generateOptimizedClasses('dashboard-card', 'light').join(' ')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Document Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics?.topCategories.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{category.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(category.count / Math.max(...analytics.topCategories.map(c => c.count))) * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              />
                            </div>
                            <span className="text-sm text-gray-500 w-6 text-right">{category.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Documents</h2>
                <p className="text-gray-600">Manage and analyze your document library</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {documents.map((document, index) => (
                  <DocumentCard key={document.id} document={document} index={index} />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <ChatInterface />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}