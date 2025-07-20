import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Reply, Send, ThumbsUp } from 'lucide-react';
import { getVideoComments, postComment, deleteComment, Comment } from '../services/youtube';
import { useAuth } from '../hooks/useAuth';
import { useEventLogger } from '../hooks/useEventLogger';

interface CommentsSectionProps {
  videoId: string;
}

export function CommentsSection({ videoId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  const { logEvent } = useEventLogger();

  useEffect(() => {
    if (videoId) {
      fetchComments();
    }
  }, [videoId]);

  const fetchComments = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getVideoComments(videoId);
      setComments(data);
      await logEvent('comments_fetched', { videoId, commentCount: data.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(errorMessage);
      await logEvent('comments_fetch_failed', { videoId, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setPosting(true);
    try {
      // This would require OAuth access token from Google sign-in
      // For demo purposes, we'll show how it would work
      console.log('Would post comment:', newComment);
      await logEvent('comment_attempted', { videoId, commentText: newComment });
      
      // Simulate adding comment locally
      const mockComment: Comment = {
        id: `mock-${Date.now()}`,
        snippet: {
          topLevelComment: {
            snippet: {
              textDisplay: newComment,
              authorDisplayName: user.email || 'You',
              publishedAt: new Date().toISOString(),
              likeCount: 0
            }
          },
          totalReplyCount: 0
        }
      };
      
      setComments([mockComment, ...comments]);
      setNewComment('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post comment';
      setError(errorMessage);
      await logEvent('comment_post_failed', { videoId, error: errorMessage });
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      // This would require OAuth access token
      console.log('Would delete comment:', commentId);
      await logEvent('comment_deleted', { videoId, commentId });
      
      // Remove from local state
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(errorMessage);
      await logEvent('comment_delete_failed', { videoId, commentId, error: errorMessage });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-700 pb-4">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center mb-6">
        <MessageSquare className="h-5 w-5 text-purple-400 mr-2" />
        <h2 className="text-xl font-bold text-white">Comments ({comments.length})</h2>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handlePostComment} className="mb-8">
        <div className="bg-gray-700 rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-600">
            <p className="text-sm text-gray-400">
              Note: Comment posting requires YouTube OAuth authentication
            </p>
            <button
              type="submit"
              disabled={!newComment.trim() || posting}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
            >
              {posting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Comment
            </button>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-700 pb-6 last:border-b-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="font-semibold text-white">
                    {comment.snippet.topLevelComment.snippet.authorDisplayName}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    {formatDate(comment.snippet.topLevelComment.snippet.publishedAt)}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-3 leading-relaxed">
                  {comment.snippet.topLevelComment.snippet.textDisplay}
                </p>

                <div className="flex items-center space-x-4">
                  <button className="flex items-center text-gray-400 hover:text-white transition-colors duration-200">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {comment.snippet.topLevelComment.snippet.likeCount}
                  </button>
                  
                  <button className="flex items-center text-gray-400 hover:text-white transition-colors duration-200">
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </button>

                  {comment.snippet.topLevelComment.snippet.authorDisplayName === user?.email && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex items-center text-red-400 hover:text-red-300 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  )}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.comments.length > 0 && (
                  <div className="mt-4 ml-6 space-y-3 border-l border-gray-600 pl-4">
                    {comment.replies.comments.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-white text-sm">
                            {reply.snippet.authorDisplayName}
                          </span>
                          <span className="text-gray-400 text-xs ml-2">
                            {formatDate(reply.snippet.publishedAt)}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{reply.snippet.textDisplay}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && !loading && (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}