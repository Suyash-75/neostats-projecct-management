import { Suspense } from "react";
import TaskDetails from "./task-details";

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#7b8394]">Loading task…</p>}>
      <TaskPageContent params={params} />
    </Suspense>
  );
}

async function TaskPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskDetails taskId={id} />;
}
