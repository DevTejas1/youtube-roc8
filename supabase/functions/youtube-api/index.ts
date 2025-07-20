import { corsHeaders } from '../_shared/cors.ts';

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const videoId = url.searchParams.get('videoId');

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    let response;

    switch (action) {
      case 'video-details':
        if (!videoId) {
          throw new Error('Video ID is required');
        }
        
        response = await fetch(
          `${YOUTUBE_BASE_URL}/videos?id=${videoId}&part=snippet,statistics,status&key=${YOUTUBE_API_KEY}`
        );
        break;

      case 'comments':
        if (!videoId) {
          throw new Error('Video ID is required');
        }
        
        response = await fetch(
          `${YOUTUBE_BASE_URL}/commentThreads?videoId=${videoId}&part=snippet,replies&key=${YOUTUBE_API_KEY}`
        );
        break;

      case 'post-comment':
        if (req.method !== 'POST') {
          throw new Error('POST method required');
        }
        
        const { accessToken, text } = await req.json();
        
        response = await fetch(
          `${YOUTUBE_BASE_URL}/commentThreads?part=snippet`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              snippet: {
                videoId: videoId,
                topLevelComment: {
                  snippet: {
                    textOriginal: text
                  }
                }
              }
            })
          }
        );
        break;

      case 'delete-comment':
        if (req.method !== 'DELETE') {
          throw new Error('DELETE method required');
        }
        
        const { accessToken: deleteToken } = await req.json();
        const commentId = url.searchParams.get('commentId');
        
        response = await fetch(
          `${YOUTUBE_BASE_URL}/comments?id=${commentId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${deleteToken}`,
            }
          }
        );
        break;

      case 'update-video':
        if (req.method !== 'PUT') {
          throw new Error('PUT method required');
        }
        
        const { accessToken: updateToken, title, description } = await req.json();
        
        response = await fetch(
          `${YOUTUBE_BASE_URL}/videos?part=snippet`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${updateToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: videoId,
              snippet: {
                title,
                description,
                categoryId: '22' // Default to People & Blogs
              }
            })
          }
        );
        break;

      default:
        throw new Error('Invalid action');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'YouTube API error');
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('YouTube API Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});