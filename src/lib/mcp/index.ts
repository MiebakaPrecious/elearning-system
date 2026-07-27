import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import getMyProfile from "./tools/get-my-profile";
import listMyEnrollments from "./tools/list-my-enrollments";
import listAssignments from "./tools/list-assignments";
import listAnnouncements from "./tools/list-announcements";
import listUpcomingEvents from "./tools/list-upcoming-events";
import createAnnouncement from "./tools/create-announcement";

// Must be the direct Supabase host: the published SUPABASE_URL is a proxy the
// OAuth issuer check rejects. VITE_SUPABASE_PROJECT_ID is inlined at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "elearning-system-mcp",
  title: "eLearning System",
  version: "0.1.0",
  instructions:
    "Tools for the Computer Science Department eLearning System. Read courses, enrollments, assignments, announcements and calendar events for the signed-in user, and post announcements when the user is a lecturer or admin. All access is enforced by the app's row-level security as that user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCourses,
    getMyProfile,
    listMyEnrollments,
    listAssignments,
    listAnnouncements,
    listUpcomingEvents,
    createAnnouncement,
  ],
});
