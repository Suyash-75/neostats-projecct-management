"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionNoticeButton } from "../components/action-notice-button";
import { AppShell, Avatar, Icon, PageHeading, ProgressBar, StatusBadge } from "../components/ui";
import { formatDate, projects } from "../data";

type Filter = "All projects" | "In progress" | "Completed";

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>("All projects");
  const [query, setQuery] = useState("");
  const filters: Filter[] = ["All projects", "In progress", "Completed"];
  const visibleProjects = useMemo(() => projects.filter((project) => {
    const matchesFilter = filter === "All projects" || (filter === "Completed" ? project.status === "Completed" : project.status !== "Completed");
    const matchesQuery = `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  return (
    <AppShell active="Projects">
      <PageHeading
        eyebrow="Workspace"
        title="Projects"
        description="Plan, track, and deliver your team’s best work."
        action={<ActionNoticeButton
          title="Create a project"
          message="Project creation is not connected to the API yet. This page currently displays sample projects."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6558d3] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3]"
        ><Icon name="plus" size={17} /> Create project</ActionNoticeButton>}
      />
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#e9ebf1] bg-white p-1">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition ${filter === item ? "bg-[#f1efff] text-[#5e51c8]" : "text-[#7b8394] hover:bg-[#f8f8fa]"}`}>{item}{item === "All projects" && <span className="ml-2 text-[10px] opacity-70">{projects.length}</span>}</button>)}
        </div>
        <label className="relative block sm:w-[250px]">
          <Icon name="search" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa1b1]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." className="h-10 w-full rounded-lg border border-[#e8eaf0] bg-white pl-10 pr-3 text-sm outline-none placeholder:text-[#9ba2b1] focus:border-[#a39aeb]" />
        </label>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[#858d9d]">Showing <span className="font-semibold text-[#4b5363]">{visibleProjects.length}</span> projects</p>
      </div>
      {visibleProjects.length ? <div className="grid gap-4 lg:grid-cols-2">
        {visibleProjects.map((project) => (
          <article key={project.id} className="rounded-xl border border-[#eaecf1] bg-white p-5 shadow-[0_1px_2px_#20263806] transition hover:border-[#d9d5f6] hover:shadow-[0_4px_16px_#37306c0b] sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${project.color === "violet" ? "bg-[#efedff] text-[#7466d6]" : project.color === "blue" ? "bg-[#e9f3ff] text-[#5793cc]" : project.color === "amber" ? "bg-[#fff4df] text-[#c28b29]" : "bg-[#fff0f6] text-[#ca6795]"}`}><Icon name="folder" size={21} /></span>
                <div className="min-w-0"><Link href={`/projects/${project.id}`} className="block truncate text-[15px] font-semibold text-[#303748] hover:text-[#6558d3]">{project.name}</Link><p className="mt-0.5 truncate text-xs text-[#8991a0]">{project.client}</p></div>
              </div>
            </div>
            <p className="mb-5 line-clamp-2 min-h-10 text-[13px] leading-5 text-[#7b8394]">{project.description}</p>
            <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-[#6f788b]">Project progress</span><span className="font-semibold text-[#41495a]">{project.progress}%</span></div>
            <ProgressBar value={project.progress} color={project.color === "blue" ? "bg-[#66a4e3]" : project.color === "amber" ? "bg-[#e9b34b]" : project.color === "pink" ? "bg-[#e481af]" : "bg-[#7569dc]"} />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f1f4] pt-4">
              <div className="flex items-center gap-2.5"><div className="flex -space-x-2">{project.members.slice(0, 4).map((member) => <Avatar key={member.initials} initials={member.initials} color={member.color} size="sm" />)}</div><span className="text-[11px] text-[#8b92a1]">{project.members.length} members</span></div>
              <div className="flex items-center gap-4"><span className="text-[11px] text-[#858d9d]">{project.completedTasks}/{project.tasks} tasks</span><StatusBadge status={project.status} /></div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[#8b92a1]"><span className="flex items-center gap-1.5"><Icon name="calendar" size={14} /> Due {formatDate(project.dueDate)}</span><Link href={`/projects/${project.id}`} className="font-semibold text-[#6558d3] hover:underline">Open project <span aria-hidden>→</span></Link></div>
          </article>
        ))}
      </div> : <div className="rounded-xl border border-dashed border-[#dfe2e9] bg-white px-6 py-16 text-center"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f1ff] text-[#6558d3]"><Icon name="search" size={22} /></span><h2 className="font-semibold text-[#303748]">No projects found</h2><p className="mt-1 text-sm text-[#8991a0]">Try a different search or filter.</p></div>}
    </AppShell>
  );
}
