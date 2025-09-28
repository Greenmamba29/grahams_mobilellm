import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: NextRequest) {
  try {
    // For demo mode, skip auth check if no session
    let user = null;
    let organizationId = null;
    
    try {
      const session = await getServerSession(authOptions);
      user = session?.user;
      organizationId = user?.organizationId;
    } catch (authError) {
      console.log('No auth session - running in demo mode');
    }

    const { query, documentContext, documentIds = [] } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get documents for context
    let documents: any[] = [];
    let fullContext = documentContext || '';

    if (organizationId && documentIds.length > 0) {
      documents = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          organizationId,
          status: 'completed'
        },
        select: {
          id: true,
          originalName: true,
          textContent: true,
          summary: true,
          category: true,
          entities: {
            select: {
              entity: {
                select: {
                  text: true,
                  type: true
                }
              },
              confidence: true
            }
          }
        }
      });

      // Build comprehensive context
      fullContext = documents.map(doc => 
        `Document: ${doc.originalName}\nCategory: ${doc.category}\nSummary: ${doc.summary}\nContent: ${doc.textContent?.substring(0, 2000)}...\n\n`
      ).join('');
    }

    // Create system prompt based on available context
    const systemPrompt = fullContext 
      ? `You are an intelligent document assistant. Answer questions based on the provided document context. Be specific and cite which documents you're referencing.

Context from uploaded documents:
${fullContext.substring(0, 8000)}

Guidelines:
- Answer directly and accurately based on the document content
- If information isn't in the documents, say so clearly
- Cite specific document names when referencing information
- Be concise but comprehensive
- If asked about data not in the documents, acknowledge the limitation`
      : `You are an intelligent AI assistant. Provide helpful, accurate, and detailed responses to user questions. If you don't have specific information, be honest about limitations.`;

    const openai = getOpenAI();

    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Prepare response with document sources
    const sources = documents.map(doc => ({
      id: doc.id,
      name: doc.originalName,
      category: doc.category,
      summary: doc.summary
    }));

    // Log usage if user exists
    if (organizationId && user) {
      await prisma.usage.create({
        data: {
          organizationId,
          userId: user.id,
          action: 'chat_query',
          metadata: {
            query: query.substring(0, 100),
            documentsUsed: documentIds.length,
            responseLength: response.length
          }
        }
      });
    }

    return NextResponse.json({
      llmResponse: response,
      sources,
      searchResults: [], // Can be enhanced with web search later
      images: [],
      videos: [],
      documentContext: fullContext ? 'Document context used' : 'No document context'
    });

  } catch (error) {
    console.error('Chat processing error:', error);
    
    // Provide graceful fallback
    if (error instanceof Error && error.message.includes('OpenAI API key')) {
      return NextResponse.json({
        llmResponse: 'I apologize, but the AI service is currently unavailable. Please check the API configuration and try again.',
        sources: [],
        searchResults: [],
        images: [],
        videos: []
      });
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}