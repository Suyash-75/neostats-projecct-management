import Link from "next/link";
import { AppShell, Avatar, Button, Icon, PageHeading, ProgressBar, StatusBadge } from "../components/ui";
import { projects, tasks } from "../data";

const stats = [
  { label: "Total projects", value: "12", delta: "+2 this month", icon: "folder", color: "bg-[#f0edff] text-[#6558d3]" },
  { label: "Tasks in progress", value: "24", delta: "8 due this week", icon: "check", color: "bg-[#e8f4ff] text-[#4283bc]" },
  { label: "Completed this month", value: "38", delta: "+12% from last month", icon: "spark", color: "bg-[#e7f7ee] text-[#31845a]" },
  { label: "Team members", value: "16", delta: "Across 6 teams", icon: "users", color: "bg-[#fff2df] text-[#b37a1d]" },
];

export default function DashboardPage() {
  const activeTasks = tasks.filter((task) => task.status !== "Done");

  return (
    <AppShell active="Overview">
      <PageHeading
        eyebrow="Monday, June 16, 2025"
        title="Good morning, Olivia"
        description="Here’s what’s happening across your workspace today."
        action={<Button><Icon name="plus" size={17} /> New project</Button>}
      />

      <section aria-label="Workspace statistics" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-[#eaecf1] bg-white p-5 shadow-[0_1px_2px_#20263806]">
            <div className="mb-4 flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}><Icon name={stat.icon} size={19} /></span>
              <button aria-label={`More about ${stat.label}`} className="rounded-md p-1 text-[#9aa1b1] hover:bg-[#f5f6f8]"><Icon name="more" size={18} /></button>
            </div>
            <p className="text-sm text-[#7b8394]">{stat.label}</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-[28px] font-semibold tracking-tight text-[#202638]">{stat.value}</span>
              <span className="text-[11px] font-medium text-[#44956c]">{stat.delta}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4">
            <div><h2 className="text-[15px] font-semibold text-[#2a3142]">Project progress</h2><p className="mt-0.5 text-xs text-[#8991a0]">Keep an eye on your active work</p></div>
            <Link href="/projects" className="text-xs font-semibold text-[#6558d3] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[#f0f1f4]">
            {projects.slice(0, 4).map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="grid gap-3 px-5 py-4 transition hover:bg-[#fafaff] sm:grid-cols-[minmax(150px,1fr)_1fr_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-9 w-9 shrink-0 rounded-lg ${project.color === "violet" ? "bg-[#efedff]" : project.color === "blue" ? "bg-[#e9f3ff]" : project.color === "amber" ? "bg-[#fff4df]" : "bg-[#fff0f6]"}`}>
                    <span className={`mx-auto mt-3 block h-3 w-3 rounded-full ${project.color === "violet" ? "bg-[#9888ed]" : project.color === "blue" ? "bg-[#75a9e1]" : project.color === "amber" ? "bg-[#efb94f]" : "bg-[#e88bb6]"}`} />
                  </span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#333a4a]">{project.name}</span><span className="block text-xs text-[#8991a0]">{project.client}</span></span>
                </div>
                <div><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-[#858d9d]">Progress</span><span className="font-medium text-[#525b6d]">{project.progress}%</span></div><ProgressBar value={project.progress} /></div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end"><StatusBadge status={project.status} /><div className="flex -space-x-2">{project.members.slice(0, 3).map((member) => <Avatar key={member.initials} initials={member.initials} color={member.color} size="sm" />)}</div></div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#eaecf1] bg-white">
          <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4">
            <div><h2 className="text-[15px] font-semibold text-[#2a3142]">Your tasks</h2><p className="mt-0.5 text-xs text-[#8991a0]">A little progress goes a long way</p></div>
            <Link href="/tasks/tsk-104" className="rounded-lg p-2 text-[#8991a0] hover:bg-[#f5f6f8]" aria-label="View tasks"><Icon name="arrow" size={17} /></Link>
          </div>
          <div className="divide-y divide-[#f0f1f4]">
            {activeTasks.slice(0, 4).map((task) => (
              <Link href={`/tasks/${task.id}`} key={task.id} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafaff]">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${task.status === "In progress" ? "border-[#9287e4] bg-[#f2f0ff]" : "border-[#dfe2e9]"}`}>{task.status === "In progress" && <Icon name="check" size={13} className="text-[#6558d3]" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-[#384052]">{task.title}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{task.projectName} · Due {task.dueDate.split(",")[0]}</span></span>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-[#e7e4fb] bg-gradient-to-r from-[#f0efff] to-[#f8f7ff] px-5 py-5 sm:flex sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-4">
          <span className="hidden h-11 w-11 items-center justify-center rounded-xl bg-white text-[#6558d3] shadow-sm sm:flex"><Icon name="spark" size={22} /></span>
          <div><p className="text-sm font-semibold text-[#332d5c]">Make room for great work</p><p className="mt-1 text-xs text-[#77718d]">Your team is on track to hit its goals. Keep the momentum going.</p></div>
        </div>
        <Link href="/projects" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#6558d3] sm:mt-0">Explore projects <Icon name="arrow" size={15} /></Link>
      </section>
    </AppShell>
  );
}
