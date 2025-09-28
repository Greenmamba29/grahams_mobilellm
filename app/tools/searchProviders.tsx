import { config } from '../config';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  favicon?: string;
}

interface ImageResult {
  title: string;
  imageUrl: string;
  sourceUrl: string;
}

interface VideoResult {
  title: string;
  link: string;
  thumbnail: string;
  duration?: string;
}

export async function getSearchResults(query: string): Promise<SearchResult[]> {
  try {
    if (config.searchProvider === 'serper') {
      return await getSerperResults(query);
    } else if (config.searchProvider === 'brave') {
      return await getBraveResults(query);
    }
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

async function getSerperResults(query: string): Promise<SearchResult[]> {
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!response.ok) {
    throw new Error('Serper API error');
  }

  const data = await response.json();
  return data.organic?.map((result: any) => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.link).hostname}`,
  })) || [];
}

async function getBraveResults(query: string): Promise<SearchResult[]> {
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
    headers: {
      'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY || '',
    },
  });

  if (!response.ok) {
    throw new Error('Brave Search API error');
  }

  const data = await response.json();
  return data.web?.results?.map((result: any) => ({
    title: result.title,
    link: result.url,
    snippet: result.description,
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`,
  })) || [];
}

export async function getImages(query: string): Promise<ImageResult[]> {
  try {
    if (config.searchProvider === 'serper') {
      const response = await fetch('https://google.serper.dev/images', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 4 }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.images?.slice(0, 4).map((result: any) => ({
        title: result.title,
        imageUrl: result.imageUrl,
        sourceUrl: result.link,
      })) || [];
    }
    return [];
  } catch (error) {
    console.error('Images search error:', error);
    return [];
  }
}

export async function getVideos(query: string): Promise<VideoResult[]> {
  try {
    if (config.searchProvider === 'serper') {
      const response = await fetch('https://google.serper.dev/videos', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 4 }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.videos?.slice(0, 4).map((result: any) => ({
        title: result.title,
        link: result.link,
        thumbnail: result.imageUrl,
        duration: result.duration,
      })) || [];
    }
    return [];
  } catch (error) {
    console.error('Videos search error:', error);
    return [];
  }
}