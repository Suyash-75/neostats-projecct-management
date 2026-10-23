"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, type Task } from "../../data";
import { AppShell, Avatar, Button, Icon, StatusBadge } from "../../components/ui";

type Comment = { author: string; initials: string; color: string; time: string; text: string };

function formatActivityTime(timestamp: string, now: Date | null) {
  const date = new Date(timestamp);
  const dateKey = (value: Date) => new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(date);

  if (now && dateKey(date) === dateKey(now)) return `Today at ${time}`;
  if (now && dateKey(date) === dateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return `Yesterday at ${time}`;

  const day = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${day} at ${time}`;
}

export default function TaskDetails({ task }: { task: Task }) {
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [commentText, setCommentText] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [comments, setComments] = useState<Comment[]>([
    { author: "Rahul Sharma", initials: "RS", color: "blue", time: "2026-10-23T10:24:00+05:30", text: "The first pass is looking great. I left a few notes on the mobile layout for us to review." },
    { author: "Suyash Pandey", initials: "SP", color: "peach", time: "2026-10-22T16:16:00+05:30", text: "Thanks! I’ll make those adjustments and share an updated version before our check-in." },
  ]);

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setComments((current) => [...current, { author: "Suyash Pandey", initials: "SP", color: "peach", time: new Date().toISOString(), text }]);
    setCommentText("");
  }

  async function shareTask() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Task link copied.");
    } catch (error) {
      console.error("Copying task link failed:", error);
      setShareMessage("Could not copy the link. Copy the page URL from your browser.");
    }
  }

  return (
    <AppShell active="My tasks">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#8991a0]"><Link href="/projects" className="hover:text-[#6558d3]">Projects</Link><Icon name="chevron" size={13} /><Link href={`/projects/${task.projectId}`} className="hover:text-[#6558d3]">{task.projectName}</Link><Icon name="chevron" size={13} /><span className="text-[#4f586a]">Task details</span></div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><div className="mb-3 flex flex-wrap items-center gap-2"><StatusBadge status={task.priority} /><span className="text-xs text-[#9299a8]">TASK-{task.id.replace(/\D/g, "")}</span></div><h1 className="text-[26px] font-semibold tracking-tight text-[#202638] sm:text-[30px]">{task.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7c8495]">{task.description}</p></div>
        <div className="flex flex-col items-end gap-1"><Button variant="secondary" onClick={shareTask}><Icon name="share" size={16} />Share</Button><span role="status" aria-live="polite" className="text-[11px] text-[#687286]">{shareMessage}</span></div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#eaecf1] bg-white p-5 sm:p-6">
            <div className="mb-5"><h2 className="text-sm font-semibold text-[#303748]">Task activity</h2><p className="mt-1 text-xs text-[#8991a0]">Updates and discussion with your team</p></div>
            <div className="space-y-5">
              {comments.map((comment, index) => <article key={`${comment.time}-${index}`} className="flex gap-3"><Avatar initials={comment.initials} color={comment.color} /><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-baseline gap-x-2"><span className="text-xs font-semibold text-[#384052]">{comment.author}</span><span className="text-[11px] text-[#9aa1b1]">{formatActivityTime(comment.time, now)}</span></div><p className="rounded-r-xl rounded-bl-xl bg-[#f7f8fa] px-4 py-3 text-[13px] leading-5 text-[#626b7d]">{comment.text}</p></div></article>)}
            </div>
            <form onSubmit={addComment} className="mt-6 flex gap-3 border-t border-[#eff0f3] pt-5">
              <Avatar initials="SP" color="peach" />
              <div className="min-w-0 flex-1"><label htmlFor="comment" className="sr-only">Write a comment</label><textarea id="comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Leave a comment..." rows={3} className="w-full resize-y rounded-lg border border-[#e6e8ee] bg-white px-3.5 py-3 text-sm leading-5 outline-none placeholder:text-[#a1a7b3] focus:border-[#a39aeb]" /><div className="mt-2 flex justify-end"><Button type="submit" disabled={!commentText.trim()} className="disabled:cursor-not-allowed disabled:opacity-50"><Icon name="message" size={15} />Post comment</Button></div></div>
            </form>
          </section>
        </div>
        <aside className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="border-b border-[#eff0f3] px-5 py-4"><h2 className="text-sm font-semibold text-[#303748]">Task details</h2></div>
          <div className="space-y-5 p-5">
            <div><label htmlFor="task-status" className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Status</label><select id="task-status" value={status} onChange={(event) => setStatus(event.target.value as Task["status"])} className="h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-medium text-[#515a6b] outline-none focus:border-[#a39aeb]"><option>To do</option><option>In progress</option><option>In review</option><option>Done</option></select><div className="mt-2"><StatusBadge status={status} /></div></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Assignee</p><div className="flex items-center gap-2.5"><Avatar initials={task.assignee.initials} color={task.assignee.color} size="sm" /><span className="text-xs font-semibold text-[#41495a]">{task.assignee.name}</span></div></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Due date</p><p className="flex items-center gap-2 text-xs font-medium text-[#4f586a]"><Icon name="calendar" size={16} className="text-[#8991a0]" />{formatDate(task.dueDate)}</p></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Project</p><Link href={`/projects/${task.projectId}`} className="flex items-center gap-2 text-xs font-semibold text-[#5d50c7] hover:underline"><Icon name="folder" size={16} />{task.projectName}<Icon name="arrow" size={14} /></Link></div>
            <div className="border-t border-[#f0f1f4] pt-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8]">Priority</p><StatusBadge status={task.priority} /></div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
