import React, { useState, useEffect } from 'react';
import { LogOut, Play, FileText, MessageSquare, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEventLogger } from '../hooks/useEventLogger';
import { VideoDetailsCard } from './VideoDetailsCard';
import { CommentsSection } from './CommentsSection';
import { NotesSection } from './NotesSection';
import { VideoEditor } from './VideoEditor';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [videoId, setVideoId] = useState('');
  const { user, signOut } = useAuth();
  const { logEvent } = useEventLogger();

  useEffect(() => {
    logEvent('dashboard_viewed');
  }, [logEvent]);

  const handleSignOut = async () => {
    await logEvent('user_signed_out');
    await signOut();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'edit', label: 'Edit Video', icon: Settings },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-red-500 mr-3" />
              <h1 className="text-xl font-bold text-white">YouTube Companion</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Video ID Input */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <label htmlFor="videoId" className="block text-sm font-medium text-gray-300 mb-2">
            YouTube Video ID
          </label>
          <input
            type="text"
            id="videoId"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
          />
          <p className="mt-2 text-sm text-gray-400">
            Enter the video ID from your YouTube video URL. For example, from 
            "https://youtube.com/watch?v=dQw4w9WgXcQ", the ID is "dQw4w9WgXcQ"
          </p>
        </div>

        {videoId && (
          <>
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-3 py-2 font-medium text-sm rounded-lg transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'bg-red-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-8">
              {activeTab === 'overview' && (
                <VideoDetailsCard videoId={videoId} />
              )}

              {activeTab === 'comments' && (
                <CommentsSection videoId={videoId} />
              )}

              {activeTab === 'edit' && (
                <VideoEditor videoId={videoId} />
              )}

              {activeTab === 'notes' && (
                <NotesSection videoId={videoId} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}