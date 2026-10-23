"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionNoticeButton } from "../../components/action-notice-button";
import type { Project } from "../../data";
import { formatDate, tasks } from "../../data";
import { AppShell, Avatar, Button, Icon, PageHeading, ProgressBar, StatusBadge } from "../../components/ui";

type Tab = "Overview" | "Tasks" | "Team";

export default function ProjectDetails({ project }: { project: Project }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const projectTasks = tasks.filter((task) => task.projectId === project.id);

  function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!address) return;
    setInvited((members) => [...members, address]);
    setEmail("");
    setShowInvite(false);
  }

  return (
    <AppShell active="Projects">
      <div className="mb-5 flex items-center gap-2 text-xs text-[#8991a0]"><Link href="/projects" className="hover:text-[#6558d3]">Projects</Link><Icon name="chevron" size={13} /><span className="text-[#4f586a]">{project.name}</span></div>
      <PageHeading
        title={project.name}
        description={project.description}
        action={<>
          <ActionNoticeButton
            title="Edit project"
            message="Project editing is not connected to the API yet. Project details on this page are sample data."
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e3e6ed] bg-white px-3.5 text-sm font-semibold text-[#444d60] transition hover:bg-[#f8f9fb]"
          ><Icon name="edit" size={16} /> Edit project</ActionNoticeButton>
          <ActionNoticeButton
            title="Add a task"
            message="Task creation is not connected to the API yet. Tasks shown on this page are sample data."
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6558d3] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3]"
          ><Icon name="plus" size={16} /> Add task</ActionNoticeButton>
        </>}
      />
      <section className="mb-6 rounded-xl border border-[#eaecf1] bg-white p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <div><p className="mb-1 text-[11px] font-medium text-[#939aaa]">Client</p><p className="text-sm font-semibold text-[#3a4252]">{project.client}</p></div>
            <div><p className="mb-1 text-[11px] font-medium text-[#939aaa]">Due date</p><p className="flex items-center gap-1.5 text-sm font-medium text-[#3a4252]"><Icon name="calendar" size={15} className="text-[#858d9d]" />{formatDate(project.dueDate)}</p></div>
            <div><p className="mb-1 text-[11px] font-medium text-[#939aaa]">Status</p><StatusBadge status={project.status} /></div>
          </div>
          <div className="min-w-[200px] sm:w-[250px]"><div className="mb-2 flex justify-between text-xs"><span className="text-[#858d9d]">Overall progress</span><span className="font-semibold text-[#525b6d]">{project.progress}%</span></div><ProgressBar value={project.progress} /></div>
        </div>
      </section>
      <div className="mb-5 flex gap-5 border-b border-[#e8eaf0]">
        {(["Overview", "Tasks", "Team"] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`border-b-2 px-1 pb-3 text-sm font-semibold transition ${tab === item ? "border-[#6558d3] text-[#5f52c7]" : "border-transparent text-[#8991a0] hover:text-[#4b5363]"}`}>{item}{item === "Tasks" && <span className="ml-2 rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[10px]">{project.tasks}</span>}{item === "Team" && <span className="ml-2 rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[10px]">{project.members.length + invited.length}</span>}</button>)}
      </div>

      {tab === "Overview" && <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#303748]">Recent tasks</h2><p className="mt-1 text-xs text-[#8991a0]">What the team is working on</p></div><button onClick={() => setTab("Tasks")} className="text-xs font-semibold text-[#6558d3]">View all</button></div>
          <div className="divide-y divide-[#f0f1f4]">
            {projectTasks.length ? projectTasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-[#fafaff]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f1ff] text-[#6558d3]"><Icon name="check" size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">Due {formatDate(task.dueDate)}</span></span><StatusBadge status={task.status} /></Link>) : <p className="px-5 py-8 text-sm text-[#8991a0]">No tasks have been added to this project yet.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-[#eaecf1] bg-white p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-[#303748]">Project team</h2><p className="mt-1 text-xs text-[#8991a0]">People making it happen</p></div><button onClick={() => { setTab("Team"); setShowInvite(true); }} className="rounded-lg p-2 text-[#6558d3] hover:bg-[#f3f1ff]" aria-label="Add team member"><Icon name="plus" size={17} /></button></div>
          <div className="space-y-4">{project.members.slice(0, 4).map((member) => <div key={member.initials} className="flex items-center gap-3"><Avatar initials={member.initials} color={member.color} /><div><p className="text-xs font-semibold text-[#3c4454]">{member.name}</p><p className="mt-0.5 text-[11px] text-[#9299a8]">Team member</p></div></div>)}</div>
        </section>
      </div>}

      {tab === "Tasks" && <section className="overflow-hidden rounded-xl border border-[#eaecf1] bg-white">
        <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4"><div><h2 className="text-sm font-semibold text-[#303748]">Project tasks</h2><p className="mt-1 text-xs text-[#8991a0]">{projectTasks.length} tasks shown</p></div><ActionNoticeButton
          title="Add a task"
          message="Task creation is not connected to the API yet. Tasks shown on this page are sample data."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6558d3] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3]"
        ><Icon name="plus" size={16} /> Add task</ActionNoticeButton></div>
        {projectTasks.length ? <div className="divide-y divide-[#f0f1f4]">{projectTasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="grid gap-2 px-5 py-4 hover:bg-[#fafaff] sm:grid-cols-[1fr_140px_120px] sm:items-center"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f1ff] text-[#6558d3]"><Icon name="check" size={16} /></span><span><span className="block text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{task.assignee.name}</span></span></span><span className="text-xs text-[#7e8798]">Due {formatDate(task.dueDate)}</span><span><StatusBadge status={task.status} /></span></Link>)}</div> : <p className="px-5 py-10 text-center text-sm text-[#8991a0]">No tasks yet. Add a task to get started.</p>}
      </section>}

      {tab === "Team" && <section className="rounded-xl border border-[#eaecf1] bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-[#eff0f3] px-5 py-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold text-[#303748]">Team members</h2><p className="mt-1 text-xs text-[#8991a0]">Manage who has access to this project</p></div><Button onClick={() => setShowInvite((value) => !value)}><Icon name="plus" size={16} /> Invite member</Button></div>
        {showInvite && <div className="border-b border-[#eff0f3] bg-[#fbfbfd] p-4"><p className="mb-3 text-xs text-[#8991a0]">Demo only: this adds a placeholder to the page; it does not send an email or update the database.</p><form onSubmit={inviteMember} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="member-email">Email address</label><input id="member-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="h-10 flex-1 rounded-lg border border-[#e3e6ed] bg-white px-3 text-sm outline-none focus:border-[#a39aeb]" /><Button type="submit">Add demo invite</Button></form></div>}
        <div className="divide-y divide-[#f0f1f4]">{project.members.map((member) => <div key={member.initials} className="flex items-center gap-3 px-5 py-4"><Avatar initials={member.initials} color={member.color} /><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#384052]">{member.name}</span><span className="mt-1 block text-[11px] text-[#939aaa]">Team member · Active</span></span><span className="rounded-md bg-[#f5f6f8] px-2.5 py-1.5 text-[11px] font-medium text-[#70798b]">Member</span></div>)}{invited.map((address) => <div key={address} className="flex items-center gap-3 px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0efff] text-[#6558d3]"><Icon name="message" size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold text-[#384052]">{address}</span><span className="mt-1 block text-[11px] text-[#a07936]">Demo invite · not sent</span></span><span className="rounded-md bg-[#fff4de] px-2.5 py-1.5 text-[11px] font-medium text-[#a46a0b]">Preview</span></div>)}</div>
      </section>}
    </AppShell>
  );
}
