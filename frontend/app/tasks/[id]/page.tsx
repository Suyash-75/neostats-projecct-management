import TaskDetails from "./task-details";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetails taskId={id} />;
}
