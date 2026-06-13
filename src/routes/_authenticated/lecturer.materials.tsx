import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/lecturer/materials")({ component: () => <StubPage title="Learning Materials" /> });
