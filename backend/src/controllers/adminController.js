
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const db = require('../config/db');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

// Validate human names.
// Supports: Rahul Sharma, Dr. Rahul Sharma,
// Anne-Marie Smith, O'Connor, Dr. A. Sharma.
const isValidName = (value) => {
  if (typeof value !== 'string') return false;

  const name = value.trim();

  if (name.length < 2 || name.length > 100) return false;

  // Supports Dr. Rahul Sharma, Dr. A. Sharma,
  // Rahul Sharma, Anne-Marie Smith, O'Connor.
  const nameRegex =
    /^\p{L}[\p{L}\p{M}]*\.?(?:[ '-]\p{L}[\p{L}\p{M}]*\.?)*$/u;

  return nameRegex.test(name);
};

const list = async (_req, res) => {
  const [doctors, patients] = await Promise.all([
    db.query(
      "SELECT id,name,email FROM users WHERE role='DOCTOR' ORDER BY name"
    ),
    db.query(
      "SELECT id,name,email FROM users WHERE role='PATIENT' ORDER BY name"
    ),
  ]);

  const { rows: assignments } = await db.query(`
    SELECT
      a.id,
      a.doctor_id,
      a.patient_id,
      a.assigned_at,
      d.name AS doctor_name,
      p.name AS patient_name
    FROM doctor_patient_assignments a
    JOIN users d ON d.id = a.doctor_id
    JOIN users p ON p.id = a.patient_id
    ORDER BY d.name, p.name
  `);

  sendSuccess(res, {
    doctors: doctors.rows,
    patients: patients.rows,
    assignments,
  });
};

const createDoctor = async (req, res) => {
  const { name, email, password } = req.validated.body;

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Name validation
  if (!isValidName(cleanName)) {
    throw new AppError(
      400,
      'Please enter a valid name.'
    );
  }

  // Password validation
  if (
  !/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password) ||
  Buffer.byteLength(password) > 72
) {
  throw new AppError(
    400,
    'Password must contain uppercase, lowercase, a number and a special character, and be at least 8 characters.'
  );
}

  const hash = await bcrypt.hash(
    password,
    env.bcryptRounds
  );

  try {
    const { rows } = await db.query(
      `INSERT INTO users(name, email, password_hash, role)
       VALUES($1, $2, $3, 'DOCTOR')
       RETURNING id, name, email, role, created_at`,
      [cleanName, cleanEmail, hash]
    );

    sendSuccess(
      res,
      { doctor: rows[0] },
      'Doctor account created.',
      201
    );
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(
        409,
        'An account with this email already exists.'
      );
    }

    throw err;
  }
};

const assign = async (req, res) => {
  const { doctorId, patientId } = req.validated.body;

  if (doctorId === patientId) {
    throw new AppError(
      400,
      'A doctor cannot be assigned as their own patient.'
    );
  }

  const { rows } = await db.query(
    "SELECT id, role FROM users WHERE id=ANY($1::uuid[])",
    [[doctorId, patientId]]
  );

  if (
    rows.length !== 2 ||
    !rows.some((u) => u.id === doctorId && u.role === 'DOCTOR') ||
    !rows.some((u) => u.id === patientId && u.role === 'PATIENT')
  ) {
    throw new AppError(
      400,
      'Choose one doctor and one patient account.'
    );
  }

  try {
    const result = await db.query(
      `INSERT INTO doctor_patient_assignments(doctor_id, patient_id)
       VALUES($1, $2)
       RETURNING id, doctor_id, patient_id, assigned_at`,
      [doctorId, patientId]
    );

    sendSuccess(
      res,
      { assignment: result.rows[0] },
      'Patient assigned.',
      201
    );
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(
        409,
        'This patient is already assigned to this doctor.'
      );
    }

    throw err;
  }
};

const unassign = async (req, res) => {
  const { rowCount } = await db.query(
    'DELETE FROM doctor_patient_assignments WHERE id=$1',
    [req.validated.params.assignmentId]
  );

  if (!rowCount) {
    throw new AppError(404, 'Assignment not found.');
  }

  sendSuccess(res, {}, 'Assignment removed.');
};

module.exports = {
  list,
  createDoctor,
  assign,
  unassign,
};
