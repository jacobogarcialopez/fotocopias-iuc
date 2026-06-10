const { Notification } = require('../models');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { usuario_id: req.user.id },
      order: [['fecha', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las notificaciones.'
    });
  }
};

const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOne({
      where: { id, usuario_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada o no pertenece a este usuario.'
      });
    }

    notification.leida = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída.',
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar la notificación.'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
