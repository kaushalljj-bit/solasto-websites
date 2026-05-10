const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const VALID_ROLES = [
  'ABAP Lead Developer',
  'Technical Project Manager',
  'BRIM / RAR Consultant',
  'FICO Functional Consultant',
  'SAP Integration Architect',
  'Other / Speculative Application',
];
const VALID_EXP = ['1-3', '3-5', '5-8', '8-12', '12+'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      phone       TEXT,
      linkedin    TEXT,
      role        TEXT NOT NULL,
      experience  TEXT NOT NULL,
      location    TEXT,
      message     TEXT NOT NULL,
      applied_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function validate(body) {
  const errors = {};
  const { name, email, role, experience, message } = body || {};

  if (!name || name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
  if (!email || !EMAIL_RE.test(email.trim())) errors.email = 'Please enter a valid email address.';
  if (!role || !VALID_ROLES.includes(role)) errors.role = 'Please select a role.';
  if (!experience || !VALID_EXP.includes(experience)) errors.experience = 'Please select your experience level.';
  if (!message || message.trim().length < 20) errors.message = 'Please write at least 20 characters in your cover note.';

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

  const { name, email, phone, linkedin, role, experience, location, message } = req.body;
  const client = await pool.connect();

  try {
    await ensureTable(client);
    await client.query(
      `INSERT INTO applications (name, email, phone, linkedin, role, experience, location, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        linkedin ? linkedin.trim() : null,
        role,
        experience,
        location ? location.trim() : null,
        message.trim(),
      ]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-application error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  } finally {
    client.release();
  }
};
