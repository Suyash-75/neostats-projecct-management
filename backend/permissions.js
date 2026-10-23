const { Role, ProjectRole } = require('./generated/prisma');

function canReadProject(user, membership) {
  return user.role === Role.ADMIN || Boolean(membership);
}

function canManageProject(user, membership) {
  return user.role === Role.ADMIN ||
    (user.role === Role.PROJECT_MANAGER && membership?.role === ProjectRole.PROJECT_MANAGER);
}

function canAccessTask(user, task) {
  if (user.role === Role.ADMIN) return true;
  if (task.memberships.some((membership) => membership.userId === user.id)) return true;
  return user.role === Role.TEAM_MEMBER && task.assigneeId === user.id;
}

function canUpdateTask(user, task) {
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.PROJECT_MANAGER && task.memberships.some((membership) =>
    membership.userId === user.id && membership.role === ProjectRole.PROJECT_MANAGER
  )) return true;
  return user.role === Role.TEAM_MEMBER && task.assigneeId === user.id;
}

function canManageTask(user, task) {
  if (user.role === Role.ADMIN) return true;
  return user.role === Role.PROJECT_MANAGER && task.memberships.some((membership) =>
    membership.userId === user.id && membership.role === ProjectRole.PROJECT_MANAGER
  );
}

module.exports = {
  canAccessTask,
  canManageProject,
  canManageTask,
  canReadProject,
  canUpdateTask,
};
