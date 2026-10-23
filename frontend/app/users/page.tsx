"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type ApiPage, type User, type UserRole } from "../lib/api";
import { AppShell, Avatar, Button, PageHeading } from "../components/ui";

const roles: UserRole[] = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "VIEWER"];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("TEAM_MEMBER");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    const result = await apiRequest<ApiPage<User>>("/users?limit=100");
    setUsers(result.items);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadUsers).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load users."));
  }, [loadUsers]);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest("/users", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
      setName("");
      setEmail("");
      setPassword("");
      setRole("TEAM_MEMBER");
      await loadUsers();
      setNotice("User created.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create user.");
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(user: User, data: Partial<Pick<User, "role" | "isActive">>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(`/users/${user.id}`, { method: "PATCH", body: JSON.stringify(data) });
      await loadUsers();
      setNotice("User updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell active="Users">
      <PageHeading eyebrow="Administration" title="Users" description="Create accounts and manage workspace access." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#a63d35]">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-[#e8f7ef] px-4 py-3 text-sm text-[#23774e]">{notice}</p>}
      <form onSubmit={createUser} className="mb-6 grid gap-3 rounded-xl border border-[#eaecf1] bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-semibold text-[#50596b]">Name<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Temporary password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-[#50596b]">Global role<select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-2 h-10 w-full rounded-lg border border-[#e8eaf0] bg-white px-3 text-sm font-normal">{roles.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <div className="flex items-end"><Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create user"}</Button></div>
      </form>
      <section className="overflow-hidden rounded-xl border border-[#eaecf1] bg-white">
        <div className="grid gap-2 border-b border-[#eff0f3] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#9299a8] sm:grid-cols-[1fr_180px_150px]"><span>User</span><span>Global role</span><span>Account status</span></div>
        {users.map((user) => <div key={user.id} className="grid gap-3 border-b border-[#f0f1f4] px-5 py-4 last:border-0 sm:grid-cols-[1fr_180px_150px] sm:items-center">
          <span className="flex items-center gap-3"><Avatar initials={user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")} /><span><span className="block text-[13px] font-semibold text-[#384052]">{user.name}</span><span className="mt-1 block text-[11px] text-[#939aaa]">{user.email}</span></span></span>
          <label className="sr-only" htmlFor={`role-${user.id}`}>Global role for {user.name}</label><select id={`role-${user.id}`} disabled={busy || !user.isActive} value={user.role} onChange={(event) => updateUser(user, { role: event.target.value as UserRole })} className="h-9 rounded-lg border border-[#e8eaf0] bg-white px-2 text-xs text-[#50596b]">{roles.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => updateUser(user, { isActive: !user.isActive })}>{user.isActive ? "Deactivate" : "Reactivate"}</Button>
        </div>)}
        {!users.length && <p className="px-5 py-10 text-center text-sm text-[#8991a0]">No users found.</p>}
      </section>
    </AppShell>
  );
}
