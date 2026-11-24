import ModuleWorkspace from "@/components/module-workspace";

export default async function ModulePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <ModuleWorkspace section={section} />;
}
