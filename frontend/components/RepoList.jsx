import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Transition } from '@headlessui/react';
import { getEnvVariable } from '../utils/env.js';

const supabase = createClient(
  getEnvVariable('VITE_SUPABASE_URL'),
  getEnvVariable('VITE_SUPABASE_ANON_KEY')
);

// Toast component
function Toast({ show, message, type, onClose }) {
  return (
    <Transition
      show={show}
      enter="transform transition duration-300"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transform transition duration-300"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-2"
      className="fixed bottom-5 right-5 z-50"
    >
      <div
        className={`max-w-sm w-full bg-white shadow-lg rounded-lg flex items-center justify-between ring-1 ring-black ring-opacity-5 border-l-4 ${
          type === 'success' ? 'border-green-500' : 'border-red-500'
        }`}
      >
        <div className={`px-4 py-3 text-sm ${type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
          {message}
        </div>
        <button onClick={onClose} className="p-2 focus:outline-none text-gray-500 hover:text-black">
          ✕
        </button>
      </div>
    </Transition>
  );
}

export default function RepoList({ token }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deployingRepoId, setDeployingRepoId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deployStatuses, setDeployStatuses] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch repos');
        return res.json();
      })
      .then((data) => {
        setRepos(data);
      })
      .catch((err) => {
        setError(err.message);
        showToast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    async function fetchDeployStatuses() {
      try {
        const { data, error } = await supabase.from('deployments').select('*');
        if (error) {
          setError('Failed to fetch deployment statuses');
          showToast('Failed to fetch deploy statuses', 'error');
          return;
        }
        const statusMap = {};
        data.forEach((item) => {
          statusMap[item.repo_name] = item;
        });
        setDeployStatuses(statusMap);
      } catch (err) {
        setError(err.message);
        showToast(err.message, 'error');
      }
    }

    fetchDeployStatuses();
  }, []);

  const handleDeploy = async (repo) => {
    setDeployingRepoId(repo.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo.owner.login,
          repo: repo.name,
          ref: 'main',
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Deployment triggered for ${repo.full_name}`);
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setDeployingRepoId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const base = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status?.toLowerCase()) {
      case 'success':
        return <span className={`${base} bg-green-100 text-green-800`}>✅ Success</span>;
      case 'failed':
        return <span className={`${base} bg-red-100 text-red-800`}>❌ Failed</span>;
      case 'building':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>🔧 Building</span>;
      case 'queued':
        return <span className={`${base} bg-gray-200 text-gray-800`}>⏳ Queued</span>;
      default:
        return <span className={`${base} bg-gray-100 text-gray-500`}>❔ Unknown</span>;
    }
  };

  return (
    <div className="relative">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <h2 className="text-2xl font-semibold mb-4">Your GitHub Repositories</h2>

      {loading ? (
        <p className="text-sm text-gray-500 animate-pulse">Loading repositories...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : repos.length === 0 ? (
        <p>No repositories found.</p>
      ) : (
        <ul className="space-y-3">
          {repos.map((repo) => {
            const status = deployStatuses[repo.full_name]?.status || 'Unknown';
            const previewUrl = deployStatuses[repo.full_name]?.preview_url || null;
            return (
              <li
                key={repo.id}
                className="p-4 bg-white rounded shadow flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div className="mb-2 sm:mb-0">
                  <div className="font-semibold text-gray-800">{repo.full_name}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    {renderStatusBadge(status)}
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline ml-2"
                      >
                        🌐 Preview
                      </a>
                    )}
                  </div>
                </div>
                <button
                  disabled={deployingRepoId === repo.id}
                  onClick={() => handleDeploy(repo)}
                  className={`px-4 py-2 text-sm font-medium rounded ${
                    deployingRepoId === repo.id
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {deployingRepoId === repo.id ? 'Deploying...' : 'Deploy'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
