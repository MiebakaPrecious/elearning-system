import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/student/materials")({ component: () => <StubPage title="Learning Materials" /> });
