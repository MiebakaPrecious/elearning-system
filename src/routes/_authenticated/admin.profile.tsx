import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProfileSetup } from "@/components/ProfileSetup";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: () => (
    <DashboardShell title="Profile Setup">
      <ProfileSetup role="admin" />
    </DashboardShell>
  ),
});
