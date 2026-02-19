const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load questions
const questionsPath = path.join(__dirname, 'data', 'questions.json');

function loadQuestions() {
  const data = fs.readFileSync(questionsPath, 'utf8');
  return JSON.parse(data);
}

function saveQuestions(questions) {
  fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
}

// ==================== API Routes ====================

// Simple Admin Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  // Hardcoded password for simplicity as per request
  if (password === 'admin123') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Get all questions (admin)
app.get('/api/questions', (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// Add a new question (admin)
app.post('/api/questions', (req, res) => {
  const questions = loadQuestions();
  const newQuestion = {
    id: questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1,
    question: req.body.question,
    options: req.body.options,
    answer: req.body.answer
  };
  questions.push(newQuestion);
  saveQuestions(questions);
  res.json({ success: true, question: newQuestion });
});

// Delete a question (admin)
app.delete('/api/questions/:id', (req, res) => {
  let questions = loadQuestions();
  const id = parseInt(req.params.id);
  questions = questions.filter(q => q.id !== id);
  saveQuestions(questions);
  res.json({ success: true });
});

// Update a question (admin)
app.put('/api/questions/:id', (req, res) => {
  const questions = loadQuestions();
  const id = parseInt(req.params.id);
  const idx = questions.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  questions[idx] = { ...questions[idx], ...req.body, id };
  saveQuestions(questions);
  res.json({ success: true, question: questions[idx] });
});

// Get a random question for quiz
app.get('/api/quiz/random', (req, res) => {
  const questions = loadQuestions();
  if (questions.length === 0) return res.status(404).json({ error: 'No questions' });
  const randomIndex = Math.floor(Math.random() * questions.length);
  const q = questions[randomIndex];
  // Don't send the answer to client
  res.json({
    id: q.id,
    question: q.question,
    options: q.options
  });
});

// Check answer
app.post('/api/quiz/check', (req, res) => {
  const { questionId, selectedAnswer } = req.body;
  const questions = loadQuestions();
  const q = questions.find(q => q.id === questionId);
  if (!q) return res.status(404).json({ error: 'Question not found' });
  const correct = q.answer === selectedAnswer;
  res.json({
    correct,
    correctAnswer: q.answer,
    correctText: q.options[q.answer]
  });
});

// Generate QR code
app.get('/api/qr/generate', async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl || `${req.protocol}://${req.get('host')}`;
    const quizUrl = `${baseUrl}/quiz.html`;
    const qrDataUrl = await QRCode.toDataURL(quizUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#8B0000',
        light: '#FFF8DC'
      }
    });
    res.json({ qrDataUrl, quizUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate QR code as image
app.get('/api/qr/image', async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl || `${req.protocol}://${req.get('host')}`;
    const quizUrl = `${baseUrl}/quiz.html`;
    res.setHeader('Content-Type', 'image/png');
    await QRCode.toFileStream(res, quizUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#8B0000',
        light: '#FFF8DC'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏯 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📋 Trang Admin: http://localhost:${PORT}/admin.html`);
  console.log(`❓ Trang Quiz: http://localhost:${PORT}/quiz.html`);
});
