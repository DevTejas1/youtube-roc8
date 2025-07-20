import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useEventLogger } from '../hooks/useEventLogger';

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotesSectionProps {
  videoId: string;
}

export function NotesSection({ videoId }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const { logEvent } = useEventLogger();

  useEffect(() => {
    if (videoId && user) {
      fetchNotes();
    }
  }, [videoId, user]);

  const fetchNotes = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotes(data || []);
      await logEvent('notes_fetched', { videoId, noteCount: data?.length || 0 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes';
      setError(errorMessage);
      await logEvent('notes_fetch_failed', { videoId, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          video_id: videoId,
          content: newNote.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setNewNote('');
      await logEvent('note_added', { videoId, noteId: data.id });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add note';
      setError(errorMessage);
      await logEvent('note_add_failed', { videoId, error: errorMessage });
    } finally {
      setAdding(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update({ content: editContent.trim() })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;

      setNotes(notes.map(note => note.id === noteId ? data : note));
      setEditingNote(null);
      setEditContent('');
      await logEvent('note_updated', { videoId, noteId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note';
      setError(errorMessage);
      await logEvent('note_update_failed', { videoId, noteId, error: errorMessage });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      await logEvent('note_deleted', { videoId, noteId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      await logEvent('note_delete_failed', { videoId, noteId, error: errorMessage });
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4">
              <div className="h-4 bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-green-400 mr-2" />
          <h2 className="text-xl font-bold text-white">Video Notes ({notes.length})</h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="mb-8">
        <div className="bg-gray-700 rounded-lg p-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about improving this video..."
            className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
            rows={3}
          />
          <div className="flex justify-end mt-3 pt-3 border-t border-gray-600">
            <button
              type="submit"
              disabled={!newNote.trim() || adding}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
            >
              {adding ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Note
            </button>
          </div>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-700 rounded-lg p-4">
            {editingNote === note.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-600 text-white rounded p-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={cancelEditing}
                    className="text-gray-400 hover:text-white px-3 py-1 rounded transition-colors duration-200 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditNote(note.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors duration-200 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white mb-3 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Created: {formatDate(note.created_at)}
                    {note.updated_at !== note.created_at && (
                      <span className="ml-2">• Updated: {formatDate(note.updated_at)}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditing(note)}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No notes yet. Add your first note to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}