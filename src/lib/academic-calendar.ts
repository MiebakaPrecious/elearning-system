/**
 * Academic calendar rules for the Computer Science Department.
 *
 * - First semester opens every November; orientation is the first Monday of November.
 * - First semester exams start the first week of March and run for 3 weeks.
 * - Second semester opens on the third Monday of April.
 * - Second semester exams start the third week of August and run for 3 weeks.
 * - Continuous assessment must be concluded at least 2 weeks before exams.
 * - The final 2 weeks before exams are revision / clarification weeks.
 */

export type CalendarItem = {
  key: string;
  title: string;
  detail: string;
  start: Date;
  end?: Date;
  kind: "start" | "orientation" | "assessment" | "revision" | "exam" | "break";
};

export type SemesterPlan = {
  name: string;
  items: CalendarItem[];
  start: Date;
  examStart: Date;
  examEnd: Date;
};

const MONDAY = 1;

/** nth (1-based) occurrence of a weekday in a month. month is 0-based. */
function nthWeekday(year: number, month: number, weekday: number, nth: number) {
  const d = new Date(Date.UTC(year, month, 1));
  const shift = (weekday - d.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + shift + (nth - 1) * 7));
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 86_400_000);
}

/** The academic session that starts in November of `startYear` (e.g. 2026/2027). */
export function buildAcademicCalendar(startYear: number) {
  const nextYear = startYear + 1;

  // ---- First semester -------------------------------------------------
  const orientation = nthWeekday(startYear, 10, MONDAY, 1); // 1st Monday of November
  const sem1Start = orientation;
  const sem1ExamStart = nthWeekday(nextYear, 2, MONDAY, 1); // 1st Monday of March
  const sem1ExamEnd = addDays(sem1ExamStart, 20); // ~3 weeks
  const sem1RevisionStart = addDays(sem1ExamStart, -14);
  const sem1CaDeadline = addDays(sem1ExamStart, -14);

  const first: SemesterPlan = {
    name: "First Semester",
    start: sem1Start,
    examStart: sem1ExamStart,
    examEnd: sem1ExamEnd,
    items: [
      {
        key: "s1-orientation",
        title: "Departmental Orientation",
        detail: "Freshers, returning students and finalists — first Monday of November.",
        start: orientation,
        kind: "orientation",
      },
      {
        key: "s1-lectures",
        title: "Lectures Begin",
        detail: "First semester lectures run from November through February.",
        start: addDays(orientation, 1),
        end: addDays(sem1CaDeadline, -1),
        kind: "start",
      },
      {
        key: "s1-ca",
        title: "Continuous Assessment Closes",
        detail: "All tests, assignments and practicals must be concluded and scored.",
        start: sem1CaDeadline,
        kind: "assessment",
      },
      {
        key: "s1-revision",
        title: "Revision & Clarification Weeks",
        detail: "Two weeks of revision, tutorials and Q&A on difficult topics per course.",
        start: sem1RevisionStart,
        end: addDays(sem1ExamStart, -1),
        kind: "revision",
      },
      {
        key: "s1-exams",
        title: "First Semester Examinations",
        detail: "Commences the first week of March and runs for two to three weeks.",
        start: sem1ExamStart,
        end: sem1ExamEnd,
        kind: "exam",
      },
    ],
  };

  // ---- Second semester ------------------------------------------------
  const sem2Start = nthWeekday(nextYear, 3, MONDAY, 3); // 3rd Monday of April
  const sem2ExamStart = nthWeekday(nextYear, 7, MONDAY, 3); // 3rd week of August
  const sem2ExamEnd = addDays(sem2ExamStart, 20);
  const sem2CaDeadline = addDays(sem2ExamStart, -14);

  const second: SemesterPlan = {
    name: "Second Semester",
    start: sem2Start,
    examStart: sem2ExamStart,
    examEnd: sem2ExamEnd,
    items: [
      {
        key: "s2-break",
        title: "Inter-Semester Break",
        detail: "Break between first semester exams and second semester resumption.",
        start: addDays(sem1ExamEnd, 1),
        end: addDays(sem2Start, -1),
        kind: "break",
      },
      {
        key: "s2-start",
        title: "Second Semester Resumes",
        detail: "Lectures commence on the third Monday of April.",
        start: sem2Start,
        kind: "start",
      },
      {
        key: "s2-ca",
        title: "Continuous Assessment Closes",
        detail: "All tests, assignments and practicals must be concluded and scored.",
        start: sem2CaDeadline,
        kind: "assessment",
      },
      {
        key: "s2-revision",
        title: "Revision & Clarification Weeks",
        detail: "Two weeks of revision, tutorials and Q&A on difficult topics per course.",
        start: sem2CaDeadline,
        end: addDays(sem2ExamStart, -1),
        kind: "revision",
      },
      {
        key: "s2-exams",
        title: "Second Semester Examinations",
        detail: "Commences the third week of August and runs for two to three weeks.",
        start: sem2ExamStart,
        end: sem2ExamEnd,
        kind: "exam",
      },
    ],
  };

  return {
    label: `${startYear}/${nextYear}`,
    semesters: [first, second],
    all: [...first.items, ...second.items].sort((a, b) => a.start.getTime() - b.start.getTime()),
  };
}

/** The session year currently in progress (November start). */
export function currentSessionYear(now = new Date()) {
  return now.getUTCMonth() >= 10 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export function formatRange(item: CalendarItem) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return item.end ? `${fmt(item.start)} — ${fmt(item.end)}` : fmt(item.start);
}
