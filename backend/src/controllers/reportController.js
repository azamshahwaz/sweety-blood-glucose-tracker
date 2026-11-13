const reportService = require('../services/reportService');
const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/response');

const daily = async (req, res) => sendSuccess(res, await reportService.daily(req.user.id, req.validated.query.date));
const monthToDate = async (req, res) => sendSuccess(res, await reportService.monthToDate(req.user.id, req.validated.query.date));
const monthly = async (req, res) => sendSuccess(res, await reportService.previousMonth(req.user.id, req.validated.query.date));

const summary = async (req, res) => {
  const { date, month } = req.validated.query;
  sendSuccess(res, await dashboardService.summary(req.user.id, date, month));
};
const trends = async (req, res) => sendSuccess(res, await dashboardService.trends(req.user.id, req.validated.query.month));

module.exports = { daily, monthToDate, monthly, summary, trends };
