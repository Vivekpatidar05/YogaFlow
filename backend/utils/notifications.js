const Notification = require('../models/Notification');

/**
 * Create an in-app notification for a user
 */
async function createNotification(userId, { type, title, message, link = null, data = null }) {
  try {
    return await Notification.create({ user: userId, type, title, message, link, data });
  } catch (err) {
    console.error('Create notification error:', err.message);
    return null;
  }
}

/**
 * Notify an instructor when a user books their session
 */
async function notifyInstructorNewBooking(instructorId, booking, session, user) {
  return createNotification(instructorId, {
    type:    'new_booking_on_session',
    title:   'New booking on your session',
    message: `${user.firstName} ${user.lastName} booked "${session.title}" on ${new Date(booking.sessionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
    link:    '/instructor/bookings',
    data:    { bookingId: booking._id, sessionId: session._id },
  });
}

/**
 * Notify user that their waitlist spot opened
 */
async function notifyWaitlistOpen(userId, session, sessionDate) {
  return createNotification(userId, {
    type:    'waitlist_spot',
    title:   'Spot available!',
    message: `A spot opened in "${session.title}" on ${new Date(sessionDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}. Book now before it fills up!`,
    link:    `/sessions/${session._id}`,
    data:    { sessionId: session._id, sessionDate },
  });
}

/**
 * Notify instructor of approval/rejection
 */
async function notifyInstructorApproval(userId, approved, adminNote) {
  return createNotification(userId, {
    type:    approved ? 'instructor_approved' : 'instructor_rejected',
    title:   approved ? 'Application approved! 🎉' : 'Application update',
    message: approved
      ? 'Your instructor application has been approved. You can now create and manage sessions!'
      : `Your instructor application was not approved${adminNote ? `: ${adminNote}` : '.'}`,
    link:    approved ? '/instructor/sessions' : '/profile',
  });
}

module.exports = {
  createNotification,
  notifyInstructorNewBooking,
  notifyWaitlistOpen,
  notifyInstructorApproval,
};
