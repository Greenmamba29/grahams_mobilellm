'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
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
  LogOut,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';

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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments();
    }
  }, [status]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          setDocuments(prev => [result.document, ...prev]);
        } else {
          const error = await response.json();
          alert(error.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed');
      }
    }
    
    setUploading(false);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Document Intelligence Platform
            </CardTitle>
            <p className="text-gray-600 mt-2">
              AI-powered document processing and insights extraction
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => signIn('google')} 
              className="w-full"
              size="lg"
            >
              Sign in with Google
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Start with 5 free documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const organization = session?.user?.organization;
  const usagePercent = organization 
    ? Math.round((organization.documentsUsed / organization.documentsLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Document Intelligence
              </h1>
              {organization && (
                <Badge variant="outline" className="ml-3">
                  {organization.plan}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {session?.user?.name}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Stats */}
        {organization && (
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Document Usage
                    </h3>
                    <p className="text-sm text-gray-600">
                      {organization.documentsUsed} of {organization.documentsLimit} documents used
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {usagePercent}%
                    </div>
                  </div>
                </div>
                <Progress value={usagePercent} className="h-2" />
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="entities" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Entities
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Documents
                  </h3>
                  <p className="text-gray-600 mb-4">
                    PDF, DOCX, images up to 50MB
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload">
                    <Button disabled={uploading} className="cursor-pointer">
                      {uploading ? 'Uploading...' : 'Choose Files'}
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Documents List */}
            <div className="grid gap-4">
              {loading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </CardContent>
                </Card>
              ) : documents.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No documents yet
                    </h3>
                    <p className="text-gray-600">
                      Upload your first document to get started
                    </p>
                  </CardContent>
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <h3 className="font-medium text-gray-900">
                              {doc.originalName}
                            </h3>
                            <Badge 
                              variant={
                                doc.status === 'completed' ? 'default' :
                                doc.status === 'processing' ? 'secondary' : 'destructive'
                              }
                            >
                              {doc.status}
                            </Badge>
                          </div>
                          
                          {doc.status === 'completed' && (
                            <>
                              {doc.category && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-gray-600">Category:</span>
                                  <Badge variant="outline">{doc.category}</Badge>
                                </div>
                              )}
                              
                              {doc.summary && (
                                <p className="text-sm text-gray-700 mb-3">
                                  {doc.summary}
                                </p>
                              )}
                              
                              {doc.entities && doc.entities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {doc.entities.slice(0, 5).map((entity, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {entity.text}
                                    </Badge>
                                  ))}
                                  {doc.entities.length > 5 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{doc.entities.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                            {doc.wordCount && (
                              <span>{doc.wordCount.toLocaleString()} words</span>
                            )}
                          </div>
                        </div>
                        
                        {doc.status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Entities Tab */}
          <TabsContent value="entities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Extracted Entities</CardTitle>
                <p className="text-sm text-gray-600">
                  All entities extracted from your documents
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Entity browser coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Documents
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documents.length}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Processed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documents.filter(d => d.status === 'completed').length}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Words
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {documents
                          .reduce((sum, doc) => sum + (doc.wordCount || 0), 0)
                          .toLocaleString()
                        }
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}