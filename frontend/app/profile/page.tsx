"use client";

import { useEffect, useState } from "react";
import { apiRequest, type User } from "../lib/api";
import { AppShell, Button, PageHeading } from "../components/ui";

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<User>("/profile").then((user) => {
      setProfile(user);
      setName(user.name);
      setEmail(user.email);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load profile."));
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await apiRequest<User>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email, ...(password ? { password } : {}) }),
      });
      setProfile(updated);
      setPassword("");
      window.sessionStorage.setItem("neostat-name", updated.name);
      setNotice("Profile updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell active="Account">
      <PageHeading eyebrow="Account" title="Your profile" description="Update your personal account details." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-[#e8f7ef] px-4 py-3 text-sm text-[#23774e]">{notice}</p>}
      {profile && <form onSubmit={saveProfile} className="max-w-xl space-y-4 rounded-xl border border-[#eaecf1] bg-white p-5">
        <label className="block text-xs font-semibold text-[#50596b]">Name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="block text-xs font-semibold text-[#50596b]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="block text-xs font-semibold text-[#50596b]">New password (leave blank to keep current)<input minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <p className="text-xs text-[#8991a0]">Workspace role: {profile.role?.replaceAll("_", " ") ?? "Not available"}</p>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
      </form>}
    </AppShell>
  );
}
