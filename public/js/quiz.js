// REBUILT QUIZ LOGIC
let currentQuestion = null;
let selectedOption = null;
let answered = false;

// UI References
const dom = {
    loading: 'loading',
    content: 'questionContent',
    text: 'qText',
    grid: 'optGrid',
    submit: 'submitBtn',
    quiz: 'quizSection',
    wheel: 'wheelSection'
};

function getEl(id) {
    return document.getElementById(id);
}

// Safer escape method since complex HTML is injected
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

async function loadRandomQuestion() {
    selectedOption = null;
    answered = false;
    
    const ld = getEl(dom.loading);
    const ct = getEl(dom.content);
    const sBtn = getEl(dom.submit);
    
    // Reset UI
    if(ld) ld.classList.remove('hidden');
    if(ct) ct.classList.add('hidden');
    if(sBtn) sBtn.style.display = 'none';

    try {
        const res = await fetch('/api/quiz/random');
        if(!res.ok) throw new Error('API Error');
        currentQuestion = await res.json();
        renderQuestion();
    } catch (err) {
        console.error(err);
        if(ld) ld.innerHTML = '<span style="color:#e74c3c">Không thể tải câu hỏi. Vui lòng thử lại!</span>';
    }
}

function renderQuestion() {
    const ld = getEl(dom.loading);
    const ct = getEl(dom.content);
    if(ld) ld.classList.add('hidden');
    if(ct) ct.classList.remove('hidden');
    
    getEl(dom.text).textContent = currentQuestion.question;
    
    const mapping = ['A','B','C','D'];
    const grid = getEl(dom.grid);
    grid.innerHTML = ''; // Clear old

    currentQuestion.options.forEach((opt, i) => {
        const btn = document.createElement('div');
        btn.className = 'option-btn';
        btn.onclick = () => selectOption(i);
        
        const key = document.createElement('div');
        key.className = 'opt-key';
        key.textContent = mapping[i];
        
        const span = document.createElement('span');
        span.textContent = opt;

        btn.appendChild(key);
        btn.appendChild(span);
        grid.appendChild(btn);
    });
}

function selectOption(idx) {
    if(answered) return;
    
    selectedOption = idx;
    
    // Update UI selection
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        if(i === idx) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });

    // Enable submit
    const sBtn = getEl(dom.submit);
    if(sBtn) {
        sBtn.style.display = 'inline-block';
        sBtn.disabled = false;
    }
}

async function submitAnswer() {
    if(answered || selectedOption === null) return;
    
    answered = true;
    const sBtn = getEl(dom.submit);
    sBtn.disabled = true;
    sBtn.textContent = 'Đang kiểm tra...';

    try {
        const res = await fetch('/api/quiz/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionId: currentQuestion.id,
                selectedAnswer: selectedOption
            })
        });
        
        const result = await res.json();
        handleResult(result);

    } catch(err) {
        console.error(err);
        alert('Có lỗi xảy ra khi kiểm tra đáp án');
        sBtn.disabled = false;
        answered = false;
    }
}

function handleResult(result) {
    const btns = document.querySelectorAll('.option-btn');
    
    // Highlight correct/wrong
    btns.forEach((btn, i) => {
        if(i === result.correctAnswer) {
            btn.classList.add('correct');
        } else if(i === selectedOption && !result.correct) { 
            btn.classList.add('wrong');
        }
    });

    // Show result popup after delay
    setTimeout(() => {
        showResultPopup(result);
    }, 1000);
}

function showResultPopup(result) {
    const overlay = getEl('resultOverlay');
    const box = getEl('resultBox');
    const icon = getEl('resultIcon');
    const title = getEl('resultTitle');
    const msg = getEl('resultMsg');
    const actBtn = getEl('actionBtn');

    overlay.classList.add('show');
    
    if(result.correct) {
        box.className = 'result-box success';
        icon.textContent = '🎉';
        title.textContent = 'CHÍNH XÁC!';
        msg.textContent = 'Bạn nhận được 1 lượt quay may mắn!';
        actBtn.textContent = 'QUAY THƯỞNG NGAY';
        actBtn.onclick = () => {
            overlay.classList.remove('show');
            switchToWheel();
        };
    } else {
        box.className = 'result-box fail';
        icon.textContent = '😢';
        title.textContent = 'RẤT TIẾC!';
        msg.textContent = `Đáp án đúng là: ${result.correctText}`;
        actBtn.innerHTML = '<i class="fa-solid fa-chess-board"></i> VỀ BÀN CỜ';
        actBtn.onclick = () => {
            window.location.href = 'index.html';
        };
    }
}

function switchToWheel() {
    getEl(dom.quiz).style.display = 'none';
    getEl(dom.wheel).style.display = 'block';
    
    // Initialize wheel
    if(typeof initWheel === 'function') {
        initWheel();
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', loadRandomQuestion);
