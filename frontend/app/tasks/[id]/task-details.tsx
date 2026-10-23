"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError, formatLocalDate, type ApiPage, type ProjectMember, type Task, type TaskComment, type TaskPriority, type TaskStatus, type UserRole } from "../../lib/api";
import { AppShell, Avatar, Button, Icon, StatusBadge } from "../../components/ui";

function formatActivityTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

export default function TaskDetails({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const loadTask = useCallback(async () => {
    const result = await apiRequest<Task>(`/tasks/${taskId}`);
    setTask(result);
    setEditTitle(result.title);
    setEditDescription(result.description ?? "");
    setEditPriority(result.priority);
    setEditDueDate(result.dueDate ? result.dueDate.slice(0, 10) : "");
    setEditAssignee(result.assigneeId ?? "");
    return result;
  }, [taskId]);

  const loadComments = useCallback(async () => {
    const result = await apiRequest<ApiPage<TaskComment>>(`/tasks/${taskId}/comments?limit=100`);
    setComments(result.items);
  }, [taskId]);

  useEffect(() => {
    queueMicrotask(() => {
      setRole(window.sessionStorage.getItem("neostat-role") as UserRole | null);
      setUserId(window.sessionStorage.getItem("neostat-user-id") ?? "");
    });
    void Promise.resolve().then(loadTask).then(async (current) => {
      const [commentPage, projectMembers] = await Promise.all([
        apiRequest<ApiPage<TaskComment>>(`/tasks/${taskId}/comments?limit=100`),
        apiRequest<ProjectMember[]>(`/projects/${current.projectId}/members`),
      ]);
      setComments(commentPage.items);
      setMembers(projectMembers);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load task details."));
  }, [loadTask, taskId]);

  const canManage = role === "ADMIN" || (role === "PROJECT_MANAGER" && members.some((member) => member.user.id === userId && member.role === "PROJECT_MANAGER"));
  const currentMembership = members.find((member) => member.user.id === userId);
  const canUpdateStatus = canManage || (role === "TEAM_MEMBER" && currentMembership?.role === "TEAM_MEMBER" && task?.assigneeId === userId);
  const canComment = role === "ADMIN" ||
    (role === "PROJECT_MANAGER" && currentMembership?.role === "PROJECT_MANAGER") ||
    (role === "TEAM_MEMBER" && currentMembership?.role === "TEAM_MEMBER");
  const canChangeComments = !task?.project?.archivedAt || role === "ADMIN";

  async function updateTask(changes: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "dueDate" | "assigneeId">>) {
    if (!task) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await apiRequest<Task>(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ version: task.version, ...changes }),
      });
      setTask(updated);
      setEditTitle(updated.title);
      setEditDescription(updated.description ?? "");
      setEditPriority(updated.priority);
      setEditDueDate(updated.dueDate ? updated.dueDate.slice(0, 10) : "");
      setEditAssignee(updated.assigneeId ?? "");
      setNotice("Task saved.");
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setError(cause.message);
        const latest = await loadTask().catch((loadError) => {
          console.error("Refreshing task after conflict failed:", loadError);
          return null;
        });
        if (latest) setNotice(`Latest server version is ${latest.version}. Review the current task before saving again.`);
      } else {
        setError(cause instanceof Error ? cause.message : "Could not update task.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await updateTask({
      title: editTitle,
      description: editDescription || null,
      priority: editPriority,
      dueDate: editDueDate ? new Date(`${editDueDate}T12:00:00+05:30`).toISOString() : null,
      assigneeId: editAssignee || null,
    });
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify({ content }) });
      setCommentText("");
      await loadComments();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add comment.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
      await loadComments();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete comment.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    if (!task || !window.confirm("Delete this task and its comments? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/tasks/${task.id}`, { method: "DELETE" });
      router.push("/tasks");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete task.");
      setBusy(false);
    }
  }

  async function shareTask() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Link copied.");
    } catch (cause) {
      console.error("Copying task link failed:", cause);
      setShareMessage("Could not copy link.");
    }
  }

  if (!task) return <AppShell active="Tasks"><p role={error ? "alert" : "status"} className="text-sm text-[#7b8394]">{error || "Loading task…"}</p></AppShell>;

  return (
    <AppShell active="Tasks">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#8991a0]"><Link href="/projects" className="hover:text-[#6558d3]">Projects</Link><Icon name="chevron" size={13} /><Link href={`/projects/${task.projectId}`} className="hover:text-[#6558d3]">{task.project?.name ?? "Project"}</Link><Icon name="chevron" size={13} /><span className="text-[#4f586a]">Task details</span></div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={task.priority} /><span className="text-xs text-[#9299a8]">{task.id}</span></div><h1 className="text-[26px] font-semibold tracking-tight text-[#202638] sm:text-[30px]">{task.title}</h1><p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-[#7c8495]">{task.description || "No description provided."}</p></div>
        <div className="flex flex-col items-end gap-2"><Button variant="secondary" onClick={shareTask}><Icon name="share" size={16} /> Share</Button><span role="status" className="text-[11px] text-[#687286]">{shareMessage}</span>{canManage && !task.project?.archivedAt && <Button variant="secondary" onClick={() => setShowEdit((open) => !open)}><Icon name="edit" size={16} /> Edit task</Button>}</div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-[#e8f7ef] px-4 py-3 text-sm text-[#23774e]">{notice}</p>}
      {showEdit && canManage && !task.project?.archivedAt && <form onSubmit={saveTask} className="mb-5 grid gap-3 rounded-xl border border-[#eaecf1] bg-white p-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#50596b]">Title<input required maxLength={200} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Priority<select value={editPriority} onChange={(event) => setEditPriority(event.target.value as TaskPriority)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label>
        <label className="text-xs font-semibold text-[#50596b]">Description<textarea maxLength={5000} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-[#e8eaf0] p-3 text-sm font-normal" /></label>
        <div className="grid gap-3"><label className="text-xs font-semibold text-[#50596b]">Due date<input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal" /></label><label className="text-xs font-semibold text-[#50596b]">Assignee<select value={editAssignee} onChange={(event) => setEditAssignee(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal"><option value="">Unassigned</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select></label></div>
        <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save task"}</Button><Button type="button" variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button></div>
      </form>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-xl border border-[#eaecf1] bg-white p-5 sm:p-6">
          <div className="mb-5"><h2 className="text-sm font-semibold text-[#303748]">Task comments</h2><p className="mt-1 text-xs text-[#8991a0]">{comments.length} comments · version {task.version}</p></div>
          <div className="space-y-5">{comments.map((comment) => <article key={comment.id} className="flex gap-3"><Avatar initials={comment.author.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")} /><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><span className="text-xs font-semibold text-[#384052]">{comment.author.name}</span><span className="text-[11px] text-[#9aa1b1]">{formatActivityTime(comment.createdAt)}</span></div><p className="whitespace-pre-wrap rounded-r-xl rounded-bl-xl bg-[#f7f8fa] px-4 py-3 text-[13px] leading-5 text-[#626b7d]">{comment.content}</p>{canChangeComments && ((comment.authorId === userId && canComment) || canManage) && <button type="button" disabled={busy} onClick={() => deleteComment(comment.id)} className="mt-2 text-[11px] font-medium text-[#a63d35] hover:underline">Delete comment</button>}</div></article>)}{!comments.length && <p className="text-sm text-[#8991a0]">No comments yet.</p>}</div>
          {canComment && !task.project?.archivedAt && <form onSubmit={addComment} className="mt-6 border-t border-[#eff0f3] pt-5"><label htmlFor="comment" className="mb-2 block text-xs font-semibold text-[#50596b]">Add a comment</label><textarea id="comment" maxLength={5000} required value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write an update…" rows={3} className="w-full resize-y rounded-lg border border-[#e6e8ee] bg-white px-3.5 py-3 text-sm leading-5 outline-none focus:border-[#a39aeb]" /><div className="mt-2 flex justify-end"><Button type="submit" disabled={busy || !commentText.trim()}><Icon name="message" size={15} /> Post comment</Button></div></form>}
        </section>
        <aside className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="border-b border-[#eff0f3] px-5 py-4"><h2 className="text-sm font-semibold text-[#303748]">Task details</h2></div>
          <div className="space-y-5 p-5">
            <div><label htmlFor="task-status" className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Status</label><select id="task-status" disabled={!canUpdateStatus || busy || Boolean(task.project?.archivedAt)} value={task.status} onChange={(event) => updateTask({ status: event.target.value as TaskStatus })} className="h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-medium text-[#515a6b] disabled:bg-[#f5f6f8]"><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="IN_REVIEW">In review</option><option value="DONE">Done</option></select>{!canUpdateStatus && <p className="mt-1 text-[11px] text-[#8991a0]">Only project managers or the assignee can update status.</p>}</div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Assignee</p><p className="text-xs font-semibold text-[#41495a]">{task.assignee?.name ?? "Unassigned"}</p></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Due date</p><p className="flex items-center gap-2 text-xs font-medium text-[#4f586a]"><Icon name="calendar" size={16} className="text-[#8991a0]" />{formatLocalDate(task.dueDate)}</p></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Project</p><Link href={`/projects/${task.projectId}`} className="flex items-center gap-2 text-xs font-semibold text-[#5d50c7] hover:underline"><Icon name="folder" size={16} />{task.project?.name ?? "Open project"}<Icon name="arrow" size={14} /></Link></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Priority</p><StatusBadge status={task.priority} /></div>
            {canManage && <div className="border-t border-[#f0f1f4] pt-4"><Button variant="secondary" disabled={busy} onClick={deleteTask} className="w-full text-[#a63d35]">Delete task</Button></div>}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
