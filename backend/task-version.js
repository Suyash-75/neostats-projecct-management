async function updateTaskAtVersion(prisma, taskId, expectedVersion, data) {
  const result = await prisma.task.updateMany({
    where: { id: taskId, version: expectedVersion },
    data: { ...data, version: { increment: 1 } },
  });

  if (result.count === 1) {
    return { task: await prisma.task.findUnique({ where: { id: taskId } }), conflict: false };
  }

  const current = await prisma.task.findUnique({ where: { id: taskId } });
  if (!current) return { task: null, conflict: false };
  return { task: current, conflict: true };
}

module.exports = { updateTaskAtVersion };
