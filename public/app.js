let pollChart = null;

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');
  if (tabName === 'poll') loadPoll();
}

// 載入民調並更新 Chart.js
async function loadPoll() {
  const res = await fetch('/api/poll');
  const data = await res.json();
  
  document.getElementById('total-votes').innerText = data.totalVotes;
  const container = document.getElementById('candidates-list');
  container.innerHTML = '';

  const labels = [];
  const votes = [];

  data.candidates.forEach(c => {
    labels.push(c.name);
    votes.push(c.votes);
    const avatar = c.slogan.split(' ')[0].length <= 2 ? c.slogan.split(' ')[0] : '🤖';

    container.innerHTML += `
      <div class="card">
        <div class="card-header">
          <div class="card-avatar">${avatar}</div>
          <h3>${c.name} (${c.percentage}%)</h3>
        </div>
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

  renderChart(labels, votes);
}

// 繪製/更新 Chart.js 圓餅圖
function renderChart(labels, votes) {
  const ctx = document.getElementById('pollChart').getContext('2d');
  
  if (pollChart) pollChart.destroy(); // 避免重複渲染

  pollChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: votes,
        backgroundColor: ['#00f2fe', '#a855f7', '#10b981', '#f43f5e', '#fbbf24'],
        borderColor: '#0b0f19',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f8fafc', font: { family: 'Noto Sans TC' } } }
      }
    }
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
  const avatar = document.querySelector('input[name="avatar"]:checked').value;
  const slogan = `${avatar} ${document.getElementById('reg-slogan').value}`;
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

/* ==========================================
   Canvas 科技感粒子背景動畫邏輯
   ========================================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 1;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.speedY = (Math.random() - 0.5) * 0.8;
    this.color = Math.random() > 0.5 ? '#00f2fe' : '#a855f7';
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

for (let i = 0; i < 50; i++) particles.push(new Particle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// 初始化載入
loadPoll();
