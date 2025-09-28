// LLM Answer Engine Configuration
// Core settings for the conversational AI with document intelligence capabilities

export const config = {
    // Core LLM Answer Engine Settings
    useOllamaInference: false,
    useOllamaEmbeddings: false,
    searchProvider: 'serper', // 'serper', 'brave' 
    inferenceModel: 'llama-3.1-70b-versatile', // Groq model for fast responses
    inferenceAPIKey: process.env.GROQ_API_KEY,
    embeddingsModel: 'text-embedding-3-small', // OpenAI embeddings
    
    // Document Processing Settings
    textChunkSize: 800,
    textChunkOverlap: 200,
    numberOfSimilarityResults: 4,
    numberOfPagesToScan: 10,
    
    // API Configuration
    nonOllamaBaseURL: 'https://api.groq.com/openai/v1',
    
    // Production Features
    useFunctionCalling: true,
    useRateLimiting: true, // Enable for production
    useSemanticCache: true, // Enable for production
    usePortkey: false,
    
    // Document Intelligence Integration
    supportedFileTypes: ['pdf', 'docx', 'txt', 'md'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxDocuments: 100,
    
    // UI Configuration
    primaryInterface: 'conversation', // 'conversation' | 'documents'
    enableDocumentUpload: true,
    enableDocumentChat: true,
}