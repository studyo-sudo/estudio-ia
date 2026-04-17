const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { port } = require('./config');
const {
  getUserByEmail,
  registerUser,
  setUserPhoneVerification,
  validateCredentials,
} = require('./authStore');
const { createToken, verifyToken } = require('./token');
const {
  analyzeAudioBuffer,
  analyzeImageBuffer,
  analyzeTextFile,
  buildExamModelAnalysis,
  buildProblemSolution,
  buildStudyAnalysis,
  createTutorReply,
  solveProblemImage,
} = require('./analysis');
const {
  ensureStorageReady,
  mergeHistoryItems,
  readUserState,
  writeUserState,
} = require('./storage');

const app = express();
const CREDIT_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UPLOAD_SIZE_MB = 35;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json({ limit: `${MAX_UPLOAD_SIZE_MB + 10}mb` }));

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

function createCreditGrant(amount) {
  const now = Date.now();
  return {
    id: `grant-${now}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    remaining: amount,
    purchasedAt: now,
    expiresAt: now + CREDIT_EXPIRATION_MS,
  };
}

async function buildAuthProfile(email) {
  const [user, userState] = await Promise.all([
    getUserByEmail(email),
    readUserState(email),
  ]);

  return {
    email,
    plan: userState.billing.plan,
    phoneNumber: user?.phoneNumber ?? null,
    phoneVerified: Boolean(user?.phoneVerifiedAt),
  };
}

async function analyzeStudyFilePayload(buffer, fileName, mimeType) {
  const normalizedName = String(fileName || 'archivo').toLowerCase();
  const normalizedMimeType = String(mimeType || '').toLowerCase();
  const looksLikeText =
    normalizedMimeType.startsWith('text/') ||
    normalizedMimeType.includes('json') ||
    normalizedMimeType.includes('xml') ||
    normalizedMimeType.includes('html') ||
    normalizedName.endsWith('.txt') ||
    normalizedName.endsWith('.md') ||
    normalizedName.endsWith('.csv') ||
    normalizedName.endsWith('.json') ||
    normalizedName.endsWith('.xml') ||
    normalizedName.endsWith('.html') ||
    normalizedName.endsWith('.pdf');

  if (looksLikeText && buffer?.length) {
    return analyzeTextFile(buffer, fileName);
  }

  return buildStudyAnalysis('file', fileName);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  validateCredentials(email, password)
    .then(async (user) => {
      if (!user) {
        res.status(401).send('Invalid credentials');
        return;
      }

      res.json({
        token: createToken(user.email),
        ...(await buildAuthProfile(user.email)),
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
    .then(async (user) => {
      res.status(201).json({
        token: createToken(user.email),
        ...(await buildAuthProfile(user.email)),
      });
    })
    .catch((error) => {
      res.status(400).json({ error: error.message || 'Register failed' });
  });
});

app.get('/auth/me', requireAuth, async (req, res) => {
  res.json(await buildAuthProfile(req.auth.email));
});

app.post('/auth/phone/verify', requireAuth, async (req, res) => {
  const { phoneNumber } = req.body || {};

  try {
    await setUserPhoneVerification(req.auth.email, phoneNumber);
    res.json(await buildAuthProfile(req.auth.email));
  } catch (error) {
    res.status(400).json({ error: error.message || 'Phone verification failed' });
  }
});

app.post('/tutor/chat', async (req, res) => {
  const { threadTitle, question, messages } = req.body || {};
  const normalizedQuestion = String(question || '').trim();

  if (!normalizedQuestion) {
    res.status(400).json({ error: 'question es obligatorio' });
    return;
  }

  try {
    const reply = await createTutorReply({
      threadTitle: String(threadTitle || 'Nuevo chat'),
      question: normalizedQuestion,
      messages: Array.isArray(messages) ? messages : [],
    });

    res.json(reply);
  } catch (error) {
    console.error('Error generando respuesta del tutor:', error);
    res.json({
      reply: 'Puedo ayudarte con eso, pero ahora mismo no pude generar una respuesta detallada.',
      suggestedTitle: normalizedQuestion.slice(0, 42) || 'Tutor',
    });
  }
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
  const nextCreditGrants =
    Number.isFinite(credits) && Number(credits) > 0
      ? [createCreditGrant(Math.floor(Number(credits)))]
      : [];
  const nextBilling = {
    plan: plan === 'premium' ? 'premium' : 'free',
    credits:
      Number.isFinite(credits) && Number(credits) >= 0
        ? nextCreditGrants.reduce((total, grant) => total + grant.remaining, 0)
        : current.billing.credits,
    creditGrants:
      Number.isFinite(credits) && Number(credits) >= 0
        ? nextCreditGrants
        : current.billing.creditGrants,
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
  const validAmount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
  const nextBilling = {
    ...current.billing,
    creditGrants:
      validAmount > 0
        ? [...current.billing.creditGrants, createCreditGrant(validAmount)]
        : current.billing.creditGrants,
  };

  nextBilling.credits = nextBilling.creditGrants.reduce(
    (total, grant) => total + grant.remaining,
    0
  );

  await writeUserState(req.auth.email, {
    ...current,
    billing: nextBilling,
  });

  res.json(nextBilling);
});

app.post('/billing/credits/consume', requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  const current = await readUserState(req.auth.email);
  const validAmount = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;

  if (current.billing.credits < validAmount) {
    res.json({
      success: false,
      billing: current.billing,
    });
    return;
  }

  const nextBilling = {
    ...current.billing,
    creditGrants: current.billing.creditGrants.map((grant) => ({ ...grant })),
  };

  let remainingToConsume = validAmount;
  nextBilling.creditGrants = nextBilling.creditGrants.map((grant) => {
    if (remainingToConsume <= 0) {
      return grant;
    }

    const spend = Math.min(grant.remaining, remainingToConsume);
    remainingToConsume -= spend;

    return {
      ...grant,
      remaining: grant.remaining - spend,
    };
  });
  nextBilling.credits = nextBilling.creditGrants.reduce(
    (total, grant) => total + grant.remaining,
    0
  );

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
    if (req.file?.buffer) {
      res.json(await analyzeStudyFilePayload(req.file.buffer, fileName, req.file.mimetype));
      return;
    }
  } catch (error) {
    console.error('Error analizando archivo con OpenAI:', error);
  }

  res.json(buildStudyAnalysis('file', fileName));
});

app.post('/analyze-file-inline', async (req, res) => {
  const { fileName, mimeType, base64 } = req.body || {};

  if (!fileName || !base64 || typeof base64 !== 'string') {
    res.status(400).json({ error: 'fileName y base64 son obligatorios' });
    return;
  }

  try {
    const buffer = Buffer.from(base64, 'base64');
    res.json(await analyzeStudyFilePayload(buffer, String(fileName), String(mimeType || '')));
  } catch (error) {
    console.error('Error analizando archivo inline con OpenAI:', error);
    res.json(buildStudyAnalysis('file', String(fileName || 'archivo')));
  }
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

app.post('/analyze-problem', upload.single('image'), async (req, res) => {
  const fileName = req.file?.originalname || 'problema';
  const description = String(req.body?.description || '').trim();

  try {
    if (req.file?.buffer) {
      res.json(
        await solveProblemImage(req.file.buffer, req.file.mimetype, fileName, description)
      );
      return;
    }
  } catch (error) {
    console.error('Error resolviendo problema con OpenAI:', error);
  }

  res.json(buildProblemSolution(fileName, description));
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
