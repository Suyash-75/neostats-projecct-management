const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');
const { authenticateToken, authorizeRoles } = require('../auth');

const router = express.Router();
const roleValues = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'];

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
    const projects = await prisma.project.findMany({
      include: { tasks: true, members: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(projects);
  } catch (error) {
    console.error('Fetching projects failed:', error);
    return res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

router.post('/projects', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER'), async (req, res) => {
  const { name, description } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'A project name is required.' });
  }

  try {
    const project = await prisma.project.create({
      data: { name: name.trim(), description: typeof description === 'string' ? description : null },
    });
    return res.status(201).json(project);
  } catch (error) {
    console.error('Creating project failed:', error);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

module.exports = router;
