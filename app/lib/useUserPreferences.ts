import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export function useUserPreferences() {
  const [apiKeys, setApiKeys] = useState<{ openai?: string; mistral?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrefs = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('openai_api_key, mistral_api_key')
        .eq('user_id', userData.user.id)
        .single();

      if (!error && data) {
        setApiKeys({
          openai: data.openai_api_key || undefined,
          mistral: data.mistral_api_key || undefined,
        });
      }
      setLoading(false);
    };

    fetchPrefs();
  }, []);

  return { apiKeys, loading };
}
