import OpenAI from 'openai';
import { config } from '../config';

interface VectorResult {
  content: string;
  url: string;
  title: string;
}

export async function streamingChatCompletion(
  userMessage: string,
  vectorResults: VectorResult[],
  streamable: any = null
) {
  const openai = new OpenAI({
    apiKey: config.inferenceAPIKey,
    baseURL: config.nonOllamaBaseURL,
  });

  const context = vectorResults
    .map((result) => `Source: ${result.title} (${result.url})\n${result.content}`)
    .join('\n\n');

  const systemPrompt = `You are an AI assistant that provides helpful, accurate answers based on the provided context and your knowledge. 

Key instructions:
1. Answer the user's question directly and concisely
2. Use the provided search results and context when relevant
3. If the context doesn't contain enough information, use your general knowledge
4. Always cite sources when using information from the provided context
5. Be conversational and helpful
6. If you reference documents or files, explain their relevance clearly

Context from search results and documents:
${context}`;

  try {
    if (streamable) {
      // Streaming mode
      const stream = await openai.chat.completions.create({
        model: config.inferenceModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          streamable.update({ llmResponseChunk: content });
        }
      }
      return fullResponse;
    } else {
      // Non-streaming mode
      const completion = await openai.chat.completions.create({
        model: config.inferenceModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      });
      
      return completion.choices[0]?.message?.content || 'No response generated.';
    }
  } catch (error) {
    console.error('Chat completion error:', error);
    const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
    if (streamable) {
      streamable.update({ llmResponseChunk: errorMessage });
    }
    return errorMessage;
  }
}
