export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type ApiPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export type UserRole = "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "VIEWER";
export type ProjectRole = "PROJECT_MANAGER" | "TEAM_MEMBER" | "VIEWER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type ProjectMember = {
  user: User;
  role: ProjectRole;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  version: number;
  projectId: string;
  assigneeId: string | null;
  assignee: User | null;
  project?: { id: string; name: string; archivedAt: string | null; projectMembers?: { userId: string; role: ProjectRole }[] };
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  projectMembers: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: Pick<User, "id" | "name" | "role">;
  createdAt: string;
};

export function getStoredToken() {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem("neostat-token");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("neostat-token");
  window.sessionStorage.removeItem("neostat-role");
  window.sessionStorage.removeItem("neostat-name");
  window.sessionStorage.removeItem("neostat-user-id");
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000/api"}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API request failed:", error);
    throw new ApiError("Cannot reach the API. Check that the backend and local database are running.", 0);
  }

  if (response.status === 401 && typeof window !== "undefined") {
    clearSession();
    window.dispatchEvent(new Event("neostat:unauthorized"));
  }
  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? `Request failed with HTTP ${response.status}.`, response.status, payload);
  }
  return payload as T;
}

export function formatLocalDate(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
