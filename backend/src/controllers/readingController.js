const readingService = require('../services/readingService');
const { sendSuccess } = require('../utils/response');

const create = async (req, res) => {
  const reading = await readingService.create(req.user.id, req.validated.body);
  sendSuccess(res, { reading }, 'Reading added successfully', 201);
};
const list = async (req, res) => sendSuccess(res, await readingService.list(req.user.id, req.validated.query), 'OK');
const getOne = async (req, res) =>
  sendSuccess(res, { reading: await readingService.getById(req.user.id, req.validated.params.id) }, 'OK');
const update = async (req, res) => {
  const reading = await readingService.update(req.user.id, req.validated.params.id, req.validated.body);
  sendSuccess(res, { reading }, 'Reading updated successfully');
};
const remove = async (req, res) => {
  await readingService.remove(req.user.id, req.validated.params.id);
  sendSuccess(res, {}, 'Reading deleted successfully');
};

module.exports = { create, list, getOne, update, remove };
