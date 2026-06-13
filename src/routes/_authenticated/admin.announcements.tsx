import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/admin/announcements")({
  component: () => <StubPage title="Announcements" description="Publish campus-wide and course-specific announcements with rich text and attachments. Coming next." />,
});
