"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError, type ApiPage, type Project, type UserRole } from "../lib/api";
import { AppShell, Button, Icon, PageHeading, StatusBadge } from "../components/ui";

type ProjectFilter = "Active" | "Archived";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectFilter>("Active");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState("");

  const loadProjects = useCallback(async () => {
    const result = await apiRequest<ApiPage<Project>>(`/projects?limit=100${filter === "Archived" ? "&archived=true" : ""}`);
    setProjects(result.items);
  }, [filter]);

  useEffect(() => {
    setRole(window.sessionStorage.getItem("neostat-role") as UserRole | null);
    setUserId(window.sessionStorage.getItem("neostat-user-id") ?? "");
  }, []);

  useEffect(() => {
    loadProjects().catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load projects."));
  }, [loadProjects]);

  const visibleProjects = useMemo(() => projects.filter((project) =>
    `${project.name} ${project.description ?? ""}`.toLowerCase().includes(query.toLowerCase())
  ), [projects, query]);
  const canCreate = role === "ADMIN" || role === "PROJECT_MANAGER";

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await apiRequest<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({ name, description }),
      });
      setName("");
      setDescription("");
      setShowCreate(false);
      setMessage("Project created.");
      await loadProjects();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create project.");
    } finally {
      setBusy(false);
    }
  }

  async function changeArchive(project: Project, archived: boolean) {
    setError("");
    setBusy(true);
    try {
      await apiRequest(`/projects/${project.id}/archive`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      });
      await loadProjects();
      setMessage(archived ? "Project archived." : "Project restored.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update project.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell active="Projects">
      <PageHeading
        eyebrow="Workspace"
        title="Projects"
        description="Projects you’re authorized to access."
        action={canCreate ? <Button onClick={() => setShowCreate((show) => !show)}><Icon name="plus" size={17} /> Create project</Button> : undefined}
      />
      {showCreate && <form onSubmit={createProject} className="mb-5 grid gap-3 rounded-xl border border-[#eaecf1] bg-white p-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#50596b]">Project name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal outline-none focus:border-[#a39aeb]" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Description<input maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal outline-none focus:border-[#a39aeb]" /></label>
        <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button><Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button></div>
      </form>}
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg border border-[#e9ebf1] bg-white p-1">
          {(["Active", "Archived"] as const).map((item) => <button key={item} type="button" onClick={() => { setFilter(item); setError(""); }} className={`rounded-md px-3 py-2 text-xs font-semibold ${filter === item ? "bg-[#f1efff] text-[#5e51c8]" : "text-[#7b8394]"}`}>{item}</button>)}
        </div>
        <label className="relative block sm:w-[280px]"><Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa1b1]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects…" className="h-10 w-full rounded-lg border border-[#e8eaf0] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[#9ba2b1] focus:border-[#a39aeb]" /></label>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-[#e8f7ef] px-4 py-3 text-sm text-[#23774e]">{message}</p>}
      <p className="mb-4 text-xs text-[#858d9d]">Showing <span className="font-semibold text-[#4b5363]">{visibleProjects.length}</span> projects</p>
      {visibleProjects.length ? <div className="grid gap-4 lg:grid-cols-2">
        {visibleProjects.map((project) => {
          const memberCount = project.projectMembers.length;
          const taskCount = project._count?.tasks ?? 0;
          const canManage = role === "ADMIN" || (role === "PROJECT_MANAGER" && project.projectMembers.some((member) => member.user.id === userId && member.role === "PROJECT_MANAGER"));
          return <article key={project.id} className="rounded-xl border border-[#eaecf1] bg-white p-5 shadow-[0_1px_2px_#20263806] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><Link href={`/projects/${project.id}`} className="text-[15px] font-semibold text-[#303748] hover:text-[#6558d3]">{project.name}</Link><p className="mt-1 text-xs text-[#8991a0]">{memberCount} members · {taskCount} tasks</p></div>
              <StatusBadge status={project.archivedAt ? "Archived" : "Active"} />
            </div>
            <p className="my-5 min-h-10 text-[13px] leading-5 text-[#7b8394]">{project.description || "No description provided."}</p>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f1f4] pt-4">
              <Link href={`/projects/${project.id}`} className="text-xs font-semibold text-[#6558d3] hover:underline">Open project →</Link>
              {canManage && <Button type="button" variant="secondary" disabled={busy} onClick={() => changeArchive(project, !project.archivedAt)}>{project.archivedAt ? "Restore" : "Archive"}</Button>}
            </div>
          </article>;
        })}
      </div> : <div className="rounded-xl border border-dashed border-[#dfe2e9] bg-white px-6 py-16 text-center"><h2 className="font-semibold text-[#303748]">No projects found</h2><p className="mt-1 text-sm text-[#8991a0]">Projects appear here when you’re a member or an admin.</p></div>}
    </AppShell>
  );
}
