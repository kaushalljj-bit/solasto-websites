const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const VALID_TIMES = ['morning', 'afternoon', 'evening', 'anytime'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      company     TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function validate(body) {
  const errors = {};
  const { name, email, company, preferredTime } = body || {};

  if (!name || name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid work email.';
  if (!company || company.trim().length < 2) errors.company = 'Company name must be at least 2 characters.';
  if (!preferredTime || !VALID_TIMES.includes(preferredTime)) errors.preferredTime = 'Please select a preferred contact time.';

  return errors;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const errors = validate(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ errors });
  }

  const { name, email, company, preferredTime } = req.body;
  const client = await pool.connect();

  try {
    await ensureTable(client);
    await client.query(
      'INSERT INTO leads (name, email, company, preferred_time) VALUES ($1, $2, $3, $4)',
      [name.trim(), email.trim().toLowerCase(), company.trim(), preferredTime]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-lead error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  } finally {
    client.release();
  }
};
