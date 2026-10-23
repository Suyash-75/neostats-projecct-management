import { notFound } from "next/navigation";
import TaskDetails from "./task-details";
import { tasks } from "../../data";

export function generateStaticParams() {
  return tasks.map(({ id }) => ({ id }));
}

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = tasks.find((item) => item.id === id);
  if (!task) notFound();
  return <TaskDetails task={task} />;
}
