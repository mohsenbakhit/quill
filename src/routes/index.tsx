import { createFileRoute } from "@tanstack/react-router";
import { ScreenplayEditor } from "@/components/ScreenplayEditor";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <ScreenplayEditor />;
}
