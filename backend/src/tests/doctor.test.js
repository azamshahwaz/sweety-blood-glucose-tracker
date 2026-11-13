const { setupDb, resetDb, closeDb, createUser, newAgent, pool } = require('./helpers');

beforeAll(setupDb);
beforeEach(resetDb);
afterAll(closeDb);

async function promote(user, role) { await pool.query('UPDATE users SET role=$2 WHERE id=$1', [user.id, role]); }
async function assignment(doctorId, patientId) { await pool.query('INSERT INTO doctor_patient_assignments(doctor_id,patient_id) VALUES($1,$2)', [doctorId, patientId]); }

describe('Doctor and administrator authorization', () => {
  test('doctor sees assigned patient readings and reports, and only those patients', async () => {
    const doc = await createUser(); const otherDoc = await createUser(); const patient = await createUser(); const otherPatient = await createUser();
    await promote(doc.user, 'DOCTOR'); await promote(otherDoc.user, 'DOCTOR');
    await assignment(doc.user.id, patient.user.id); await assignment(otherDoc.user.id, otherPatient.user.id);
    await patient.agent.post('/api/readings').send({ reading_date: '2025-06-10', time_slot: 'MORNING_FASTING', glucose_value: 110 }).expect(201);
    const list = await doc.agent.get('/api/doctor/patients').expect(200);
    expect(list.body.data.patients).toHaveLength(1);
    expect(list.body.data.patients[0]).toMatchObject({ id: patient.user.id, latest_glucose: 110, interpretation: { status: 'MODERATE' } });
    await doc.agent.get(`/api/doctor/patients/${patient.user.id}/readings`).expect(200);
    await doc.agent.get(`/api/doctor/patients/${patient.user.id}/reports/daily?date=2025-06-10`).expect(200);
    await doc.agent.get(`/api/doctor/patients/${otherPatient.user.id}/readings`).expect(404);
    await doc.agent.get(`/api/doctor/patients/${otherPatient.user.id}/reports/daily?date=2025-06-10`).expect(404);
    await doc.agent.get(`/api/doctor/patients/${otherPatient.user.id}/readings`).expect(404);
  });

  test('patient and unauthenticated users cannot access doctor endpoints', async () => {
    const patient = await createUser();
    await patient.agent.get('/api/doctor/patients').expect(403);
    await newAgent().get('/api/doctor/patients').expect(401);
  });

  test('revoking assignment immediately removes doctor access; doctor has no write endpoints', async () => {
    const doc = await createUser(); const admin = await createUser(); const patient = await createUser(); await promote(doc.user, 'DOCTOR'); await promote(admin.user, 'ADMIN');
    const { rows } = await pool.query('INSERT INTO doctor_patient_assignments(doctor_id,patient_id) VALUES($1,$2) RETURNING id', [doc.user.id, patient.user.id]);
    const reading = await patient.agent.post('/api/readings').send({ reading_date: '2025-06-10', time_slot: 'MORNING_FASTING', glucose_value: 110 }).expect(201);
    await doc.agent.get(`/api/doctor/patients/${patient.user.id}/readings`).expect(200);
    await admin.agent.delete(`/api/admin/assignments/${rows[0].id}`).expect(200);
    await doc.agent.get(`/api/doctor/patients/${patient.user.id}/readings`).expect(404);
    await doc.agent.put(`/api/readings/${reading.body.data.reading.id}`).send({ reading_date: '2025-06-10', time_slot: 'MORNING_FASTING', glucose_value: 120 }).expect(404);
  });

  test('only administrator can create doctor accounts and assignments; duplicate links are rejected', async () => {
    const admin = await createUser(); const doctor = await createUser(); const patient = await createUser();
    await promote(admin.user, 'ADMIN'); await promote(doctor.user, 'DOCTOR');
    await doctor.agent.post('/api/admin/assignments').send({ doctorId: doctor.user.id, patientId: patient.user.id }).expect(403);
    const assignmentResult = await admin.agent.post('/api/admin/assignments').send({ doctorId: doctor.user.id, patientId: patient.user.id }).expect(201);
    const assignmentId = assignmentResult.body.data.assignment.id;
    await doctor.agent.delete(`/api/admin/assignments/${assignmentId}`).expect(403);
    await patient.agent.delete(`/api/admin/assignments/${assignmentId}`).expect(403);
    await admin.agent.post('/api/admin/assignments').send({ doctorId: doctor.user.id, patientId: patient.user.id }).expect(409);
    await admin.agent.delete('/api/admin/assignments/not-a-uuid').expect(400);
    const created = await admin.agent.post('/api/admin/doctors').send({ name: 'Asha Rao', email: 'doctor-created@example.com', password: 'StrongPass1!' }).expect(201);
    expect(created.body.data.doctor.role).toBe('DOCTOR');
    expect(created.body.data.doctor.password_hash).toBeUndefined();
  });

  test('public registration cannot choose its own role', async () => {
    const res = await newAgent().post('/api/auth/register').send({ name: 'Patient One', email: 'self-promote@example.com', password: 'Password@123', confirmPassword: 'Password@123', role: 'DOCTOR' }).expect(201);
    expect(res.body.data.user.role).toBe('PATIENT');
    const { rows } = await pool.query('SELECT role FROM users WHERE email=$1', ['self-promote@example.com']);
    expect(rows[0].role).toBe('PATIENT');
  });
});
