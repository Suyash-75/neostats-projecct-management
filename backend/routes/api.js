const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Role, ProjectRole, TaskStatus, TaskPriority, Prisma } = require('../generated/prisma');
const prisma = require('../prisma/client');
const { authenticateToken, authorizeRoles } = require('../auth');
const {
  canAccessTask,
  canCommentTask,
  canManageProject,
  canManageTask,
  canReadProject,
  canUpdateTask,
} = require('../permissions');
const { updateTaskAtVersion } = require('../task-version');

const router = express.Router();
const roleValues = Object.values(Role);
const projectRoleValues = Object.values(ProjectRole);
const taskStatuses = Object.values(TaskStatus);
const taskPriorities = Object.values(TaskPriority);
const userSelect = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true };
const memberSelect = {
  user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
  role: true,
  createdAt: true,
};

function parsePagination(query) {
  const pageValue = query.page ?? '1';
  const limitValue = query.limit ?? '20';
  if (typeof pageValue !== 'string' || !/^\d+$/.test(pageValue) ||
      typeof limitValue !== 'string' || !/^\d+$/.test(limitValue)) return null;
  const page = Number(pageValue);
  const limit = Number(limitValue);
  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || !Number.isSafeInteger(skip) ||
      page < 1 || limit < 1 || limit > 100) return null;
  return { page, limit, skip };
}

function parseOptionalDate(value) {
  if (value === null || value === '') return { valid: true, value: null };
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return { valid: false };
  return { valid: true, value: new Date(value) };
}

function getTaskMemberships(task) {
  return task.project.projectMembers;
}

async function loadTaskAccess(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { projectMembers: true } } },
  });
  if (!task) return null;
  return { ...task, memberships: getTaskMemberships(task) };
}

async function loadProjectAccess(projectId, userId) {
  const [project, membership] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } }),
  ]);
  return { project, membership };
}

function isAdmin(req) {
  return req.user.role === Role.ADMIN;
}

function requireProjectRead(req, res, project, membership) {
  if (!project || !canReadProject(req.user, membership)) {
    res.status(404).json({ error: 'Project not found or not accessible.' });
    return false;
  }
  return true;
}

function requireProjectManage(req, res, project, membership) {
  if (!project || !canManageProject(req.user, membership)) {
    res.status(404).json({ error: 'Project not found or not managed by this account.' });
    return false;
  }
  if (project.archivedAt) {
    res.status(409).json({ error: 'Archived projects cannot be changed.' });
    return false;
  }
  return true;
}

function handleDatabaseError(res, error, message) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that unique value already exists.' });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }
  console.error(message, error);
  return res.status(500).json({ error: message });
}

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (role && (!roleValues.includes(role) || user.role !== role)) {
      return res.status(403).json({ error: 'This account does not have the selected role.' });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Authentication is not configured on the server.' });
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: '2h' });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return handleDatabaseError(res, error, 'Unable to sign in right now.');
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: userSelect });
    return res.json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to load profile.');
  }
});

router.patch('/profile', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const data = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
    data.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    data.email = email.trim().toLowerCase();
  }
  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    data.password = await bcrypt.hash(password, 10);
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Provide at least one profile field to update.' });
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data, select: userSelect });
    return res.json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to update profile.');
  }
});

router.get('/users', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Pagination must use page >= 1 and limit between 1 and 100.' });
  const where = {};
  if (req.query.role) {
    if (!roleValues.includes(req.query.role)) return res.status(400).json({ error: 'Invalid role filter.' });
    where.role = req.query.role;
  }
  if (req.query.active === 'true') where.isActive = true;
  if (req.query.active === 'false') where.isActive = false;
  if (req.query.search) where.OR = [
    { name: { contains: String(req.query.search), mode: 'insensitive' } },
    { email: { contains: String(req.query.search), mode: 'insensitive' } },
  ];
  try {
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, select: userSelect, orderBy: { name: 'asc' }, skip: pagination.skip, take: pagination.limit }),
      prisma.user.count({ where }),
    ]);
    return res.json({ items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch users.');
  }
});

router.get('/users/:userId', authenticateToken, async (req, res) => {
  if (!isAdmin(req) && req.user.id !== req.params.userId) return res.status(403).json({ error: 'You can only view your own account.' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: userSelect });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch user.');
  }
});

router.post('/users', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' || password.length < 8 || !roleValues.includes(role)) {
    return res.status(400).json({ error: 'Provide a name, valid email, role, and password of at least 8 characters.' });
  }
  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase(), password: await bcrypt.hash(password, 10), role },
      select: userSelect,
    });
    return res.status(201).json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to create user.');
  }
});

router.patch('/users/:userId', authenticateToken, async (req, res) => {
  const isSelf = req.user.id === req.params.userId;
  if (!isAdmin(req) && !isSelf) return res.status(403).json({ error: 'You can only update your own account.' });
  const { name, email, password, role, isActive } = req.body ?? {};
  const data = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
    data.name = name.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ error: 'A valid email address is required.' });
    data.email = email.trim().toLowerCase();
  }
  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    data.password = await bcrypt.hash(password, 10);
  }
  if (role !== undefined || isActive !== undefined) {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Only admins can change roles or account status.' });
    if (role !== undefined) {
      if (!roleValues.includes(role)) return res.status(400).json({ error: 'Invalid role.' });
      data.role = role;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') return res.status(400).json({ error: 'isActive must be a boolean.' });
      if (!isActive && req.user.id === req.params.userId) return res.status(400).json({ error: 'Admins cannot deactivate their own account.' });
      data.isActive = isActive;
    }
  }
  if (!Object.keys(data).length) return res.status(400).json({ error: 'Provide at least one field to update.' });
  try {
    const user = await prisma.user.update({ where: { id: req.params.userId }, data, select: userSelect });
    return res.json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to update user.');
  }
});

router.delete('/users/:userId', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  if (req.user.id === req.params.userId) return res.status(400).json({ error: 'Admins cannot deactivate their own account.' });
  try {
    const user = await prisma.user.update({ where: { id: req.params.userId }, data: { isActive: false }, select: userSelect });
    return res.json(user);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to deactivate user.');
  }
});

router.get('/projects', authenticateToken, async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Pagination must use page >= 1 and limit between 1 and 100.' });
  const archived = req.query.archived === 'true';
  const where = archived ? { archivedAt: { not: null } } : { archivedAt: null };
  if (!isAdmin(req)) {
    where.projectMembers = { some: { userId: req.user.id } };
  }
  try {
    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: { projectMembers: { select: memberSelect }, _count: { select: { tasks: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.project.count({ where }),
    ]);
    return res.json({ items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch projects.');
  }
});

router.get('/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectRead(req, res, project, membership)) return;
    const result = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        projectMembers: { select: memberSelect },
        tasks: { include: { assignee: { select: userSelect } }, orderBy: { updatedAt: 'desc' } },
      },
    });
    return res.json(result);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch project.');
  }
});

router.post('/projects', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { name, description } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'A project name is required.' });
  if (description !== undefined && description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string or null.' });
  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ...(req.user.role === Role.PROJECT_MANAGER
          ? {
            members: { connect: { id: req.user.id } },
            projectMembers: { create: { userId: req.user.id, role: ProjectRole.PROJECT_MANAGER } },
          }
          : {}),
      },
      include: { projectMembers: { select: memberSelect } },
    });
    return res.status(201).json(project);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to create project.');
  }
});

router.patch('/projects/:projectId', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { name, description } = req.body ?? {};
  const data = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Project name cannot be empty.' });
    data.name = name.trim();
  }
  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string or null.' });
    data.description = description?.trim() || null;
  }
  if (!Object.keys(data).length) return res.status(400).json({ error: 'Provide a project name or description to update.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    return res.json(await prisma.project.update({ where: { id: project.id }, data, include: { projectMembers: { select: memberSelect } } }));
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to update project.');
  }
});

router.patch('/projects/:projectId/archive', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { archived } = req.body ?? {};
  if (typeof archived !== 'boolean') return res.status(400).json({ error: 'archived must be a boolean.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!project || !canManageProject(req.user, membership)) return res.status(404).json({ error: 'Project not found or not managed by this account.' });
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { archivedAt: archived ? (project.archivedAt ?? new Date()) : null },
    });
    return res.json(updated);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to change project archive status.');
  }
});

router.delete('/projects/:projectId', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to delete project.');
  }
});

router.get('/projects/:projectId/members', authenticateToken, async (req, res) => {
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectRead(req, res, project, membership)) return;
    const items = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      select: memberSelect,
      orderBy: { createdAt: 'asc' },
    });
    return res.json(items);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch project members.');
  }
});

router.get('/projects/:projectId/available-members', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        projects: { none: { id: project.id } },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    return res.json(users);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch available members.');
  }
});

router.post('/projects/:projectId/members', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { userId, role } = req.body ?? {};
  if (typeof userId !== 'string' || (role !== undefined && !projectRoleValues.includes(role))) return res.status(400).json({ error: 'Provide a valid userId and optional project role.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, isActive: true, role: true } });
    if (!user || !user.isActive) return res.status(404).json({ error: 'Active user not found.' });
    if (req.user.role !== Role.ADMIN && role === ProjectRole.PROJECT_MANAGER) {
      return res.status(403).json({ error: 'Only admins can assign project manager role.' });
    }
    if (role === ProjectRole.PROJECT_MANAGER && user.role !== Role.PROJECT_MANAGER) {
      return res.status(400).json({ error: 'Only accounts with the project manager global role can manage projects.' });
    }
    const projectMember = await prisma.$transaction(async (transaction) => {
      await transaction.project.update({
        where: { id: project.id },
        data: { members: { connect: { id: userId } } },
      });
      return transaction.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: role ?? ProjectRole.TEAM_MEMBER,
        },
        select: memberSelect,
      });
    });
    return res.status(201).json(projectMember);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to add project member.');
  }
});

router.patch('/projects/:projectId/members/:userId', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { role } = req.body ?? {};
  if (!projectRoleValues.includes(role)) return res.status(400).json({ error: 'A valid project role is required.' });
  if (req.user.role !== Role.ADMIN && role === ProjectRole.PROJECT_MANAGER) return res.status(403).json({ error: 'Only admins can assign project manager role.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    if (role === ProjectRole.PROJECT_MANAGER) {
      const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { role: true } });
      if (!user) return res.status(404).json({ error: 'Project member not found.' });
      if (user.role !== Role.PROJECT_MANAGER) {
        return res.status(400).json({ error: 'Only accounts with the project manager global role can manage projects.' });
      }
    }
    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: project.id, userId: req.params.userId } },
      data: { role },
      select: memberSelect,
    });
    return res.json(updated);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to change project member role.');
  }
});

router.delete('/projects/:projectId/members/:userId', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    if (req.params.userId === req.user.id && req.user.role !== Role.ADMIN) return res.status(400).json({ error: 'Project managers cannot remove themselves from a project.' });
    await prisma.$transaction(async (transaction) => {
      await transaction.project.update({
        where: { id: project.id },
        data: { members: { disconnect: { id: req.params.userId } } },
      });
      await transaction.projectMember.delete({
        where: { projectId_userId: { projectId: project.id, userId: req.params.userId } },
      });
    });
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to remove project member.');
  }
});

router.get('/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Pagination must use page >= 1 and limit between 1 and 100.' });
  if (req.query.status && !taskStatuses.includes(req.query.status)) return res.status(400).json({ error: 'Invalid task status filter.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectRead(req, res, project, membership)) return;
    const where = { projectId: project.id, ...(req.query.status ? { status: req.query.status } : {}) };
    const [items, total] = await Promise.all([
      prisma.task.findMany({ where, include: { assignee: { select: userSelect } }, orderBy: { updatedAt: 'desc' }, skip: pagination.skip, take: pagination.limit }),
      prisma.task.count({ where }),
    ]);
    return res.json({ items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch project tasks.');
  }
});

router.get('/tasks', authenticateToken, async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Pagination must use page >= 1 and limit between 1 and 100.' });
  if (req.query.status && !taskStatuses.includes(req.query.status)) return res.status(400).json({ error: 'Invalid task status filter.' });
  const where = {
    ...(req.query.status ? { status: req.query.status } : {}),
    ...(req.query.assigneeId ? { assigneeId: String(req.query.assigneeId) } : {}),
  };
  if (!isAdmin(req)) {
    where.project = { archivedAt: null };
    where.OR = [
      { project: { projectMembers: { some: { userId: req.user.id } } } },
      { assigneeId: req.user.id },
    ];
  }
  try {
    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: userSelect },
          project: {
            select: {
              id: true,
              name: true,
              archivedAt: true,
              projectMembers: { where: { userId: req.user.id }, select: { role: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.task.count({ where }),
    ]);
    return res.json({ items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch tasks.');
  }
});

router.get('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await loadTaskAccess(req.params.taskId);
    if (!task || !canAccessTask(req.user, task)) return res.status(404).json({ error: 'Task not found or not accessible.' });
    return res.json({ ...task, memberships: undefined });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch task.');
  }
});

router.post('/projects/:projectId/tasks', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'A task title is required.' });
  if (description !== undefined && description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string or null.' });
  if (status !== undefined && !taskStatuses.includes(status)) return res.status(400).json({ error: 'Invalid task status.' });
  if (priority !== undefined && !taskPriorities.includes(priority)) return res.status(400).json({ error: 'Invalid task priority.' });
  if (assigneeId != null && typeof assigneeId !== 'string') return res.status(400).json({ error: 'Assignee ID must be a string or null.' });
  const parsedDate = dueDate === undefined ? { valid: true, value: undefined } : parseOptionalDate(dueDate);
  if (!parsedDate.valid) return res.status(400).json({ error: 'dueDate must be a valid date or null.' });
  try {
    const { project, membership } = await loadProjectAccess(req.params.projectId, req.user.id);
    if (!requireProjectManage(req, res, project, membership)) return;
    if (assigneeId) {
      const assignee = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: assigneeId } },
        include: { user: { select: { isActive: true, role: true } } },
      });
      if (!assignee || !assignee.user.isActive || assignee.user.role === Role.VIEWER || assignee.role === ProjectRole.VIEWER) {
        return res.status(400).json({ error: 'Assignee must be an active, non-viewer member of this project.' });
      }
    }
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        status: status ?? TaskStatus.TODO,
        priority: priority ?? TaskPriority.MEDIUM,
        dueDate: parsedDate.value,
        projectId: project.id,
        assigneeId: assigneeId ?? null,
      },
      include: { assignee: { select: userSelect } },
    });
    return res.status(201).json(task);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to create task.');
  }
});

router.patch('/tasks/:taskId', authenticateToken, async (req, res) => {
  const { version, title, description, status, priority, assigneeId, dueDate } = req.body ?? {};
  if (!Number.isInteger(version) || version < 1) return res.status(400).json({ error: 'The current task version is required.' });
  const allowedFields = new Set(['version', 'title', 'description', 'status', 'priority', 'assigneeId', 'dueDate']);
  if (Object.keys(req.body ?? {}).some((key) => !allowedFields.has(key))) return res.status(400).json({ error: 'Unknown task field.' });
  const taskData = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Task title cannot be empty.' });
    taskData.title = title.trim();
  }
  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') return res.status(400).json({ error: 'Description must be a string or null.' });
    taskData.description = description?.trim() || null;
  }
  if (status !== undefined) {
    if (!taskStatuses.includes(status)) return res.status(400).json({ error: 'Invalid task status.' });
    taskData.status = status;
  }
  if (priority !== undefined) {
    if (!taskPriorities.includes(priority)) return res.status(400).json({ error: 'Invalid task priority.' });
    taskData.priority = priority;
  }
  if (assigneeId !== undefined && assigneeId !== null && typeof assigneeId !== 'string') return res.status(400).json({ error: 'Assignee ID must be a string or null.' });
  if (assigneeId !== undefined) taskData.assigneeId = assigneeId;
  const parsedDate = dueDate === undefined ? { valid: true, value: undefined } : parseOptionalDate(dueDate);
  if (!parsedDate.valid) return res.status(400).json({ error: 'dueDate must be a valid date or null.' });
  if (dueDate !== undefined) taskData.dueDate = parsedDate.value;
  if (!Object.keys(taskData).length) return res.status(400).json({ error: 'Provide at least one task field to update.' });

  try {
    const task = await loadTaskAccess(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.project.archivedAt && !isAdmin(req)) return res.status(409).json({ error: 'Tasks in archived projects cannot be changed.' });
    if (!canUpdateTask(req.user, task)) return res.status(403).json({ error: 'You cannot update this task.' });
    if (!canManageTask(req.user, task)) {
      const memberFields = new Set(['status', 'description']);
      if (Object.keys(taskData).some((key) => !memberFields.has(key))) {
        return res.status(403).json({ error: 'Team members may only update the status and description of tasks assigned to them.' });
      }
    }
    if (taskData.assigneeId) {
      const assignee = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId: taskData.assigneeId } },
        include: { user: { select: { isActive: true, role: true } } },
      });
      if (!assignee || !assignee.user.isActive || assignee.user.role === Role.VIEWER || assignee.role === ProjectRole.VIEWER) {
        return res.status(400).json({ error: 'Assignee must be an active, non-viewer member of the task project.' });
      }
    }
    const result = await updateTaskAtVersion(prisma, task.id, version, taskData);
    if (!result.task) return res.status(404).json({ error: 'Task not found.' });
    if (result.conflict) return res.status(409).json({ error: 'Task was changed by someone else. Review the latest task and retry.', current: result.task });
    return res.json(result.task);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to update task.');
  }
});

router.delete('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const task = await loadTaskAccess(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    if (task.project.archivedAt && !isAdmin(req)) return res.status(409).json({ error: 'Tasks in archived projects cannot be changed.' });
    if (!canManageTask(req.user, task)) return res.status(403).json({ error: 'Only admins and project managers for this project can delete tasks.' });
    await prisma.task.delete({ where: { id: task.id } });
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to delete task.');
  }
});

router.get('/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Pagination must use page >= 1 and limit between 1 and 100.' });
  try {
    const task = await loadTaskAccess(req.params.taskId);
    if (!task || !canAccessTask(req.user, task)) return res.status(404).json({ error: 'Task not found or not accessible.' });
    const [items, total] = await Promise.all([
      prisma.taskComment.findMany({
        where: { taskId: task.id },
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.taskComment.count({ where: { taskId: task.id } }),
    ]);
    return res.json({ items, page: pagination.page, limit: pagination.limit, total });
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to fetch task comments.');
  }
});

router.post('/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  const { content } = req.body ?? {};
  if (typeof content !== 'string' || !content.trim() || content.length > 5000) {
    return res.status(400).json({ error: 'A comment must contain 1 to 5000 characters.' });
  }
  try {
    const task = await loadTaskAccess(req.params.taskId);
    if (!task || !canAccessTask(req.user, task)) return res.status(404).json({ error: 'Task not found or not accessible.' });
    if (task.project.archivedAt && !isAdmin(req)) return res.status(409).json({ error: 'Tasks in archived projects cannot be changed.' });
    if (!canCommentTask(req.user, task)) return res.status(403).json({ error: 'Your project role does not allow comments.' });
    const comment = await prisma.taskComment.create({
      data: { content: content.trim(), taskId: task.id, authorId: req.user.id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    return res.status(201).json(comment);
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to create comment.');
  }
});

router.delete('/tasks/:taskId/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const comment = await prisma.taskComment.findUnique({
      where: { id: req.params.commentId },
      include: { task: { include: { project: { include: { projectMembers: true } } } } },
    });
    if (!comment || comment.taskId !== req.params.taskId) return res.status(404).json({ error: 'Comment not found.' });
    const task = { ...comment.task, memberships: comment.task.project.projectMembers };
    if (!canAccessTask(req.user, task)) return res.status(404).json({ error: 'Comment not found or not accessible.' });
    if (task.project.archivedAt && !isAdmin(req)) return res.status(409).json({ error: 'Comments in archived projects cannot be changed.' });
    const isAuthor = comment.authorId === req.user.id;
    if (!(isAuthor && canCommentTask(req.user, task)) && !canManageTask(req.user, task)) {
      return res.status(403).json({ error: 'Only an authorized comment author or a project manager can delete this comment.' });
    }
    await prisma.taskComment.delete({ where: { id: comment.id } });
    return res.status(204).end();
  } catch (error) {
    return handleDatabaseError(res, error, 'Failed to delete comment.');
  }
});

module.exports = router;
