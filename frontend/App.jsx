import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import GitHubLoginButton from './components/GitHubLoginButton.jsx';
import RepoList from './components/RepoList.jsx';
import { getEnvVariable } from './utils/env.js';

const supabase = createClient(getEnvVariable('VITE_SUPABASE_URL'), getEnvVariable('VITE_SUPABASE_ANON_KEY'));

function App() {
  const [session, setSession] = useState(null);
  const [userId, setUserId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        setUserId(data.session.user.id);
        setAccessToken(data.session.provider_token || null);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setUserId(session.user.id);
        setAccessToken(session.provider_token || null);
      } else {
        setUserId(null);
        setAccessToken(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-4">PushDeploy Dashboard</h1>
      {!session ? (
        <GitHubLoginButton onLogin={signInWithGitHub} />
      ) : (
        <>
          <p className="mb-4">Logged in as: {userId}</p>
          <RepoList token={accessToken} />
          <button
            onClick={signOut}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;