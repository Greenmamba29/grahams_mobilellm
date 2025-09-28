import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DocumentProcessor } from '@/lib/document-processor';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(url, key);
};

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    if (!user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check document limits
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (organization.documentsUsed >= organization.documentsLimit) {
      return NextResponse.json(
        { 
          error: 'Document limit reached', 
          limit: organization.documentsLimit,
          used: organization.documentsUsed,
        }, 
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type',
        allowedTypes,
      }, { status: 400 });
    }

    // Create document record
    const document = await prisma.document.create({
      data: {
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: '', // Will be updated after upload
        organizationId: user.organizationId,
        uploadedBy: user.id,
        status: 'processing',
      },
    });

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    
    const supabase = getSupabaseClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`${user.organizationId}/${document.id}`, buffer, {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          organizationId: user.organizationId,
          uploadedBy: user.id,
        },
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      await prisma.document.delete({ where: { id: document.id } });
      return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Update document with file URL  
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(`${user.organizationId}/${document.id}`);

    await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: publicUrl },
    });

    // Process document in background
    processDocumentAsync(document.id, buffer, file.name, file.type);

    // Update organization usage
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: { documentsUsed: { increment: 1 } },
    });

    // Log usage
    await prisma.usage.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'document_upload',
        resourceId: document.id,
        metadata: {
          filename: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        filename: file.name,
        status: 'processing',
        fileSize: file.size,
        mimeType: file.type,
        createdAt: document.createdAt,
      },
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processDocumentAsync(
  documentId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string
) {
  try {
    const startTime = Date.now();
    
    // Process document with AI
    const processed = await DocumentProcessor.processDocument(buffer, filename, mimeType);
    
    const processingTime = Date.now() - startTime;

    // Update document with processed data
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'completed',
        textContent: processed.textContent,
        summary: processed.summary,
        category: processed.category,
        confidence: processed.confidence,
        wordCount: processed.wordCount,
        pageCount: processed.pageCount,
        language: processed.language,
        processingTime,
      },
    });

    // Save entities
    for (const entityData of processed.entities) {
      // Find or create entity
      const entity = await prisma.entity.upsert({
        where: {
          organizationId_text_type: {
            organizationId: updatedDocument.organizationId,
            text: entityData.text,
            type: entityData.type,
          },
        },
        create: {
          text: entityData.text,
          type: entityData.type,
          organizationId: updatedDocument.organizationId,
        },
        update: {},
      });

      // Link entity to document
      await prisma.documentEntity.upsert({
        where: {
          documentId_entityId: {
            documentId: documentId,
            entityId: entity.id,
          },
        },
        create: {
          documentId: documentId,
          entityId: entity.id,
          confidence: entityData.confidence,
        },
        update: {
          confidence: entityData.confidence,
        },
      });
    }

    console.log(`Document ${documentId} processed successfully in ${processingTime}ms`);

  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error);
    
    // Update document status to failed
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'failed',
      },
    });
  }
}