import { Suspense } from "react";
import ProjectDetails from "./project-details";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#7b8394]">Loading project…</p>}>
      <ProjectPageContent params={params} />
    </Suspense>
  );
}

async function ProjectPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetails projectId={id} />;
}
