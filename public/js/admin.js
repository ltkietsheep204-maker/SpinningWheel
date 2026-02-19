// ========================
// ADMIN PAGE LOGIC v2
// ========================

let allQuestions = [];

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Handle URL hash for direct tab access
if (window.location.hash === '#qr') {
  document.querySelector('[data-tab="qr"]')?.click();
}

// ---- Load questions ----
async function loadQuestions() {
  try {
    const res = await fetch('/api/questions');
    allQuestions = await res.json();
    // Update stats
    const tc = document.getElementById('totalCount');
    const ac = document.getElementById('activeCount');
    if (tc) tc.textContent = allQuestions.length;
    if (ac) ac.textContent = allQuestions.length;
    renderQuestions(allQuestions);
  } catch (err) {
    const el = document.getElementById('questionList');
    if (el) el.innerHTML = '<p style="color:#F44336;text-align:center;padding:20px">⚠️ Lỗi tải câu hỏi. Hãy đảm bảo server đang chạy.</p>';
  }
}

// ---- Render question list ----
function renderQuestions(questions) {
  const container = document.getElementById('questionList');
  if (!container) return;
  if (questions.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">Không có câu hỏi nào phù hợp.</p>';
    return;
  }
  const labels = ['A','B','C','D'];
  container.innerHTML = questions.map(q => `
    <div class="q-item">
      <div class="q-text">
        <span class="q-num">#${q.id}</span>
        ${escapeHtml(q.question)}
      </div>
      <div class="q-opts">
        ${q.options.map((opt, i) => `
          <div class="${i === q.answer ? 'correct-opt' : ''}">
            ${labels[i]}. ${escapeHtml(opt)} ${i === q.answer ? '✅' : ''}
          </div>
        `).join('')}
      </div>
      <div class="q-actions">
        <button class="btn btn-primary btn-sm" onclick="openEditModal(${q.id})">✏️ Sửa</button>
        <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${q.id})">🗑️ Xóa</button>
      </div>
    </div>
  `).join('');
}

// ---- Filter/Search ----
function filterQuestions() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filtered = allQuestions.filter(q =>
    q.question.toLowerCase().includes(query) ||
    q.options.some(o => o.toLowerCase().includes(query))
  );
  renderQuestions(filtered);
}

document.getElementById('searchInput')?.addEventListener('input', filterQuestions);

// ---- Add question ----
async function addQuestion(e) {
  e.preventDefault();
  const data = {
    question: document.getElementById('addQuestion').value,
    options: [
      document.getElementById('addOpt0').value,
      document.getElementById('addOpt1').value,
      document.getElementById('addOpt2').value,
      document.getElementById('addOpt3').value,
    ],
    answer: parseInt(document.getElementById('addAnswer').value)
  };
  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast('✅ Đã thêm câu hỏi thành công!', 'success');
      document.getElementById('addForm').reset();
      loadQuestions();
    }
  } catch (err) {
    showToast('❌ Lỗi khi thêm câu hỏi!', 'error');
  }
}

// ---- Delete question ----
async function deleteQuestion(id) {
  if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
  try {
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    showToast('🗑️ Đã xóa câu hỏi!', 'success');
    loadQuestions();
  } catch (err) {
    showToast('❌ Lỗi khi xóa!', 'error');
  }
}

// ---- Edit modal ----
function openEditModal(id) {
  const q = allQuestions.find(q => q.id === id);
  if (!q) return;
  document.getElementById('editId').value = q.id;
  document.getElementById('editQuestion').value = q.question;
  document.getElementById('editOpt0').value = q.options[0];
  document.getElementById('editOpt1').value = q.options[1];
  document.getElementById('editOpt2').value = q.options[2];
  document.getElementById('editOpt3').value = q.options[3];
  document.getElementById('editAnswer').value = q.answer;
  document.getElementById('editModal').classList.add('show');
}

function closeModal() {
  document.getElementById('editModal').classList.remove('show');
}

async function saveEdit() {
  const id = parseInt(document.getElementById('editId').value);
  const data = {
    question: document.getElementById('editQuestion').value,
    options: [
      document.getElementById('editOpt0').value,
      document.getElementById('editOpt1').value,
      document.getElementById('editOpt2').value,
      document.getElementById('editOpt3').value,
    ],
    answer: parseInt(document.getElementById('editAnswer').value)
  };
  try {
    await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showToast('💾 Đã cập nhật câu hỏi!', 'success');
    closeModal();
    loadQuestions();
  } catch (err) {
    showToast('❌ Lỗi khi cập nhật!', 'error');
  }
}

// Close modal on backdrop click
document.getElementById('editModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ---- Generate QR ----
async function generateQR() {
  const urlInput = document.getElementById('qrUrl');
  const display = document.getElementById('qrDisplay');
  if (!display) return;

  try {
    const baseUrl = urlInput ? urlInput.value.trim() : '';
    const apiUrl = baseUrl ? `/api/qr/generate?baseUrl=${encodeURIComponent(baseUrl)}` : '/api/qr/generate';
    const res = await fetch(apiUrl);
    const data = await res.json();

    display.innerHTML = `
      <img src="${data.qrDataUrl}" alt="QR Code" />
      <div class="qr-url-box">🔗 ${data.quizUrl}</div>
      <button onclick="downloadQR('${data.qrDataUrl}')" class="btn btn-primary" style="margin-top:16px">⬇️ Tải Về</button>
    `;
    showToast('📱 Đã tạo mã QR!', 'success');
  } catch (err) {
    showToast('❌ Lỗi khi tạo QR!', 'error');
  }
}

function downloadQR(src) {
  const link = document.createElement('a');
  link.download = 'DaiVietSuKy_QR.png';
  link.href = src;
  link.click();
}

// ---- Toast notification ----
function showToast(message, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Init
loadQuestions();