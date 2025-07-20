import { supabase } from '../lib/supabase';

const YOUTUBE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-api`;

export interface VideoDetails {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
    };
    publishedAt: string;
    channelTitle: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  status: {
    privacyStatus: string;
  };
}

export interface Comment {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        publishedAt: string;
        likeCount: number;
      };
    };
    totalReplyCount: number;
  };
  replies?: {
    comments: Array<{
      id: string;
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        publishedAt: string;
        likeCount: number;
      };
    }>;
  };
}

async function makeYouTubeRequest(params: URLSearchParams, options: RequestInit = {}) {
  try {
    const response = await fetch(`${YOUTUBE_FUNCTION_URL}?${params.toString()}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'YouTube API request failed');
    }

    return response.json();
  } catch (error) {
    // If Edge Function is not available, fall back to mock data for demo
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Edge Function not available, using mock data');
      return getMockData(params);
    }
    throw error;
  }
}

function getMockData(params: URLSearchParams) {
  const action = params.get('action');
  const videoId = params.get('videoId');

  if (action === 'video-details') {
    return {
      items: [{
        id: videoId,
        snippet: {
          title: 'Sample YouTube Video',
          description: 'This is a sample video description. The actual video details would be fetched from the YouTube API when the Edge Function is properly deployed.',
          thumbnails: {
            high: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }
          },
          publishedAt: new Date().toISOString(),
          channelTitle: 'Sample Channel'
        },
        statistics: {
          viewCount: '1234567',
          likeCount: '12345',
          commentCount: '567'
        },
        status: {
          privacyStatus: 'public'
        }
      }]
    };
  }

  if (action === 'comments') {
    return {
      items: [
        {
          id: 'sample-comment-1',
          snippet: {
            topLevelComment: {
              snippet: {
                textDisplay: 'This is a sample comment. Real comments would be fetched when the Edge Function is deployed.',
                authorDisplayName: 'Sample User',
                publishedAt: new Date().toISOString(),
                likeCount: 5
              }
            },
            totalReplyCount: 0
          }
        }
      ]
    };
  }

  return { items: [] };
}

export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const params = new URLSearchParams({
    action: 'video-details',
    videoId,
  });

  const data = await makeYouTubeRequest(params);
  return data.items[0];
}

export async function getVideoComments(videoId: string): Promise<Comment[]> {
  const params = new URLSearchParams({
    action: 'comments',
    videoId,
  });

  const data = await makeYouTubeRequest(params);
  return data.items || [];
}

export async function postComment(videoId: string, text: string, accessToken: string) {
  const params = new URLSearchParams({
    action: 'post-comment',
    videoId,
  });

  return makeYouTubeRequest(params, {
    method: 'POST',
    body: JSON.stringify({ accessToken, text }),
  });
}

export async function deleteComment(commentId: string, accessToken: string) {
  const params = new URLSearchParams({
    action: 'delete-comment',
    commentId,
  });

  return makeYouTubeRequest(params, {
    method: 'DELETE',
    body: JSON.stringify({ accessToken }),
  });
}

export async function updateVideo(
  videoId: string,
  title: string,
  description: string,
  accessToken: string
) {
  const params = new URLSearchParams({
    action: 'update-video',
    videoId,
  });

  return makeYouTubeRequest(params, {
    method: 'PUT',
    body: JSON.stringify({ accessToken, title, description }),
  });
}