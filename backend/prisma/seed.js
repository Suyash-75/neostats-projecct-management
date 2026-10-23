require('dotenv').config();

const bcrypt = require('bcrypt');
const { PrismaClient, Role, ProjectRole, TaskStatus, TaskPriority } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const seedUsers = [
    { name: 'Neostat Admin', email: 'admin@neostats.com', role: Role.ADMIN },
    { name: 'Project Manager', email: 'pm@neostats.com', role: Role.PROJECT_MANAGER },
    { name: 'Team Member', email: 'member@neostats.com', role: Role.TEAM_MEMBER },
    { name: 'Workspace Viewer', email: 'viewer@neostats.com', role: Role.VIEWER },
  ];

  const users = await Promise.all(seedUsers.map(({ name, email, role }) =>
    prisma.user.upsert({
      where: { email },
      update: { name, password, role, isActive: true },
      create: { name, email, password, role, isActive: true },
    })
  ));

  const project = await prisma.project.upsert({
    where: { name: 'Neostats Alpha Rollout' },
    update: { description: 'Core project management platform development.', archivedAt: null },
    create: { name: 'Neostats Alpha Rollout', description: 'Core project management platform development.' },
  });

  for (const user of users) {
    await prisma.project.update({
      where: { id: project.id },
      data: { members: { connect: { id: user.id } } },
    });
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: user.id } },
      update: {
        role: user.role === Role.PROJECT_MANAGER
          ? ProjectRole.PROJECT_MANAGER
          : user.role === Role.VIEWER
            ? ProjectRole.VIEWER
            : ProjectRole.TEAM_MEMBER,
      },
      create: {
        projectId: project.id,
        userId: user.id,
        role: user.role === Role.PROJECT_MANAGER
          ? ProjectRole.PROJECT_MANAGER
          : user.role === Role.VIEWER
            ? ProjectRole.VIEWER
            : ProjectRole.TEAM_MEMBER,
      },
    });
  }

  const [admin, manager, member] = users;
  const seedTasks = [
    { id: 'seed-task-schema', title: 'Set up database schema', status: TaskStatus.DONE, priority: TaskPriority.HIGH, assigneeId: admin.id },
    { id: 'seed-task-rbac', title: 'Implement role-based access', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, assigneeId: manager.id },
    { id: 'seed-task-conflicts', title: 'Build task conflict detection', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assigneeId: member.id },
  ];

  await Promise.all(seedTasks.map((task) =>
    prisma.task.upsert({
      where: { id: task.id },
      update: { ...task, projectId: project.id },
      create: { ...task, projectId: project.id },
    })
  ));

  console.log('Seed complete. All demo accounts use password123:');
  for (const { email, role } of users) {
    console.log(`  ${role}: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
