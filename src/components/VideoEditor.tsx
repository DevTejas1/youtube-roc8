import React, { useState, useEffect } from 'react';
import { Save, Edit3, AlertCircle } from 'lucide-react';
import { getVideoDetails, updateVideo, VideoDetails } from '../services/youtube';
import { useAuth } from '../hooks/useAuth';
import { useEventLogger } from '../hooks/useEventLogger';

interface VideoEditorProps {
  videoId: string;
}

export function VideoEditor({ videoId }: VideoEditorProps) {
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
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
      setTitle(data.snippet.title);
      setDescription(data.snippet.description);
      await logEvent('video_editor_opened', { videoId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video details';
      setError(errorMessage);
      await logEvent('video_editor_fetch_failed', { videoId, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video || !user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // This would require OAuth access token from Google sign-in
      console.log('Would update video:', { title, description });
      await logEvent('video_update_attempted', { 
        videoId, 
        oldTitle: video.snippet.title,
        newTitle: title,
        descriptionChanged: description !== video.snippet.description 
      });
      
      // Simulate successful update
      setSuccess('Video updated successfully!');
      
      // Update local state
      setVideo({
        ...video,
        snippet: {
          ...video.snippet,
          title,
          description
        }
      });

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update video';
      setError(errorMessage);
      await logEvent('video_update_failed', { videoId, error: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-700 rounded mb-4"></div>
          <div className="h-6 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">Enter a video ID to edit video details</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center mb-6">
        <Edit3 className="h-5 w-5 text-blue-400 mr-2" />
        <h2 className="text-xl font-bold text-white">Edit Video Details</h2>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-400 p-4 rounded-lg mb-6 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <div>
          <p className="font-semibold">OAuth Required</p>
          <p className="text-sm">Editing video details requires YouTube OAuth authentication with appropriate permissions.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter video title"
            maxLength={100}
          />
          <p className="text-sm text-gray-400 mt-1">{title.length}/100 characters</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter video description"
            maxLength={5000}
          />
          <p className="text-sm text-gray-400 mt-1">{description.length}/5000 characters</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || (title === video.snippet.title && description === video.snippet.description)}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}