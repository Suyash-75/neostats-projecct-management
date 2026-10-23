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

export const projects: Project[] = [
  {
    id: "1",
    name: "Website redesign",
    client: "Acme Corporation",
    description: "A fresh digital home for Acme, designed to make every interaction feel effortless.",
    color: "violet",
    progress: 72,
    status: "On track",
    dueDate: "Jun 28, 2025",
    members: [
      { name: "Olivia Rhye", initials: "OR", color: "peach" },
      { name: "Phoenix Baker", initials: "PB", color: "blue" },
      { name: "Lana Steiner", initials: "LS", color: "pink" },
      { name: "Demi Wilkinson", initials: "DW", color: "green" },
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
    dueDate: "Jul 12, 2025",
    members: [
      { name: "Phoenix Baker", initials: "PB", color: "blue" },
      { name: "Candice Wu", initials: "CW", color: "yellow" },
      { name: "Drew Cano", initials: "DC", color: "violet" },
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
    dueDate: "Jun 20, 2025",
    members: [
      { name: "Olivia Rhye", initials: "OR", color: "peach" },
      { name: "Natali Craig", initials: "NC", color: "green" },
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
    dueDate: "Aug 04, 2025",
    members: [
      { name: "Demi Wilkinson", initials: "DW", color: "green" },
      { name: "Candice Wu", initials: "CW", color: "yellow" },
      { name: "Lana Steiner", initials: "LS", color: "pink" },
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
    dueDate: "Jun 18, 2025",
    assignee: { name: "Olivia Rhye", initials: "OR", color: "peach" },
  },
  {
    id: "tsk-105",
    title: "Review mobile navigation",
    projectId: "1",
    projectName: "Website redesign",
    description: "Review the mobile navigation prototype and share any usability feedback with the team.",
    status: "In review",
    priority: "Medium",
    dueDate: "Jun 20, 2025",
    assignee: { name: "Phoenix Baker", initials: "PB", color: "blue" },
  },
  {
    id: "tsk-106",
    title: "Prepare launch content",
    projectId: "1",
    projectName: "Website redesign",
    description: "Write and proof the launch copy for the redesigned marketing pages.",
    status: "To do",
    priority: "Low",
    dueDate: "Jun 24, 2025",
    assignee: { name: "Lana Steiner", initials: "LS", color: "pink" },
  },
  {
    id: "tsk-201",
    title: "Finalize onboarding flow",
    projectId: "2",
    projectName: "Mobile app launch",
    description: "Finalize the first-run onboarding experience for new mobile app users.",
    status: "In progress",
    priority: "High",
    dueDate: "Jun 19, 2025",
    assignee: { name: "Phoenix Baker", initials: "PB", color: "blue" },
  },
  {
    id: "tsk-301",
    title: "Export brand asset library",
    projectId: "3",
    projectName: "Brand identity",
    description: "Package approved brand assets for handoff to the client team.",
    status: "Done",
    priority: "Medium",
    dueDate: "Jun 16, 2025",
    assignee: { name: "Olivia Rhye", initials: "OR", color: "peach" },
  },
];

export function getProject(id: string) {
  return projects.find((project) => project.id === id) ?? projects[0];
}

export function getTask(id: string) {
  return tasks.find((task) => task.id === id) ?? tasks[0];
}
