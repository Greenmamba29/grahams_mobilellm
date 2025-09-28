import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        fileSize: true,
        mimeType: true,
        status: true,
        textContent: false, // Don't include full text content
        summary: true,
        category: true,
        confidence: true,
        wordCount: true,
        pageCount: true,
        language: true,
        processingTime: true,
        createdAt: true,
        updatedAt: true,
        entities: {
          include: {
            entity: {
              select: {
                text: true,
                type: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the frontend interface
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      entities: doc.entities.map(de => ({
        text: de.entity.text,
        type: de.entity.type,
        confidence: de.confidence || 0,
      }))
    }));

    return NextResponse.json({
      documents: transformedDocuments,
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}