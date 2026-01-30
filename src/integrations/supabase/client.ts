// Stub Supabase client - returns empty data from localStorage
// This prevents import errors while we migrate away from Supabase

const createStubClient = () => {
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
        limit: (count: number) => Promise.resolve({ data: [], error: null }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      }),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
      }),
      upsert: (data: any) => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Use localStorage auth') }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Use localStorage auth') }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => { } } },
      }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: new Error('Use localStorage') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => { } }),
    }),
    removeChannel: () => { },
  };
};

export const supabase = createStubClient();