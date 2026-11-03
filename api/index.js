const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 請替換為你的 Supabase URL 與 Key（部署時建議使用 Vercel 環境變數）
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // 管理員密碼

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 取得 approved 候選人與即時民調 %
app.get('/api/poll', async (req, res) => {
  try {
    const { data: candidates, error: cErr } = await supabase
      .from('candidates')
      .select('*')
      .eq('status', 'approved');

    const { data: votes, error: vErr } = await supabase
      .from('votes')
      .select('candidate_id');

    if (cErr || vErr) return res.status(500).json({ error: cErr || vErr });

    const totalVotes = votes.length;
    const voteCounts = {};
    votes.forEach(v => {
      voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1;
    });

    const result = candidates.map(c => {
      const count = voteCounts[c.id] || 0;
      const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
      return { ...c, votes: count, percentage: Number(percentage) };
    });

    res.json({ totalVotes, candidates: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登記候選人 (待審核)
app.post('/api/register', async (req, res) => {
  const { name, slogan, platform } = req.body;
  if (!name || !slogan || !platform) {
    return res.status(400).json({ error: '請填寫所有欄位' });
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert([{ name, slogan, platform, status: 'pending' }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: '登記成功，等待管理員審核中！' });
});

// 進行投票
app.post('/api/vote', async (req, res) => {
  const { candidate_id } = req.body;
  const voter_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const { data, error } = await supabase
    .from('votes')
    .insert([{ candidate_id, voter_ip }]);

  if (error) {
    if (error.code === '23505') { // UNIQUE 違規
      return res.status(400).json({ error: '您已經投過票囉！' });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: '投票成功！' });
});

// 管理員：取得待審核清單
app.post('/api/admin/pending', async (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: '密碼錯誤' });

  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('status', 'pending');

  if (error) return res.status(500).json({ error: error.message });
  res.json({ pending: data });
});

// 管理員：審核 (approve / reject)
app.post('/api/admin/review', async (req, res) => {
  const { password, candidate_id, action } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: '密碼錯誤' });

  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', candidate_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: `已成功${action === 'approve' ? '通過' : '拒絕'}` });
});

module.exports = app;
