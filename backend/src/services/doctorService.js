const db = require('../config/db');
const AppError = require('../utils/AppError');
const { withInterpretation } = require('./glucoseInterpretation');
const { SLOT_ORDER_SQL } = require('../utils/constants');
const { classify } = require('./glucoseInterpretation');

async function assertAssigned(doctorId, patientId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email FROM doctor_patient_assignments a
     JOIN users u ON u.id = a.patient_id AND u.role = 'PATIENT'
     WHERE a.doctor_id = $1 AND a.patient_id = $2`, [doctorId, patientId]
  );
  if (!rows[0]) throw new AppError(404, 'Patient not found.');
  return rows[0];
}

async function listPatients(doctorId, { page = 1, limit = 20, search = '' } = {}) {
  const params = [doctorId];
  let condition = '';
  if (search) { params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`); condition = `AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }
  const offset = params.length + 1; params.push(limit); params.push((page - 1) * limit);
  const [count, result] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS total FROM doctor_patient_assignments a JOIN users u ON u.id=a.patient_id AND u.role='PATIENT' WHERE a.doctor_id=$1 ${condition}`, search ? [doctorId, params[1]] : [doctorId]),
    db.query(`SELECT u.id,u.name,u.email,a.assigned_at,r.glucose_value AS latest_glucose,r.reading_date AS latest_date,r.time_slot AS latest_slot
      FROM doctor_patient_assignments a JOIN users u ON u.id=a.patient_id AND u.role='PATIENT'
      LEFT JOIN LATERAL (SELECT glucose_value,reading_date,time_slot FROM glucose_readings WHERE user_id=u.id ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} DESC LIMIT 1) r ON true
      WHERE a.doctor_id=$1 ${condition} ORDER BY u.name LIMIT $${offset} OFFSET $${offset+1}`, params),
  ]);
  return { patients: result.rows.map((patient) => ({ ...patient, interpretation: patient.latest_glucose === null ? null : classify({ glucose_value: patient.latest_glucose, time_slot: patient.latest_slot }) })), pagination: { page, limit, total: count.rows[0].total, totalPages: Math.max(1, Math.ceil(count.rows[0].total / limit)) } };
}

async function patientReadings(doctorId, patientId, { page, limit }) {
  const patient = await assertAssigned(doctorId, patientId);
  const offset = (page - 1) * limit;
  const [count, rows] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS total FROM glucose_readings WHERE user_id=$1', [patientId]),
    db.query(`SELECT id,reading_date,time_slot,glucose_value,created_at,updated_at FROM glucose_readings WHERE user_id=$1 ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} LIMIT $2 OFFSET $3`, [patientId, limit, offset]),
  ]);
  return { patient, readings: rows.rows.map(withInterpretation), pagination: { page, limit, total: count.rows[0].total, totalPages: Math.max(1, Math.ceil(count.rows[0].total / limit)) } };
}

module.exports = { assertAssigned, listPatients, patientReadings };
