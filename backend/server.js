const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Debug environment variables
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');

// Middleware
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Deploy trigger endpoint
app.post('/deploy', async (req, res) => {
  const { owner, repo, ref = 'main' } = req.body;
  if (!owner || !repo) return res.status(400).json({ error: 'Missing owner or repo' });

  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) return res.status(500).json({ error: 'GitHub token not configured' });

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref }),
      }
    );

    if (response.status === 204) return res.json({ message: 'Deployment triggered successfully' });

    const errorData = await response.json();
    return res.status(response.status).json({ error: errorData.message || 'Failed to trigger deployment' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GitHub Webhook endpoint
app.post('/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signature || !secret) return res.status(401).send('Unauthorized');

  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.body;

  try {
    const repoName = event.repository.full_name;
    const status = event.workflow_run?.conclusion || event.workflow_run?.status;
    const previewUrl = event.workflow_run?.head_branch
      ? `https://${event.workflow_run.head_branch}.pushdeploy.ml`
      : null;

    await supabase.from('deployments').upsert({
      repo_name: repoName,
      status,
      preview_url: previewUrl,
    });

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Error saving deployment status:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
