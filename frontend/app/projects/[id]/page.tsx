import { notFound } from "next/navigation";
import ProjectDetails from "./project-details";
import { projects } from "../../data";

export function generateStaticParams() {
  return projects.map(({ id }) => ({ id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = projects.find((item) => item.id === id);
  if (!project) notFound();
  return <ProjectDetails project={project} />;
}
