const supabase = require('../config/db');
const { getIO } = require('../config/socket');

async function createNotification({ ownerId, complaintId, type, title, message }) {
  try {
    // 1. Save to DB
    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert([{
        owner_id: ownerId,
        complaint_id: complaintId,
        type,
        title,
        message,
        is_read: false
      }])
      .select('*')
      .single();

    if (error) {
      console.error('Failed to create notification in DB:', error);
      return null;
    }

    // 2. Emit via socket to client room (based on ownerId)
    const io = getIO();
    if (io) {
      io.to(ownerId).emit('notification', newNotification);
      console.log(`Socket notification emitted to room ${ownerId}: ${title}`);
    }

    return newNotification;
  } catch (error) {
    console.error('Notification Service Error:', error);
    return null;
  }
}

async function getNotificationsByUser(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function markAsRead(notificationId, userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead
};
