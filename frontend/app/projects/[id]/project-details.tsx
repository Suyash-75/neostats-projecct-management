"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, formatLocalDate, type Project, type ProjectRole, type TaskPriority, type User, type UserRole } from "../../lib/api";
import { AppShell, Avatar, Button, Icon, StatusBadge } from "../../components/ui";

type Tab = "Overview" | "Tasks" | "Team";
const EMPTY_TASKS: NonNullable<Project["tasks"]> = [];

export default function ProjectDetails({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("Overview");
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberRole, setMemberRole] = useState<ProjectRole>("TEAM_MEMBER");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");

  const loadProject = useCallback(async () => {
    const result = await apiRequest<Project>(`/projects/${projectId}`);
    setProject(result);
    setName(result.name);
    setDescription(result.description ?? "");
  }, [projectId]);

  useEffect(() => {
    queueMicrotask(() => {
      setRole(window.sessionStorage.getItem("neostat-role") as UserRole | null);
      setUserId(window.sessionStorage.getItem("neostat-user-id") ?? "");
    });
    void Promise.resolve().then(loadProject).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load project."));
  }, [loadProject]);

  const canManage = role === "ADMIN" || (role === "PROJECT_MANAGER" && Boolean(project?.projectMembers.some((member) => member.user.id === userId && member.role === "PROJECT_MANAGER")));
  const members = project?.projectMembers ?? [];
  const tasks = project?.tasks ?? EMPTY_TASKS;
  const taskProgress = tasks.length ? Math.round(tasks.filter((task) => task.status === "DONE").length / tasks.length * 100) : 0;

  const recentTasks = useMemo(() => [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [tasks]);

  const loadEligibleUsers = useCallback(async () => {
    const result = await apiRequest<User[]>(`/projects/${projectId}/available-members`);
    setEligibleUsers(result);
  }, [projectId]);

  async function updateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ name, description }) });
      await loadProject();
      setShowEdit(false);
      setNotice("Project updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update project.");
    } finally {
      setBusy(false);
    }
  }

  async function updateArchive(archived: boolean) {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/projects/${projectId}/archive`, { method: "PATCH", body: JSON.stringify({ archived }) });
      await loadProject();
      setNotice(archived ? "Project archived. It remains available to restore." : "Project restored.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update archive status.");
    } finally {
      setBusy(false);
    }
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/projects/${projectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription || null,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssignee || null,
        }),
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskAssignee("");
      setShowTaskForm(false);
      await loadProject();
      setNotice("Task created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create task.");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberId) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberId, role: memberRole }),
      });
      setMemberId("");
      await Promise.all([loadProject(), loadEligibleUsers()]);
      setNotice("Team member added.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add member.");
    } finally {
      setBusy(false);
    }
  }

  async function changeMemberRole(targetId: string, nextRole: ProjectRole) {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/projects/${projectId}/members/${targetId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      await loadProject();
      setNotice("Project role updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update member role.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(targetId: string) {
    if (!window.confirm("Remove this member from the project? Their task assignments will remain visible to project managers.")) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/projects/${projectId}/members/${targetId}`, { method: "DELETE" });
      await loadProject();
      setNotice("Member removed from project.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove member.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (tab === "Team" && canManage) {
      void Promise.resolve().then(loadEligibleUsers).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load users."));
    }
  }, [tab, canManage, loadEligibleUsers]);

  if (!project) return <AppShell active="Projects"><p role={error ? "alert" : "status"} className="text-sm text-[#7b8394]">{error || "Loading project…"}</p></AppShell>;

  return (
    <AppShell active="Projects">
      <div className="mb-5 flex items-center gap-2 text-xs text-[#8991a0]"><Link href="/projects" className="hover:text-[#6558d3]">Projects</Link><Icon name="chevron" size={13} /><span className="text-[#4f586a]">{project.name}</span></div>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#8b91a0]">{project.archivedAt ? "Archived project" : "Project workspace"}</p><h1 className="text-[26px] font-semibold tracking-tight text-[#202638] sm:text-[30px]">{project.name}</h1><p className="mt-1.5 text-sm text-[#7c8495]">{project.description || "No description provided."}</p></div>
        {canManage && <div className="flex gap-2">{!project.archivedAt && <Button variant="secondary" onClick={() => setShowEdit((open) => !open)}><Icon name="edit" size={16} /> Edit</Button>}<Button variant="secondary" disabled={busy} onClick={() => updateArchive(!project.archivedAt)}>{project.archivedAt ? "Restore project" : "Archive project"}</Button></div>}
      </div>
      {showEdit && canManage && !project.archivedAt && <form onSubmit={updateProject} className="mb-5 grid gap-3 rounded-xl border border-[#eaecf1] bg-white p-5">
        <label className="text-xs font-semibold text-[#50596b]">Project name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Description<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-[#e8eaf0] p-3 text-sm font-normal" /></label>
        <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button><Button type="button" variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button></div>
      </form>}
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-[#e8f7ef] px-4 py-3 text-sm text-[#23774e]">{notice}</p>}
      <section className="mb-6 grid gap-4 rounded-xl border border-[#eaecf1] bg-white p-5 sm:grid-cols-3">
        <div><p className="text-[11px] text-[#939aaa]">Status</p><div className="mt-2"><StatusBadge status={project.archivedAt ? "Archived" : "Active"} /></div></div>
        <div><p className="text-[11px] text-[#939aaa]">Project members</p><p className="mt-2 text-sm font-semibold text-[#3a4252]">{members.length}</p></div>
        <div><p className="text-[11px] text-[#939aaa]">Task completion</p><p className="mt-2 text-sm font-semibold text-[#3a4252]">{taskProgress}% · {tasks.filter((task) => task.status === "DONE").length}/{tasks.length}</p></div>
      </section>
      <div className="mb-5 flex gap-5 border-b border-[#e8eaf0]">
        {(["Overview", "Tasks", "Team"] as Tab[]).map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${tab === item ? "border-[#6558d3] text-[#5f52c7]" : "border-transparent text-[#8991a0]"}`}>{item}{item === "Tasks" && <span className="ml-2 rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[10px]">{tasks.length}</span>}{item === "Team" && <span className="ml-2 rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[10px]">{members.length}</span>}</button>)}
      </div>

      {tab === "Overview" && <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#303748]">Recent tasks</h2><p className="mt-1 text-xs text-[#8991a0]">{tasks.length} tasks in this project</p></div><button type="button" onClick={() => setTab("Tasks")} className="text-xs font-semibold text-[#6558d3]">View all</button></div>
          <div className="divide-y divide-[#f0f1f4]">{recentTasks.slice(0, 5).map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#fafaff]"><span><span className="block text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">Due {formatLocalDate(task.dueDate)}</span></span><StatusBadge status={task.status} /></Link>)}{!tasks.length && <p className="px-5 py-8 text-sm text-[#8991a0]">No tasks yet.</p>}</div>
        </section>
        <section className="rounded-xl border border-[#eaecf1] bg-white p-5">
          <h2 className="text-sm font-semibold text-[#303748]">Project team</h2><p className="mt-1 text-xs text-[#8991a0]">People assigned to this project</p>
          <div className="mt-4 space-y-4">{members.map((member) => <div key={member.user.id} className="flex items-center gap-3"><Avatar initials={member.user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")} /><div><p className="text-xs font-semibold text-[#3c4454]">{member.user.name}</p><p className="mt-0.5 text-[11px] text-[#9299a8]">{member.role.replaceAll("_", " ")}</p></div></div>)}</div>
        </section>
      </div>}

      {tab === "Tasks" && <section className="overflow-hidden rounded-xl border border-[#eaecf1] bg-white">
        <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#303748]">Project tasks</h2><p className="mt-1 text-xs text-[#8991a0]">{tasks.length} tasks</p></div>{canManage && !project.archivedAt && <Button onClick={() => setShowTaskForm((open) => !open)}><Icon name="plus" size={16} /> Add task</Button>}</div>
        {showTaskForm && <form onSubmit={createTask} className="grid gap-3 border-b border-[#eff0f3] bg-[#fbfbfd] p-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#50596b]">Title<input required maxLength={200} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[#50596b]">Description<input value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[#50596b]">Priority<select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as TaskPriority)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
          <label className="text-xs font-semibold text-[#50596b]">Due date<input type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold text-[#50596b] sm:col-span-2">Assignee<select value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal"><option value="">Unassigned</option>{members.filter((member) => member.role !== "VIEWER" && member.user.isActive).map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label>
          <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create task"}</Button><Button type="button" variant="secondary" onClick={() => setShowTaskForm(false)}>Cancel</Button></div>
        </form>}
        <div className="divide-y divide-[#f0f1f4]">{tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="grid gap-2 px-5 py-4 hover:bg-[#fafaff] sm:grid-cols-[1fr_160px_130px] sm:items-center"><span><span className="block text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{task.assignee?.name ?? "Unassigned"}</span></span><span className="text-xs text-[#7e8798]">Due {formatLocalDate(task.dueDate)}</span><StatusBadge status={task.status} /></Link>)}{!tasks.length && <p className="px-5 py-10 text-center text-sm text-[#8991a0]">No tasks yet.</p>}</div>
      </section>}

      {tab === "Team" && <section className="rounded-xl border border-[#eaecf1] bg-white">
        <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#303748]">Team members</h2><p className="mt-1 text-xs text-[#8991a0]">Project-level roles and access</p></div></div>
        {canManage && !project.archivedAt && <form onSubmit={addMember} className="grid gap-2 border-b border-[#eff0f3] bg-[#fbfbfd] p-4 sm:grid-cols-[1fr_180px_auto]">
          <label className="sr-only" htmlFor="new-member">Choose a user</label><select id="new-member" required value={memberId} onChange={(event) => setMemberId(event.target.value)} className="h-10 rounded-lg border border-[#e3e6ed] bg-white px-3 text-sm"><option value="">Select a workspace user</option>{eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}</select>
          <label className="sr-only" htmlFor="new-member-role">Project role</label><select id="new-member-role" value={memberRole} onChange={(event) => setMemberRole(event.target.value as ProjectRole)} className="h-10 rounded-lg border border-[#e3e6ed] bg-white px-3 text-sm"><option value="TEAM_MEMBER">Team member</option><option value="VIEWER">Viewer</option>{role === "ADMIN" && eligibleUsers.find((user) => user.id === memberId)?.role === "PROJECT_MANAGER" && <option value="PROJECT_MANAGER">Project manager</option>}</select>
          <Button type="submit" disabled={busy || !memberId}><Icon name="plus" size={16} /> Add member</Button>
        </form>}
        <div className="divide-y divide-[#f0f1f4]">{members.map((member) => <div key={member.user.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><Avatar initials={member.user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")} /><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#384052]">{member.user.name}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{member.user.email}</span></span>{canManage && !project.archivedAt ? <><select aria-label={`Role for ${member.user.name}`} disabled={busy || (role !== "ADMIN" && member.role === "PROJECT_MANAGER")} value={member.role} onChange={(event) => changeMemberRole(member.user.id, event.target.value as ProjectRole)} className="h-9 rounded-lg border border-[#e8eaf0] bg-white px-2 text-xs"><option value="TEAM_MEMBER">Team member</option><option value="VIEWER">Viewer</option>{role === "ADMIN" && member.user.role === "PROJECT_MANAGER" && <option value="PROJECT_MANAGER">Project manager</option>}</select><Button type="button" variant="secondary" disabled={busy || (member.user.id === userId && role !== "ADMIN")} onClick={() => removeMember(member.user.id)}>Remove</Button></> : <span className="rounded-md bg-[#f5f6f8] px-2.5 py-1.5 text-[11px] font-medium text-[#70798b]">{member.role.replaceAll("_", " ")}</span>}</div>)}</div>
      </section>}
    </AppShell>
  );
}
