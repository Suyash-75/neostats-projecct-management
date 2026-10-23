"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CurrentDateTime } from "../components/current-date-time";
import { AppShell, Avatar, Icon, PageHeading, ProgressBar, StatusBadge } from "../components/ui";
import { apiRequest, formatLocalDate, type ApiPage, type Project, type Task } from "../lib/api";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiRequest<ApiPage<Project>>("/projects?limit=100"),
      apiRequest<ApiPage<Task>>("/tasks?limit=100"),
    ]).then(([projectPage, taskPage]) => {
      setProjects(projectPage.items);
      setTasks(taskPage.items);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load dashboard."));
  }, []);

  const activeTasks = tasks.filter((task) => task.status !== "DONE");
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const stats = [
    { label: "Projects", value: projects.length, icon: "folder", color: "bg-[#f0edff] text-[#6558d3]" },
    { label: "Tasks in progress", value: tasks.filter((task) => task.status === "IN_PROGRESS").length, icon: "check", color: "bg-[#e8f4ff] text-[#4283bc]" },
    { label: "Completed tasks", value: completedTasks, icon: "spark", color: "bg-[#e7f7ee] text-[#31845a]" },
    { label: "Team members", value: new Set(projects.flatMap((project) => project.projectMembers.map((member) => member.user.id))).size, icon: "users", color: "bg-[#fff2df] text-[#b37a1d]" },
  ];

  return (
    <AppShell active="Overview">
      <PageHeading
        eyebrow={<CurrentDateTime />}
        title="Project dashboard"
        description="A live summary of projects and tasks you’re allowed to access."
        action={<Link href="/projects" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6558d3] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3]"><Icon name="folder" size={17} /> View projects</Link>}
      />
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      <section aria-label="Workspace statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <article key={stat.label} className="rounded-xl border border-[#eaecf1] bg-white p-5 shadow-[0_1px_2px_#20263806]">
          <div className="mb-4"><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}><Icon name={stat.icon} size={19} /></span></div>
          <p className="text-sm text-[#7b8394]">{stat.label}</p>
          <p className="mt-1.5 text-[28px] font-semibold tracking-tight text-[#202638]">{stat.value}</p>
        </article>)}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-[15px] font-semibold text-[#2a3142]">Project progress</h2><p className="mt-0.5 text-xs text-[#8991a0]">Based on tasks currently returned by the API</p></div><Link href="/projects" className="text-xs font-semibold text-[#6558d3] hover:underline">View all</Link></div>
          <div className="divide-y divide-[#f0f1f4]">{projects.slice(0, 5).map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
            const done = projectTasks.filter((task) => task.status === "DONE").length;
            const progress = projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0;
            return <Link href={`/projects/${project.id}`} key={project.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafaff] sm:grid-cols-[minmax(150px,1fr)_1fr_auto] sm:items-center">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#333a4a]">{project.name}</span><span className="block text-xs text-[#8991a0]">{project._count?.tasks ?? projectTasks.length} tasks</span></span>
              <span><span className="mb-1.5 flex justify-between text-[11px]"><span className="text-[#858d9d]">Complete</span><span className="font-medium text-[#525b6d]">{progress}%</span></span><ProgressBar value={progress} /></span>
              <span className="flex min-w-0 items-center justify-between gap-3 sm:flex-col sm:items-end"><StatusBadge status={project.archivedAt ? "Archived" : "Active"} /><span className="flex max-w-full items-center gap-2"><span className="flex shrink-0 -space-x-2">{project.projectMembers.slice(0, 3).map((member) => <Avatar key={member.user.id} initials={member.user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")} size="sm" />)}</span><span className="max-w-[140px] truncate text-[10px] text-[#687286]" title={project.projectMembers.map((member) => member.user.name).join(", ")}>{project.projectMembers.slice(0, 2).map((member) => member.user.name).join(", ")}{project.projectMembers.length > 2 ? ` +${project.projectMembers.length - 2}` : ""}</span></span></span>
            </Link>;
          })}{!projects.length && <p className="px-5 py-8 text-sm text-[#8991a0]">No projects available.</p>}</div>
        </section>
        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-[15px] font-semibold text-[#2a3142]">Active tasks</h2><p className="mt-0.5 text-xs text-[#8991a0]">Tasks in your workspace access</p></div><Link href="/tasks" className="rounded-lg p-2 text-[#8991a0] hover:bg-[#f5f6f8]" aria-label="View tasks"><Icon name="arrow" size={17} /></Link></div>
          <div className="divide-y divide-[#f0f1f4]">{activeTasks.slice(0, 5).map((task) => <Link href={`/tasks/${task.id}`} key={task.id} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafaff]">
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{task.project?.name ?? "Project"} · Due {formatLocalDate(task.dueDate)}</span></span><StatusBadge status={task.status} />
          </Link>)}{!activeTasks.length && <p className="px-5 py-8 text-sm text-[#8991a0]">No active tasks available.</p>}</div>
        </section>
      </div>
    </AppShell>
  );
}
