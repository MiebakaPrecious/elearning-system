import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: () => <StubPage title="Analytics" description="Enrollment trends, lecturer activity and course completion rates. The dashboard charts are a preview — deeper analytics arrive in Phase 2." />,
});
