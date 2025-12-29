// Updated teacher-service: added POST /badges proxy to badges-service (and GET /badges already exists)
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const STUDENT_SERVICE = process.env.STUDENT_SERVICE || 'http://localhost:3002';
const BADGES_SERVICE = process.env.BADGES_SERVICE || 'http://localhost:3004';
const DATA_DIR = path.join(__dirname, 'data');
const TEACHERS_FILE = path.join(DATA_DIR, 'teachers.json');

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TEACHERS_FILE)) fs.writeFileSync(TEACHERS_FILE, JSON.stringify([], null, 2), 'utf8');
}
function readTeachers() {
  ensureData();
  try {
    return JSON.parse(fs.readFileSync(TEACHERS_FILE, 'utf8'));
  } catch (e) {
    console.error('Failed to read teachers file', e);
    throw e;
  }
}
function writeTeachers(arr) {
  try {
    fs.writeFileSync(TEACHERS_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write teachers file', e);
    throw e;
  }
}
function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

// request logger
app.use((req, res, next) => {
  console.log(`[teacher-service] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Teachers CRUD
app.get('/teachers', (req, res) => {
  try {
    const t = readTeachers();
    res.json(t);
  } catch (e) {
    jsonError(res, 500, 'Could not read teachers');
  }
});

app.post('/teachers', (req, res) => {
  try {
    const { login } = req.body;
    if (!login) return jsonError(res, 400, 'login required');
    const list = readTeachers();
    let t = list.find(x => x.login === login);
    if (!t) {
      t = { login, createdAt: new Date().toISOString() };
      list.push(t);
      writeTeachers(list);
      console.log(`[teacher-service] created teacher ${login}`);
    } else {
      console.log(`[teacher-service] found teacher ${login}`);
    }
    res.json(t);
  } catch (e) {
    jsonError(res, 500, 'Could not create teacher');
  }
});

// Proxy to student-service
app.get('/students', async (req, res) => {
  try {
    const r = await fetch(`${STUDENT_SERVICE}/students`);
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      return res.status(r.status).json(json);
    } catch (_) {
      return res.status(502).json({ error: 'Bad response from student-service', body: text });
    }
  } catch (e) {
    console.error('Error fetching students:', e);
    res.status(502).json({ error: 'Could not reach student-service' });
  }
});

app.post('/students/:login/badges', async (req, res) => {
  const { login } = req.params;
  const { badge } = req.body;
  if (!badge) return jsonError(res, 400, 'badge required');
  try {
    const r = await fetch(`${STUDENT_SERVICE}/students/${encodeURIComponent(login)}/badges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badge })
    });
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      return res.status(r.status).json(json);
    } catch (_) {
      return res.status(502).json({ error: 'Bad response from student-service', body: text });
    }
  } catch (e) {
    console.error('Error adding badge:', e);
    res.status(502).json({ error: 'Could not reach student-service' });
  }
});

// Proxy to badges-service (GET)
app.get('/badges', async (req, res) => {
  try {
    const r = await fetch(`${BADGES_SERVICE}/badges`);
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      return res.status(r.status).json(json);
    } catch (_) {
      return res.status(502).json({ error: 'Bad response from badges-service', body: text });
    }
  } catch (e) {
    console.error('Error fetching badges:', e);
    res.status(502).json({ error: 'Could not reach badges-service' });
  }
});

// Proxy to badges-service (POST create badge)
app.post('/badges', async (req, res) => {
  try {
    const r = await fetch(`${BADGES_SERVICE}/badges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      return res.status(r.status).json(json);
    } catch (_) {
      return res.status(502).json({ error: 'Bad response from badges-service', body: text });
    }
  } catch (e) {
    console.error('Error creating badge:', e);
    res.status(502).json({ error: 'Could not reach badges-service' });
  }
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error in teacher-service:', err);
  if (!res.headersSent) res.status(500).json({ error: 'internal_server_error' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`teacher-service listening on ${PORT}`));