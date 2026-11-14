
const reminderService = require('../services/reminderService');
const { sendSuccess } = require('../utils/response');
const AppError = require('../utils/AppError');

const list = async (req, res) => {
  const result = await reminderService.getNotifications(req.user.id);

  sendSuccess(res, result, 'Notifications fetched successfully');
};

const markRead = async (req, res) => {
  const notification = await reminderService.markNotificationRead(
    req.user.id,
    req.validated.params.id
  );

  if (!notification) {
    throw new AppError(404, 'Notification not found.');
  }

  sendSuccess(
    res,
    { notification },
    'Notification marked as read'
  );
};

const markAllRead = async (req, res) => {
  const updatedCount = await reminderService.markAllNotificationsRead(
    req.user.id
  );

  sendSuccess(
    res,
    { updatedCount },
    'All notifications marked as read'
  );
};

module.exports = {
  list,
  markRead,
  markAllRead,
};
