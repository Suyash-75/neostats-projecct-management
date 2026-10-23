require('dotenv').config();

const bcrypt = require('bcrypt');
const { PrismaClient, Role, TaskStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neostats.com' },
    update: {
      name: 'Admin User',
      password,
      role: Role.ADMIN,
    },
    create: {
      name: 'Admin User',
      email: 'admin@neostats.com',
      password,
      role: Role.ADMIN,
    },
  });

  const project = await prisma.project.upsert({
    where: { name: 'Neostats Alpha Rollout' },
    update: {},
    create: {
      name: 'Neostats Alpha Rollout',
      description: 'Core project management platform development.',
      members: { connect: { id: admin.id } },
      tasks: {
        create: [
          { title: 'Set up database schema', status: TaskStatus.DONE },
          { title: 'Implement role-based access', status: TaskStatus.IN_PROGRESS },
          { title: 'Build task conflict detection', status: TaskStatus.TODO },
        ],
      },
    },
  });

  console.log(`Seed complete: ${admin.email} and project "${project.name}".`);
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
