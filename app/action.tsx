"use server";

import { config } from './config';
import { getSearchResults, getImages, getVideos } from './tools/searchProviders';
import { streamingChatCompletion } from './tools/streamingChatCompletion';

interface VectorResult {
  content: string;
  url: string;
  title: string;
}

interface SearchResponse {
  searchResults: any[];
  images: any[];
  videos: any[];
  llmResponse: string;
  error?: string;
}

// Simple content processing for now - can be enhanced with document integration
async function processContent(searchResults: any[], userMessage: string): Promise<VectorResult[]> {
  return searchResults.slice(0, config.numberOfSimilarityResults).map(result => ({
    content: result.snippet,
    url: result.link,
    title: result.title
  }));
}

export async function processQuery(userMessage: string, documentContext?: string): Promise<SearchResponse> {
  try {
    // Get search results, images, and videos in parallel
    const [searchResults, images, videos] = await Promise.all([
      getSearchResults(userMessage),
      getImages(userMessage),
      getVideos(userMessage),
    ]);

    // Process content for LLM context
    const vectorResults = await processContent(searchResults, userMessage);
    
    // Add document context if provided
    if (documentContext) {
      vectorResults.push({
        content: documentContext,
        url: 'uploaded-document',
        title: 'Uploaded Document'
      });
    }

    // Get LLM response (non-streaming for now)
    const llmResponse = await streamingChatCompletion(userMessage, vectorResults, null);

    return {
      searchResults,
      images,
      videos,
      llmResponse
    };
  } catch (error) {
    console.error('Query processing error:', error);
    return {
      searchResults: [],
      images: [],
      videos: [],
      llmResponse: '',
      error: 'An error occurred processing your request.'
    };
  }
}
