// Test different import methods for Supabase
console.log('Testing Supabase imports...');

// Method 1: Try alias import
try {
  const aliasImport = await import('@/integrations/supabase/client');
  console.log('✅ Alias import successful:', !!aliasImport.supabase);
  if (aliasImport.supabase) {
    window.supabaseFromAlias = aliasImport.supabase;
  }
} catch (error) {
  console.error('❌ Alias import failed:', error);
}

// Method 2: Try relative import
try {
  const relativeImport = await import('../integrations/supabase/client.js');
  console.log('✅ Relative import successful:', !!relativeImport.supabase);
  if (relativeImport.supabase) {
    window.supabaseFromRelative = relativeImport.supabase;
  }
} catch (error) {
  console.error('❌ Relative import failed:', error);
}

// Method 3: Try absolute import
try {
  const absoluteImport = await import('/src/integrations/supabase/client.js');
  console.log('✅ Absolute import successful:', !!absoluteImport.supabase);
  if (absoluteImport.supabase) {
    window.supabaseFromAbsolute = absoluteImport.supabase;
  }
} catch (error) {
  console.error('❌ Absolute import failed:', error);
}

export const testSupabaseImports = () => {
  console.log('Available Supabase instances:');
  console.log('From alias:', window.supabaseFromAlias);
  console.log('From relative:', window.supabaseFromRelative);
  console.log('From absolute:', window.supabaseFromAbsolute);
};