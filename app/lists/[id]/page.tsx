import { AppShell } from "@/components/app-shell";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function ListPage({ params }: Params) {
  const { id } = await params;
  return <AppShell view={{ type: "list", listId: id }} />;
}
