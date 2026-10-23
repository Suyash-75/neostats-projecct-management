"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../components/ui";

const roles = [
  { value: "ADMIN", label: "Admin", caption: "Full workspace access", icon: "users" },
  { value: "PROJECT_MANAGER", label: "Project manager", caption: "Manage projects and tasks", icon: "grid" },
  { value: "TEAM_MEMBER", label: "Team member", caption: "Update assigned work", icon: "check" },
  { value: "VIEWER", label: "Viewer", caption: "Read-only project access", icon: "eye" },
];

export default function LoginPage() {
  const [role, setRole] = useState("ADMIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : { error: response.status === 404
          ? "The backend at port 5000 does not have the login route. Restart it from the backend folder."
          : `The backend returned an unexpected response (HTTP ${response.status}).` };

      if (!response.ok) {
        setLoginError(result.error ?? "Unable to sign in. Please try again.");
        return;
      }

      sessionStorage.setItem("neostat-token", result.token);
      sessionStorage.setItem("neostat-role", result.role);
      router.push("/dashboard");
    } catch {
      setLoginError("Could not connect to the server. Check that the backend is running and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[1.02fr_.98fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#17142e] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-32 -top-28 h-[440px] w-[440px] rounded-full border border-white/[.08]" />
        <div className="absolute -right-12 -top-8 h-[280px] w-[280px] rounded-full border border-white/[.08]" />
        <div className="absolute -bottom-48 -left-20 h-[460px] w-[460px] rounded-full border border-white/[.08]" />
        <Link href="/dashboard" className="relative z-10 flex items-center gap-2.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7669df]"><Icon name="spark" size={21} /></span><span className="text-xl font-bold tracking-tight">neostat</span></Link>
        <div className="relative z-10 max-w-[540px] pb-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[11px] font-medium text-[#d3cef9]"><span className="h-1.5 w-1.5 rounded-full bg-[#9d91ff]" /> A calmer way to get work done</div>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[48px]">Great work happens when teams move <span className="text-[#a99fff]">together.</span></h1>
          <p className="mt-5 max-w-[440px] text-sm leading-6 text-[#b5b2c9]">Bring your projects, people, and progress into one clear workspace. Spend less time keeping track and more time making an impact.</p>
          <div className="mt-10 rounded-2xl border border-white/[.1] bg-white/[.06] p-5 backdrop-blur">
            <div className="mb-4 flex items-center gap-2"><div className="flex -space-x-2"><span className="h-7 w-7 rounded-full border-2 border-[#28243f] bg-[#f4cbb5]" /><span className="h-7 w-7 rounded-full border-2 border-[#28243f] bg-[#d6e2ff]" /><span className="h-7 w-7 rounded-full border-2 border-[#28243f] bg-[#f1d9e8]" /><span className="h-7 w-7 rounded-full border-2 border-[#28243f] bg-[#d5ebd9]" /></div><span className="text-xs text-[#c2bfd3]">Teams at work, in sync</span></div>
            <p className="text-sm leading-6 text-[#e5e2f0]">“Neostat gives us the clarity to do our best work without the noise. Our whole team feels the difference.”</p><p className="mt-3 text-xs font-medium text-[#aba7be]">Olivia Rhye <span className="px-1 text-[#69647e]">·</span> Product manager</p>
          </div>
        </div>
        <p className="relative z-10 text-[11px] text-[#89859d]">© 2025 Neostat, Inc. All rights reserved.</p>
      </section>
      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:justify-center lg:px-12 xl:px-20">
        <Link href="/dashboard" className="mb-10 flex items-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6558d3] text-white"><Icon name="spark" size={19} /></span><span className="text-lg font-bold tracking-tight text-[#202638]">neostat</span></Link>
        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#8b91a0]">Welcome back</p><h2 className="text-[28px] font-semibold tracking-tight text-[#202638]">Sign in to your workspace</h2><p className="mt-2 text-sm text-[#7c8495]">Choose your role and enter your account details.</p></div>
          <form onSubmit={signIn} className="space-y-5">
            <fieldset><legend className="mb-2.5 text-xs font-semibold text-[#50596b]">I’m signing in as</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {roles.map((item) => <button key={item.value} type="button" onClick={() => setRole(item.value)} aria-pressed={role === item.value} className={`rounded-xl border p-3 text-left transition ${role === item.value ? "border-[#a69eee] bg-[#f8f7ff] ring-1 ring-[#c9c3f4]" : "border-[#e9ebf1] bg-white hover:border-[#d3d5de]"}`}><span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${role === item.value ? "bg-[#eeebff] text-[#6558d3]" : "bg-[#f5f6f8] text-[#818a9b]"}`}><Icon name={item.icon} size={16} /></span><span className="block text-[11px] font-semibold text-[#41495a]">{item.label}</span><span className="mt-1 hidden text-[10px] leading-4 text-[#8991a0] sm:block">{item.caption}</span></button>)}
            </div></fieldset>
            <div><label htmlFor="email" className="mb-2 block text-xs font-semibold text-[#50596b]">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="h-11 w-full rounded-lg border border-[#e4e6ec] bg-white px-3.5 text-sm outline-none placeholder:text-[#a1a7b3] focus:border-[#a39aeb] focus:ring-2 focus:ring-[#eeeaff]" /></div>
            <div><div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold text-[#50596b]">Password</label><button type="button" className="text-xs font-semibold text-[#6558d3] hover:underline">Forgot password?</button></div><div className="relative"><Icon name="lock" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1b1]" /><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 w-full rounded-lg border border-[#e4e6ec] bg-white pl-10 pr-3.5 text-sm outline-none placeholder:text-[#a1a7b3] focus:border-[#a39aeb] focus:ring-2 focus:ring-[#eeeaff]" /></div></div>
            {loginError && <p role="alert" className="rounded-lg bg-[#fff0ee] px-3 py-2.5 text-xs font-medium text-[#a94138]">{loginError}</p>}
            <button type="submit" disabled={isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#6558d3] text-sm font-semibold text-white shadow-sm transition hover:bg-[#5749c3] disabled:cursor-wait disabled:opacity-70">{isSubmitting ? "Signing in..." : "Sign in"} {!isSubmitting && <Icon name="arrow" size={16} />}</button>
          </form>
          <p className="mt-6 text-center text-xs text-[#868e9e]">New to Neostat? <button type="button" className="font-semibold text-[#6558d3] hover:underline">Create an account</button></p>
          <p className="mt-8 text-center text-[11px] leading-5 text-[#a0a6b2]">Demo accounts use password123: admin@neostats.com · pm@neostats.com · member@neostats.com · viewer@neostats.com</p>
          <p className="mt-8 text-center text-[11px] text-[#a0a6b2]">By continuing, you agree to our <a href="#" className="underline decoration-[#c5c9d1] underline-offset-2">Terms of Service</a> and <a href="#" className="underline decoration-[#c5c9d1] underline-offset-2">Privacy Policy</a>.</p>
        </div>
      </section>
    </main>
  );
}
