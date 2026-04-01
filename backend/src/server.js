const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { port } = require('./config');
const { registerUser, validateCredentials } = require('./authStore');
const { createToken, verifyToken } = require('./token');
const {
  analyzeAudioBuffer,
  analyzeImageBuffer,
  analyzeTextFile,
  buildExamModelAnalysis,
  buildStudyAnalysis,
} = require('./analysis');
const {
  ensureStorageReady,
  mergeHistoryItems,
  readUserState,
  writeUserState,
} = require('./storage');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function getBearerToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const [scheme, token] = headerValue.split(' ');
  return scheme === 'Bearer' ? token : null;
}

function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);
  const payload = verifyToken(token);

  if (!payload?.email) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.auth = payload;
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  validateCredentials(email, password)
    .then((user) => {
      if (!user) {
        res.status(401).send('Invalid credentials');
        return;
      }

      res.json({
        token: createToken(user.email),
      });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message || 'Auth failed' });
    });
});

app.post('/auth/register', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password || String(password).length < 6) {
    res.status(400).json({ error: 'Email and password (min 6 chars) are required' });
    return;
  }

  registerUser(email, password)
    .then((user) => {
      res.status(201).json({
        token: createToken(user.email),
      });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message || 'Register failed' });
    });
});

app.get('/auth/me', requireAuth, async (req, res) => {
  res.json({
    email: req.auth.email,
  });
});

app.post('/history/sync/push', requireAuth, async (req, res) => {
  const { items } = req.body || {};
  const userEmail = req.auth.email;
  const current = await readUserState(userEmail);
  const nextHistory = mergeHistoryItems(current.history, Array.isArray(items) ? items : []);

  await writeUserState(userEmail, {
    ...current,
    history: nextHistory,
  });

  res.json({ synced: nextHistory.length });
});

app.get('/history/sync/pull', requireAuth, async (req, res) => {
  const current = await readUserState(req.auth.email);
  res.json({ items: current.history });
});

app.get('/billing/state', requireAuth, async (req, res) => {
  const current = await readUserState(req.auth.email);
  res.json(current.billing);
});

app.post('/billing/state', requireAuth, async (req, res) => {
  const { plan, credits } = req.body || {};
  const current = await readUserState(req.auth.email);
  const nextBilling = {
    plan: plan === 'premium' ? 'premium' : 'free',
    credits: Number.isFinite(credits) ? Math.max(0, Number(credits)) : current.billing.credits,
  };

  await writeUserState(req.auth.email, {
    ...current,
    billing: nextBilling,
  });

  res.json(nextBilling);
});

app.post('/billing/credits/add', requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  const current = await readUserState(req.auth.email);
  const nextBilling = {
    ...current.billing,
    credits: current.billing.credits + (Number.isFinite(amount) && amount > 0 ? amount : 0),
  };

  await writeUserState(req.auth.email, {
    ...current,
    billing: nextBilling,
  });

  res.json(nextBilling);
});

app.post('/billing/credits/consume', requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  const current = await readUserState(req.auth.email);
  const validAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;

  if (current.billing.credits < validAmount) {
    res.json({
      success: false,
      billing: current.billing,
    });
    return;
  }

  const nextBilling = {
    ...current.billing,
    credits: current.billing.credits - validAmount,
  };

  await writeUserState(req.auth.email, {
    ...current,
    billing: nextBilling,
  });

  res.json({
    success: true,
    billing: nextBilling,
  });
});

app.post('/analyze-file', upload.single('file'), async (req, res) => {
  const fileName = req.file?.originalname || 'archivo';

  try {
    const mimeType = String(req.file?.mimetype || '');
    const isTextFile =
      mimeType.startsWith('text/') || fileName.toLowerCase().endsWith('.txt');

    if (isTextFile && req.file?.buffer) {
      res.json(await analyzeTextFile(req.file.buffer, fileName));
      return;
    }
  } catch (error) {
    console.error('Error analizando archivo con OpenAI:', error);
  }

  res.json(buildStudyAnalysis('file', fileName));
});

app.post('/analyze-image', upload.single('image'), async (req, res) => {
  const fileName = req.file?.originalname || 'imagen';

  try {
    if (req.file?.buffer) {
      res.json(await analyzeImageBuffer(req.file.buffer, req.file.mimetype, fileName));
      return;
    }
  } catch (error) {
    console.error('Error analizando imagen con OpenAI:', error);
  }

  res.json(buildStudyAnalysis('image', fileName));
});

app.post('/analyze-audio', upload.single('audio'), async (req, res) => {
  const fileName = req.file?.originalname || 'audio';

  try {
    if (req.file?.buffer) {
      res.json(await analyzeAudioBuffer(req.file.buffer, req.file.mimetype, fileName));
      return;
    }
  } catch (error) {
    console.error('Error analizando audio con OpenAI:', error);
  }

  res.json(buildStudyAnalysis('audio', fileName));
});

app.post('/analyze-exam-model', upload.array('images'), (req, res) => {
  const fileNames = Array.isArray(req.files)
    ? req.files.map((file) => file.originalname || 'imagen')
    : [];

  res.json(buildExamModelAnalysis(fileNames));
});

ensureStorageReady()
  .then(() => {
    app.listen(port, () => {
      console.log(`Studyo Ai backend listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start backend:', error);
    process.exit(1);
  });
