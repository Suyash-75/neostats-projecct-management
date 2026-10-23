const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Role, TaskStatus } = require('@prisma/client');
const prisma = require('../prisma/client');
const { authenticateToken, authorizeRoles } = require('../auth');

const router = express.Router();
const roleValues = Object.values(Role);
const taskStatuses = Object.values(TaskStatus);

async function canManageProject(user, projectId) {
  if (user.role === Role.ADMIN) return true;
  if (user.role !== Role.PROJECT_MANAGER) return false;

  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { id: user.id } } },
    select: { id: true },
  });
  return Boolean(project);
}

async function canAccessTask(user, taskId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId },
    select: {
      assigneeId: true,
      project: { select: { members: { select: { id: true } } } },
    },
  });
  if (!task) return false;
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.PROJECT_MANAGER) {
    return task.project.members.some(({ id }) => id === user.id);
  }
  return task.project.members.some(({ id }) => id === user.id) ||
    (user.role === Role.TEAM_MEMBER && task.assigneeId === user.id);
}

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body ?? {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (role && (!roleValues.includes(role) || user.role !== role)) {
      return res.status(403).json({ error: 'This account does not have the selected role.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({ error: 'Authentication is not configured on the server.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '2h' }
    );

    return res.json({ token, role: user.role, name: user.name });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.get('/projects', authenticateToken, async (req, res) => {
  try {
    const where = req.user.role === Role.ADMIN ? {} : {
      OR: [
        { members: { some: { id: req.user.id } } },
        { tasks: { some: { assigneeId: req.user.id } } },
      ],
    };
    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: true,
        members: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(projects);
  } catch (error) {
    console.error('Fetching projects failed:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

router.post('/projects', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { name, description } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'A project name is required.' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description : null,
        ...(req.user.role === Role.PROJECT_MANAGER
          ? { members: { connect: { id: req.user.id } } }
          : {}),
      },
    });
    return res.status(201).json(project);
  } catch (error) {
    console.error('Creating project failed:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.delete('/projects/:projectId', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  try {
    if (!(await canManageProject(req.user, req.params.projectId))) {
      return res.status(404).json({ error: 'Project not found or not managed by this account.' });
    }
    await prisma.project.delete({ where: { id: req.params.projectId } });
    return res.status(204).end();
  } catch (error) {
    console.error('Deleting project failed:', error);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

router.post('/projects/:projectId/members', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { userId, role } = req.body ?? {};
  if (typeof userId !== 'string' || (role && !roleValues.includes(role))) {
    return res.status(400).json({ error: 'Provide a valid userId and optional role.' });
  }
  if (role && req.user.role !== Role.ADMIN) {
    return res.status(403).json({ error: 'Only admins can change user roles.' });
  }

  try {
    if (!(await canManageProject(req.user, req.params.projectId))) {
      return res.status(404).json({ error: 'Project not found or not managed by this account.' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const project = await prisma.$transaction(async (transaction) => {
      if (role) {
        await transaction.user.update({ where: { id: userId }, data: { role } });
      }
      return transaction.project.update({
        where: { id: req.params.projectId },
        data: { members: { connect: { id: userId } } },
        include: { members: { select: { id: true, name: true, email: true, role: true } } },
      });
    });
    return res.json(project);
  } catch (error) {
    console.error('Adding project member failed:', error);
    return res.status(500).json({ error: 'Failed to add project member.' });
  }
});

router.post('/projects/:projectId/tasks', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER), async (req, res) => {
  const { title, assigneeId, status } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'A task title is required.' });
  }
  if (assigneeId != null && typeof assigneeId !== 'string') {
    return res.status(400).json({ error: 'Assignee ID must be a string.' });
  }
  if (status && !taskStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid task status.' });
  }

  try {
    if (!(await canManageProject(req.user, req.params.projectId))) {
      return res.status(404).json({ error: 'Project not found or not managed by this account.' });
    }
    if (assigneeId) {
      const assigneeIsProjectMember = await prisma.user.findFirst({
        where: { id: assigneeId, projects: { some: { id: req.params.projectId } } },
        select: { id: true },
      });
      if (!assigneeIsProjectMember) {
        return res.status(400).json({ error: 'Assignee must be a member of this project.' });
      }
    }
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: status ?? TaskStatus.TODO,
        projectId: req.params.projectId,
        assigneeId: assigneeId ?? null,
      },
    });
    return res.status(201).json(task);
  } catch (error) {
    console.error('Creating task failed:', error);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

router.patch('/tasks/:taskId/status', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER), async (req, res) => {
  const { status } = req.body ?? {};
  if (!taskStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid task status.' });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      select: { id: true, assigneeId: true, projectId: true },
    });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const allowed = req.user.role === Role.ADMIN
      ? true
      : req.user.role === Role.PROJECT_MANAGER
        ? await canManageProject(req.user, task.projectId)
        : task.assigneeId === req.user.id;
    if (!allowed) {
      return res.status(403).json({ error: 'You can only update tasks assigned to you or in projects you manage.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: { status },
    });
    return res.json(updatedTask);
  } catch (error) {
    console.error('Updating task status failed:', error);
    return res.status(500).json({ error: 'Failed to update task status.' });
  }
});

router.get('/tasks/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    if (!(await canAccessTask(req.user, req.params.taskId))) {
      return res.status(404).json({ error: 'Task not found or not accessible to this account.' });
    }
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.taskId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(comments);
  } catch (error) {
    console.error('Fetching task comments failed:', error);
    return res.status(500).json({ error: 'Failed to fetch task comments.' });
  }
});

router.post('/tasks/:taskId/comments', authenticateToken, authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_MEMBER), async (req, res) => {
  const { content } = req.body ?? {};
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'A comment cannot be empty.' });
  }

  try {
    if (!(await canAccessTask(req.user, req.params.taskId))) {
      return res.status(404).json({ error: 'Task not found or not accessible to this account.' });
    }
    const comment = await prisma.taskComment.create({
      data: {
        content: content.trim(),
        taskId: req.params.taskId,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    return res.status(201).json(comment);
  } catch (error) {
    console.error('Creating task comment failed:', error);
    return res.status(500).json({ error: 'Failed to create comment.' });
  }
});

router.post('/users', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || typeof password !== 'string' || password.length < 8 ||
      !roleValues.includes(role)) {
    return res.status(400).json({ error: 'Provide a name, email, role, and password of at least 8 characters.' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        role,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(201).json(user);
  } catch (error) {
    console.error('Creating user failed:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

router.patch('/users/:userId/role', authenticateToken, authorizeRoles(Role.ADMIN), async (req, res) => {
  const { role } = req.body ?? {};
  if (!roleValues.includes(role)) {
    return res.status(400).json({ error: 'Invalid user role.' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.json(user);
  } catch (error) {
    console.error('Updating user role failed:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

module.exports = router;
