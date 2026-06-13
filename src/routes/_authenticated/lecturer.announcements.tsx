import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/lecturer/announcements")({ component: () => <StubPage title="Announcements" /> });
