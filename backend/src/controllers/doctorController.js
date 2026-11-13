const doctorService = require('../services/doctorService');
const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/response');

const patients = async (req, res) => sendSuccess(res, await doctorService.listPatients(req.user.id, req.validated.query));
const readings = async (req, res) => sendSuccess(res, await doctorService.patientReadings(req.user.id, req.validated.params.patientId, req.validated.query));
const daily = async (req, res) => {
  const patient = await doctorService.assertAssigned(req.user.id, req.validated.params.patientId);
  sendSuccess(res, { patient, report: await reportService.daily(patient.id, req.validated.query.date) });
};
const mtd = async (req, res) => {
  const patient = await doctorService.assertAssigned(req.user.id, req.validated.params.patientId);
  sendSuccess(res, { patient, report: await reportService.monthToDate(patient.id, req.validated.query.date) });
};
const monthly = async (req, res) => {
  const patient = await doctorService.assertAssigned(req.user.id, req.validated.params.patientId);
  sendSuccess(res, { patient, report: await reportService.previousMonth(patient.id, req.validated.query.date) });
};
module.exports = { patients, readings, daily, mtd, monthly };
