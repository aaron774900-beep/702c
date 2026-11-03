function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
  if (tabName === 'poll') loadPoll();
}

// 載入即時民調
async function loadPoll() {
  const res = await fetch('/api/poll');
  const data = await res.json();
  
  document.getElementById('total-votes').innerText = data.totalVotes;
  const container = document.getElementById('candidates-list');
  container.innerHTML = '';

  data.candidates.forEach(c => {
    container.innerHTML += `
      <div class="card">
        <h3>${c.name} (${c.percentage}%)</h3>
        <p><strong>口號：</strong> ${c.slogan}</p>
        <p><strong>政見：</strong> ${c.platform}</p>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${c.percentage}%"></div>
        </div>
        <p>得票數：${c.votes} 票</p>
        <button onclick="vote(${c.id})">投他一票</button>
      </div>
    `;
  });
}

// 投票
async function vote(candidateId) {
  const res = await fetch('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidate_id: candidateId })
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadPoll();
}

// 登記候選人
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const slogan = document.getElementById('reg-slogan').value;
  const platform = document.getElementById('reg-platform').value;

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, slogan, platform })
  });
  const data = await res.json();
  alert(data.message || data.error);
  e.target.reset();
});

// 管理員載入待審核列表
async function loadPending() {
  const password = document.getElementById('admin-pass').value;
  const res = await fetch('/api/admin/pending', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  
  if (data.error) return alert(data.error);

  const container = document.getElementById('pending-list');
  container.innerHTML = '';

  data.pending.forEach(c => {
    container.innerHTML += `
      <div class="card">
        <h3>${c.name}</h3>
        <p><strong>口號：</strong> ${c.slogan}</p>
        <p><strong>政見：</strong> ${c.platform}</p>
        <button class="btn-approve" onclick="review(${c.id}, 'approve')">通過審核</button>
        <button class="btn-reject" onclick="review(${c.id}, 'reject')">拒絕</button>
      </div>
    `;
  });
}

// 管理員審核動作
async function review(candidateId, action) {
  const password = document.getElementById('admin-pass').value;
  const res = await fetch('/api/admin/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, candidate_id: candidateId, action })
  });
  const data = await res.json();
  alert(data.message || data.error);
  loadPending();
}

// 預設載入民調
loadPoll();
