import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useEventLogger() {
  const { user } = useAuth();

  const logEvent = useCallback(async (eventType: string, eventData: any = {}) => {
    if (!user) return;

    try {
      await supabase
        .from('event_logs')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_data: eventData,
        });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }, [user]);

  return { logEvent };
}