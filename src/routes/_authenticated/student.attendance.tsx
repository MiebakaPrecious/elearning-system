import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/student/attendance")({ component: () => <StubPage title="Attendance" /> });
