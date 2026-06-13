import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/StubPage";
export const Route = createFileRoute("/_authenticated/lecturer/quizzes")({ component: () => <StubPage title="Quizzes" /> });
