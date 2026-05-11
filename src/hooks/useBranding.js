import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const BRANDING_QUERY_KEY = (userId) => ['branding', userId];

const fetchBranding = async (userId) => {
  const { data, error } = await supabase
    .from('branding_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const useBranding = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: BRANDING_QUERY_KEY(user?.id),
    queryFn: () => fetchBranding(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes — branding rarely changes
  });
};

// Call this after saving branding to invalidate the cache
export const useInvalidateBranding = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return () => queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY(user?.id) });
};
