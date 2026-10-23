import ProjectDetails from "./project-details";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetails projectId={id} />;
}
