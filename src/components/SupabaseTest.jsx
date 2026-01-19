import React from 'react';
import { Button } from '@/components/ui/button';

// Direct import test
import { supabase } from '@/integrations/supabase/client';

const SupabaseTest = () => {
  const testSupabase = async () => {
    try {
      console.log('Supabase client:', supabase);
      console.log('Supabase type:', typeof supabase);
      
      if (!supabase) {
        throw new Error('Supabase client is null or undefined');
      }
      
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Supabase auth error:', error);
        alert(`Supabase auth error: ${error.message}`);
      } else {
        console.log('Supabase auth success:', data);
        alert(`Supabase working! User: ${data.user?.email || 'No user'}`);
      }
    } catch (error) {
      console.error('Supabase test failed:', error);
      alert(`Supabase test failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="font-semibold text-red-800 mb-3">Supabase Import Test</h3>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm">
          <strong>Import Status:</strong> {supabase ? '✅ Success' : '❌ Failed'}
        </p>
        <p className="text-sm">
          <strong>Client Type:</strong> {typeof supabase}
        </p>
        <p className="text-sm">
          <strong>Has Auth:</strong> {supabase?.auth ? '✅ Yes' : '❌ No'}
        </p>
      </div>
      
      <Button 
        onClick={testSupabase}
        size="sm"
        className="bg-red-600 hover:bg-red-500"
      >
        Test Supabase Connection
      </Button>
      
      <p className="text-xs text-red-700 mt-2">
        This will help debug the Supabase import issue.
      </p>
    </div>
  );
};

export default SupabaseTest;