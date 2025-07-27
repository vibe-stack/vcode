import { mapBuilderToolDefinitions } from './map-builder-tools';

export async function mapBuilderChatFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  try {
    // Convert input to string URL if needed
    const url = typeof input === 'string' ? input : input.toString();
    
    // Parse the request body to add our tools
    const body = JSON.parse(init.body as string);
    
    // Add our map builder tools to the request
    body.tools = mapBuilderToolDefinitions;
    
    // Make the request with our modified body
    const modifiedInit = {
      ...init,
      body: JSON.stringify(body)
    };
    
    const response = await fetch(url, modifiedInit);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Map builder chat fetch error:', error);
    throw error;
  }
}
