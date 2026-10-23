export type Project = {
  id: string;
  name: string;
  client: string;
  description: string;
  color: string;
  progress: number;
  status: "On track" | "At risk" | "Completed";
  dueDate: string;
  members: { name: string; initials: string; color: string }[];
  tasks: number;
  completedTasks: number;
};

export type Task = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  description: string;
  status: "In progress" | "To do" | "In review" | "Done";
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  assignee: { name: string; initials: string; color: string };
};

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T12:00:00Z`));
}

export const projects: Project[] = [
  {
    id: "1",
    name: "Website redesign",
    client: "Acme Corporation",
    description: "A fresh digital home for Acme, designed to make every interaction feel effortless.",
    color: "violet",
    progress: 72,
    status: "On track",
    dueDate: "2026-11-14",
    members: [
      { name: "Suyash Pandey", initials: "SP", color: "peach" },
      { name: "Rahul Sharma", initials: "RS", color: "blue" },
      { name: "Priya Mehta", initials: "PM", color: "pink" },
      { name: "Ananya Iyer", initials: "AI", color: "green" },
    ],
    tasks: 24,
    completedTasks: 17,
  },
  {
    id: "2",
    name: "Mobile app launch",
    client: "Layers Inc.",
    description: "Bringing the Layers experience to mobile with a thoughtful, high-performance app.",
    color: "blue",
    progress: 48,
    status: "At risk",
    dueDate: "2026-12-12",
    members: [
      { name: "Rahul Sharma", initials: "RS", color: "blue" },
      { name: "Arjun Patel", initials: "AP", color: "yellow" },
      { name: "Meera Nair", initials: "MN", color: "violet" },
    ],
    tasks: 31,
    completedTasks: 15,
  },
  {
    id: "3",
    name: "Brand identity",
    client: "Circooles",
    description: "Building a distinctive and flexible identity system for the next chapter of Circooles.",
    color: "amber",
    progress: 90,
    status: "On track",
    dueDate: "2026-11-20",
    members: [
      { name: "Suyash Pandey", initials: "SP", color: "peach" },
      { name: "Karan Shah", initials: "KS", color: "green" },
    ],
    tasks: 18,
    completedTasks: 16,
  },
  {
    id: "4",
    name: "Q3 campaign",
    client: "Catalog",
    description: "A multi-channel campaign to introduce Catalog's new collection to the world.",
    color: "pink",
    progress: 25,
    status: "On track",
    dueDate: "2026-12-04",
    members: [
      { name: "Ananya Iyer", initials: "AI", color: "green" },
      { name: "Arjun Patel", initials: "AP", color: "yellow" },
      { name: "Priya Mehta", initials: "PM", color: "pink" },
    ],
    tasks: 20,
    completedTasks: 5,
  },
];

export const tasks: Task[] = [
  {
    id: "tsk-104",
    title: "Design the new homepage",
    projectId: "1",
    projectName: "Website redesign",
    description: "Create a responsive homepage that introduces the new visual direction and guides visitors to the right product.",
    status: "In progress",
    priority: "High",
    dueDate: "2026-10-28",
    assignee: { name: "Suyash Pandey", initials: "SP", color: "peach" },
  },
  {
    id: "tsk-105",
    title: "Review mobile navigation",
    projectId: "1",
    projectName: "Website redesign",
    description: "Review the mobile navigation prototype and share any usability feedback with the team.",
    status: "In review",
    priority: "Medium",
    dueDate: "2026-10-30",
    assignee: { name: "Rahul Sharma", initials: "RS", color: "blue" },
  },
  {
    id: "tsk-106",
    title: "Prepare launch content",
    projectId: "1",
    projectName: "Website redesign",
    description: "Write and proof the launch copy for the redesigned marketing pages.",
    status: "To do",
    priority: "Low",
    dueDate: "2026-11-03",
    assignee: { name: "Priya Mehta", initials: "PM", color: "pink" },
  },
  {
    id: "tsk-201",
    title: "Finalize onboarding flow",
    projectId: "2",
    projectName: "Mobile app launch",
    description: "Finalize the first-run onboarding experience for new mobile app users.",
    status: "In progress",
    priority: "High",
    dueDate: "2026-10-29",
    assignee: { name: "Rahul Sharma", initials: "RS", color: "blue" },
  },
  {
    id: "tsk-301",
    title: "Export brand asset library",
    projectId: "3",
    projectName: "Brand identity",
    description: "Package approved brand assets for handoff to the client team.",
    status: "Done",
    priority: "Medium",
    dueDate: "2026-10-25",
    assignee: { name: "Suyash Pandey", initials: "SP", color: "peach" },
  },
];

export function getProject(id: string) {
  return projects.find((project) => project.id === id) ?? projects[0];
}

export function getTask(id: string) {
  return tasks.find((task) => task.id === id) ?? tasks[0];
}
