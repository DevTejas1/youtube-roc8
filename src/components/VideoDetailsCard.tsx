import React, { useState, useEffect } from 'react';
import { Eye, ThumbsUp, MessageSquare, Calendar, User, Lock, Globe } from 'lucide-react';
import { getVideoDetails, VideoDetails } from '../services/youtube';
import { useEventLogger } from '../hooks/useEventLogger';

interface VideoDetailsCardProps {
  videoId: string;
}

export function VideoDetailsCard({ videoId }: VideoDetailsCardProps) {
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { logEvent } = useEventLogger();

  useEffect(() => {
    if (videoId) {
      fetchVideoDetails();
    }
  }, [videoId]);

  const fetchVideoDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getVideoDetails(videoId);
      setVideo(data);
      await logEvent('video_details_fetched', { videoId, videoTitle: data.snippet.title });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video details';
      setError(errorMessage);
      await logEvent('video_details_fetch_failed', { videoId, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg">
          <p className="font-semibold">Error loading video details</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'unlisted':
        return <Lock className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Video Thumbnail */}
      <div className="aspect-video relative">
        <img
          src={video.snippet.thumbnails.high.url}
          alt={video.snippet.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center">
          {getPrivacyIcon(video.status.privacyStatus)}
          <span className="ml-1 capitalize">{video.status.privacyStatus}</span>
        </div>
      </div>

      {/* Video Details */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-2 leading-tight">
          {video.snippet.title}
        </h2>

        <div className="flex items-center text-gray-400 text-sm mb-4 space-x-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {video.snippet.channelTitle}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(video.snippet.publishedAt)}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {formatNumber(video.statistics.viewCount)}
            </div>
            <div className="text-sm text-gray-400">Views</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <ThumbsUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {formatNumber(video.statistics.likeCount)}
            </div>
            <div className="text-sm text-gray-400">Likes</div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white">
              {formatNumber(video.statistics.commentCount)}
            </div>
            <div className="text-sm text-gray-400">Comments</div>
          </div>
        </div>

        {/* Description */}
        {video.snippet.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
              {video.snippet.description.length > 300
                ? `${video.snippet.description.substring(0, 300)}...`
                : video.snippet.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}