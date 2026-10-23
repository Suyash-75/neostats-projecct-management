require('dotenv').config();

const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { PrismaClient, Role, ProjectRole } = require('../generated/prisma');

process.env.JWT_SECRET ||= 'integration-test-secret';

const prisma = new PrismaClient();
const app = require('../server');
const userIds = [];
const extraProjectIds = [];
let projectId;
let taskId;
let server;
let baseUrl;
let tokens;

before(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Test Admin', email: `admin-${suffix}@example.test`, password: 'unused', role: Role.ADMIN } }),
    prisma.user.create({ data: { name: 'Test Project Manager', email: `manager-${suffix}@example.test`, password: 'unused', role: Role.PROJECT_MANAGER } }),
    prisma.user.create({ data: { name: 'Test Team Member', email: `member-${suffix}@example.test`, password: 'unused', role: Role.TEAM_MEMBER } }),
    prisma.user.create({ data: { name: 'Test Viewer', email: `viewer-${suffix}@example.test`, password: 'unused', role: Role.VIEWER } }),
  ]);
  userIds.push(...users.map((user) => user.id));
  const [admin, manager, member, viewer] = users;
  const project = await prisma.project.create({
    data: {
      name: `API permission test ${suffix}`,
      members: { connect: users.map(({ id }) => ({ id })) },
      projectMembers: {
        create: [
          { userId: manager.id, role: ProjectRole.PROJECT_MANAGER },
          { userId: member.id, role: ProjectRole.TEAM_MEMBER },
          { userId: viewer.id, role: ProjectRole.VIEWER },
        ],
      },
    },
  });
  projectId = project.id;
  const task = await prisma.task.create({
    data: { title: 'Versioned task', projectId, assigneeId: member.id },
  });
  taskId = task.id;
  tokens = Object.fromEntries(users.map((user) => [
    user.role,
    jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '5m' }),
  ]));

  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (projectId || extraProjectIds.length) {
    await prisma.project.deleteMany({ where: { id: { in: [projectId, ...extraProjectIds].filter(Boolean) } } });
  }
  if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

async function request(path, role, method = 'GET', body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokens[role]}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, payload: response.status === 204 ? null : await response.json() };
}

test('API enforces roles and rejects stale task updates', async () => {
  const unauthenticated = await fetch(`${baseUrl}/projects`);
  assert.equal(unauthenticated.status, 401);

  const adminCreatedProject = await request('/projects', 'ADMIN', 'POST', {
    name: `Admin-created project ${Date.now()}`,
    description: 'Created through the project form.',
  });
  assert.equal(adminCreatedProject.response.status, 201);
  extraProjectIds.push(adminCreatedProject.payload.id);
  assert.equal(adminCreatedProject.payload.description, 'Created through the project form.');
  const projectPage = await request('/projects?limit=100', 'ADMIN');
  assert.equal(projectPage.response.status, 200);
  assert.ok(projectPage.payload.items.some((project) => project.id === adminCreatedProject.payload.id));
  for (const role of ['PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER']) {
    const memberProjectPage = await request('/projects?limit=100', role);
    assert.equal(memberProjectPage.response.status, 200, `${role} should be able to fetch projects`);
    assert.ok(memberProjectPage.payload.items.some((project) => project.id === projectId), `${role} should see their project`);
  }

  const managerCreatedProject = await request('/projects', 'PROJECT_MANAGER', 'POST', {
    name: `Manager-created project ${Date.now()}`,
  });
  assert.equal(managerCreatedProject.response.status, 201);
  extraProjectIds.push(managerCreatedProject.payload.id);
  assert.ok(managerCreatedProject.payload.projectMembers.some((member) =>
    member.user.id === userIds[1] && member.role === 'PROJECT_MANAGER'
  ));
  const managerProjectDetails = await request(`/projects/${managerCreatedProject.payload.id}`, 'PROJECT_MANAGER');
  assert.equal(managerProjectDetails.response.status, 200);
  assert.equal(managerProjectDetails.payload.projectMembers[0].user.name, 'Test Project Manager');

  const deniedTaskCreation = await request(`/projects/${projectId}/tasks`, 'VIEWER', 'POST', { title: 'Unauthorized task' });
  assert.equal(deniedTaskCreation.response.status, 403);

  const deniedViewerUpdate = await request(`/tasks/${taskId}`, 'VIEWER', 'PATCH', {
    version: 1,
    status: 'IN_PROGRESS',
  });
  assert.equal(deniedViewerUpdate.response.status, 403);

  const deniedViewerComment = await request(`/tasks/${taskId}/comments`, 'VIEWER', 'POST', { content: 'Should not be allowed' });
  assert.equal(deniedViewerComment.response.status, 403);

  const invalidManagerRole = await request(
    `/projects/${projectId}/members/${userIds[3]}`,
    'ADMIN',
    'PATCH',
    { role: 'PROJECT_MANAGER' },
  );
  assert.equal(invalidManagerRole.response.status, 400);

  const deniedTitleEdit = await request(`/tasks/${taskId}`, 'TEAM_MEMBER', 'PATCH', {
    version: 1,
    title: 'Unauthorized title change',
  });
  assert.equal(deniedTitleEdit.response.status, 403);

  const acceptedStatusChange = await request(`/tasks/${taskId}`, 'TEAM_MEMBER', 'PATCH', {
    version: 1,
    status: 'IN_PROGRESS',
  });
  assert.equal(acceptedStatusChange.response.status, 200);
  assert.equal(acceptedStatusChange.payload.version, 2);

  const staleStatusChange = await request(`/tasks/${taskId}`, 'TEAM_MEMBER', 'PATCH', {
    version: 1,
    status: 'DONE',
  });
  assert.equal(staleStatusChange.response.status, 409);
  assert.equal(staleStatusChange.payload.current.version, 2);

  const archiveProject = await request(`/projects/${projectId}/archive`, 'ADMIN', 'PATCH', { archived: true });
  assert.equal(archiveProject.response.status, 200);
  const deniedArchivedComment = await request(`/tasks/${taskId}/comments`, 'TEAM_MEMBER', 'POST', { content: 'Archived task update' });
  assert.equal(deniedArchivedComment.response.status, 409);
  const restoreProject = await request(`/projects/${projectId}/archive`, 'ADMIN', 'PATCH', { archived: false });
  assert.equal(restoreProject.response.status, 200);
});
