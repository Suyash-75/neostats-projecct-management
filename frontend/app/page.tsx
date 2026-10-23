import Link from "next/link";
import { Icon } from "./components/ui";

const features = [
  {
    icon: "folder",
    title: "Projects, in focus",
    description: "Keep plans, milestones, and progress together in one clear workspace.",
  },
  {
    icon: "check",
    title: "Work that moves",
    description: "Give every task an owner, a next step, and a place to share updates.",
  },
  {
    icon: "users",
    title: "One team, together",
    description: "Bring the right people into each project with roles that make sense.",
  },
];

export default function Home() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#fbfaff] text-[#202638]">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ProjectPulse home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6558d3] text-white shadow-[0_8px_20px_#6558d333]">
            <Icon name="spark" size={21} />
          </span>
          <span className="text-xl font-bold tracking-tight">Project<span className="text-[#6558d3]">Pulse</span></span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[#596174] transition hover:bg-white hover:text-[#272e3e]">Sign in</Link>
          <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#6558d3] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3]">
            Get started <Icon name="arrow" size={15} />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 md:pb-28 md:pt-16 lg:grid-cols-[1fr_.92fr] lg:gap-10 lg:px-10 lg:pt-20">
        <div className="landing-enter relative z-[1] max-w-[610px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e8e4ff] bg-white px-3.5 py-2 text-xs font-semibold text-[#6558d3] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#7669df] landing-pulse" />
            A little more clarity. A lot more momentum.
          </div>
          <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-.045em] text-[#202638] sm:text-[54px] lg:text-[64px]">
            Your team&apos;s next
            <br className="hidden sm:block" /> big thing starts
            <br className="hidden sm:block" /> <span className="text-[#6558d3]">right here.</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-base leading-7 text-[#697386] sm:text-lg sm:leading-8">
            ProjectPulse brings people, projects, and progress into one calm workspace—so your team can spend less time coordinating and more time making great work.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6558d3] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_#6558d32c] transition hover:-translate-y-0.5 hover:bg-[#5749c3]">
              Start your workspace <Icon name="arrow" size={16} />
            </Link>
            <Link href="/dashboard" className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#e6e7ed] bg-white px-5 text-sm font-semibold text-[#475064] transition hover:border-[#d6d1f6] hover:text-[#6558d3]">
              Explore the dashboard
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-3 text-xs text-[#798294]">
            <div className="flex -space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fbfaff] bg-[#f8ddd0] text-[9px] font-bold text-[#9f5a3d]">OR</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fbfaff] bg-[#dce8ff] text-[9px] font-bold text-[#315b9c]">PB</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#fbfaff] bg-[#d8f0e5] text-[9px] font-bold text-[#31785c]">LS</span>
            </div>
            <span>Thoughtful tools for teams doing meaningful work.</span>
          </div>
        </div>

        <div className="landing-enter landing-enter-delay relative mx-auto w-full max-w-[570px] lg:justify-self-end">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#e8e3ff] blur-3xl" />
          <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-[#dff4ef] blur-3xl" />
          <div className="landing-float relative rounded-[22px] border border-white bg-white p-3 shadow-[0_28px_90px_#39316d1c] sm:p-4">
            <div className="overflow-hidden rounded-[15px] border border-[#eff0f4] bg-[#fbfbfd]">
              <div className="flex items-center justify-between border-b border-[#eff0f4] bg-white px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#efedff] text-[#6558d3]"><Icon name="grid" size={16} /></span>
                  <div><p className="text-xs font-semibold text-[#31394a]">Project overview</p><p className="mt-0.5 text-[10px] text-[#9098a7]">Your team at a glance</p></div>
                </div>
                <span className="rounded-full bg-[#e8f7ef] px-2.5 py-1 text-[10px] font-semibold text-[#23774e]">On track</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 p-3.5 sm:gap-3 sm:p-5">
                {[["Active projects", "12", "folder"], ["Tasks in progress", "24", "check"], ["Team members", "16", "users"]].map(([label, value, icon]) => (
                  <div key={label} className="rounded-xl border border-[#eff0f4] bg-white p-3 sm:p-4">
                    <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3f1ff] text-[#6558d3] sm:h-8 sm:w-8"><Icon name={icon} size={15} /></span>
                    <p className="text-[9px] leading-4 text-[#8991a0] sm:text-[10px]">{label}</p><p className="mt-1 text-lg font-semibold tracking-tight text-[#272e3e] sm:text-xl">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mx-3.5 mb-3.5 rounded-xl border border-[#eff0f4] bg-white p-3.5 sm:mx-5 sm:mb-5 sm:p-4">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-[#343c4c]">Website redesign</p><p className="mt-1 text-[10px] text-[#9098a7]">Acme Corporation</p></div><Icon name="more" size={17} className="text-[#969dac]" /></div>
                <div className="mb-2 flex justify-between text-[10px]"><span className="text-[#8991a0]">Project progress</span><span className="font-semibold text-[#596174]">72%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f0eff5]"><div className="h-full w-[72%] rounded-full bg-[#7569dc]" /></div>
                <div className="mt-4 flex items-center justify-between border-t border-[#f0f1f4] pt-3">
                  <div className="flex -space-x-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#f8ddd0] text-[9px] font-bold text-[#9f5a3d]">OR</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#dce8ff] text-[9px] font-bold text-[#315b9c]">PB</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#f6ddec] text-[9px] font-bold text-[#994b77]">LS</span>
                  </div>
                  <span className="text-[10px] text-[#858d9d]">17 of 24 tasks complete</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2.5 rounded-xl border border-[#efedf8] bg-white px-3.5 py-3 shadow-[0_12px_28px_#37306c14] sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f7ef] text-[#31845a]"><Icon name="check" size={17} /></span>
              <span><span className="block text-[11px] font-semibold text-[#384052]">Nice progress!</span><span className="mt-0.5 block text-[10px] text-[#8991a0]">Your team is in sync</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
        <div className="mb-8 max-w-xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#7569dc]">Work feels better here</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#202638] sm:text-3xl">Everything your team needs to find its flow.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-[#ececf2] bg-white p-5 shadow-[0_2px_8px_#20263805] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_#37306c0d] sm:p-6">
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1efff] text-[#6558d3]"><Icon name={feature.icon} size={19} /></span>
              <h3 className="text-sm font-semibold text-[#303748]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#7b8394]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#ececf2] bg-white/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#8991a0] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link href="/" className="font-semibold text-[#343b4c]">Project<span className="text-[#6558d3]">Pulse</span></Link>
          <span>Clear plans. Good teamwork. Great work.</span>
          <Link href="/login" className="font-semibold text-[#6558d3] hover:underline">Sign in to your workspace <span aria-hidden>→</span></Link>
        </div>
      </footer>
    </main>
  );
}
