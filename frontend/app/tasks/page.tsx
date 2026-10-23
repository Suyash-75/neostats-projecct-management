"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError, formatLocalDate, type ApiPage, type Task, type TaskStatus, type UserRole } from "../lib/api";
import { AppShell, PageHeading } from "../components/ui";

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState("");

  const loadTasks = useCallback(async () => {
    const result = await apiRequest<ApiPage<Task>>(`/tasks?limit=100${statusFilter ? `&status=${statusFilter}` : ""}`);
    setTasks(result.items);
  }, [statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadTasks).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load tasks."));
  }, [loadTasks]);

  useEffect(() => {
    queueMicrotask(() => {
      setRole(window.sessionStorage.getItem("neostat-role") as UserRole | null);
      setUserId(window.sessionStorage.getItem("neostat-user-id") ?? "");
    });
  }, []);

  async function changeStatus(task: Task, status: TaskStatus) {
    setError("");
    try {
      const updated = await apiRequest<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ version: task.version, status }),
      });
      setTasks((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setError(`${cause.message} The list has been refreshed.`);
        await loadTasks();
      } else {
        setError(cause instanceof Error ? cause.message : "Could not update task status.");
      }
    }
  }

  return (
    <AppShell active="Tasks">
      <PageHeading eyebrow="Workspace" title="Tasks" description="Tasks you can access across your projects." />
      <div className="mb-5 flex flex-wrap gap-2">
        <label htmlFor="task-status-filter" className="sr-only">Filter tasks by status</label>
        <select id="task-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm text-[#50596b]">
          <option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      <section className="overflow-hidden rounded-xl border border-[#eaecf1] bg-white">
        <div className="grid grid-cols-1 gap-2 border-b border-[#eff0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8] sm:grid-cols-[1fr_170px_160px]"><span>Task</span><span>Due date</span><span>Status</span></div>
        {tasks.map((task) => {
          const membership = task.project?.projectMembers?.find((item) => item.userId === userId);
          const isProjectManager = role === "PROJECT_MANAGER" && membership?.role === "PROJECT_MANAGER";
          const canUpdate = !task.project?.archivedAt && (role === "ADMIN" || isProjectManager || (role === "TEAM_MEMBER" && membership?.role === "TEAM_MEMBER" && task.assigneeId === userId));
          return <div key={task.id} className="grid gap-2 border-b border-[#f0f1f4] px-5 py-4 last:border-0 sm:grid-cols-[1fr_170px_160px] sm:items-center">
          <span><Link href={`/tasks/${task.id}`} className="text-[13px] font-semibold text-[#384052] hover:text-[#6558d3]">{task.title}</Link><span className="mt-1 block text-[11px] text-[#939aaa]"><Link href={`/projects/${task.project?.id ?? task.projectId}`} className="hover:underline">{task.project?.name ?? "Project"}</Link> · {task.assignee?.name ?? "Unassigned"}</span></span>
          <span className="text-xs text-[#7e8798]">{formatLocalDate(task.dueDate)}</span>
          <label className="sr-only" htmlFor={`status-${task.id}`}>Status for {task.title}</label>
          <select id={`status-${task.id}`} disabled={!canUpdate} value={task.status} onChange={(event) => changeStatus(task, event.target.value as TaskStatus)} className="h-9 rounded-lg border border-[#e8eaf0] bg-white px-2 text-xs text-[#50596b] disabled:bg-[#f5f6f8]">
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>;
        })}
        {!tasks.length && <p className="px-5 py-10 text-center text-sm text-[#8991a0]">No tasks found for this status.</p>}
      </section>
    </AppShell>
  );
}
