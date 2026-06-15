-- Add semester number (1 or 2) on courses for the roadmap grid
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS semester_no smallint CHECK (semester_no IN (1,2));

CREATE INDEX IF NOT EXISTS courses_level_semester_idx ON public.courses (level, semester_no);

-- Seed a realistic Nigerian Polytechnic Computer Science curriculum
-- Idempotent: only insert when the course code doesn't already exist
INSERT INTO public.courses (code, title, description, level, semester_no, status)
SELECT * FROM (VALUES
  -- ND1 First Semester
  ('COM 111', 'Introduction to Computing', 'Basic concepts of computing, hardware, software, and information processing.', 'ND1'::public.level_type, 1::smallint, 'approved'::public.course_status),
  ('COM 112', 'Computer Hardware', 'Components of a computer system, assembly, and troubleshooting.', 'ND1', 1, 'approved'),
  ('COM 113', 'Introduction to Programming (C)', 'Fundamentals of programming using the C language.', 'ND1', 1, 'approved'),
  ('MTH 112', 'Algebra & Trigonometry', 'Foundational mathematics for computing.', 'ND1', 1, 'approved'),
  ('GNS 101', 'Use of English I', 'Communication skills and academic writing.', 'ND1', 1, 'approved'),
  -- ND1 Second Semester
  ('COM 121', 'Computer Applications Packages', 'Word processing, spreadsheets, presentations, and databases.', 'ND1', 2, 'approved'),
  ('COM 122', 'Operating Systems I', 'Introduction to operating system concepts and shell usage.', 'ND1', 2, 'approved'),
  ('COM 123', 'Web Design (HTML & CSS)', 'Building static web pages with HTML5 and CSS3.', 'ND1', 2, 'approved'),
  ('MTH 122', 'Calculus', 'Differential and integral calculus for computing.', 'ND1', 2, 'approved'),
  ('GNS 102', 'Use of English II', 'Advanced communication and report writing.', 'ND1', 2, 'approved'),
  -- ND2 First Semester
  ('COM 211', 'Data Structures', 'Lists, stacks, queues, trees, and graphs.', 'ND2', 1, 'approved'),
  ('COM 212', 'Database Management I', 'Relational model, ER diagrams, and SQL basics.', 'ND2', 1, 'approved'),
  ('COM 213', 'Object Oriented Programming (Java)', 'Classes, objects, inheritance, and polymorphism in Java.', 'ND2', 1, 'approved'),
  ('COM 214', 'System Analysis & Design', 'SDLC, requirements gathering, and design methodologies.', 'ND2', 1, 'approved'),
  ('COM 215', 'Computer Networks I', 'Network topologies, OSI model, and TCP/IP.', 'ND2', 1, 'approved'),
  -- ND2 Second Semester
  ('COM 221', 'Web Programming (JavaScript)', 'Client-side scripting, DOM, and dynamic pages.', 'ND2', 2, 'approved'),
  ('COM 222', 'Database Management II', 'Advanced SQL, normalization, and stored procedures.', 'ND2', 2, 'approved'),
  ('COM 223', 'Project I (ND Capstone)', 'Supervised mini-project demonstrating ND-level competence.', 'ND2', 2, 'approved'),
  ('COM 224', 'SIWES / Industrial Training', 'Six-month industrial attachment in a CS-related role.', 'ND2', 2, 'approved'),
  ('ENT 211', 'Entrepreneurship', 'Business planning and entrepreneurial mindset.', 'ND2', 2, 'approved'),
  -- HND1 First Semester
  ('COM 311', 'Advanced Data Structures & Algorithms', 'Algorithm analysis, complexity, sorting and searching.', 'HND1', 1, 'approved'),
  ('COM 312', 'Software Engineering', 'Agile, SCRUM, version control, and testing.', 'HND1', 1, 'approved'),
  ('COM 313', 'Advanced Database Systems', 'Distributed databases, NoSQL, and data warehousing.', 'HND1', 1, 'approved'),
  ('COM 314', 'Computer Architecture', 'CPU design, memory hierarchy, and assembly programming.', 'HND1', 1, 'approved'),
  ('COM 315', 'Computer Networks II', 'Routing, switching, and network security fundamentals.', 'HND1', 1, 'approved'),
  -- HND1 Second Semester
  ('COM 321', 'Mobile Application Development', 'Building Android/iOS apps with modern frameworks.', 'HND1', 2, 'approved'),
  ('COM 322', 'Operating Systems II', 'Processes, threads, scheduling, and concurrency.', 'HND1', 2, 'approved'),
  ('COM 323', 'Human Computer Interaction', 'UX principles, accessibility, and usability testing.', 'HND1', 2, 'approved'),
  ('COM 324', 'Cyber Security', 'Threats, cryptography, and secure coding practices.', 'HND1', 2, 'approved'),
  ('COM 325', 'Research Methodology', 'Academic research methods for the HND project.', 'HND1', 2, 'approved'),
  -- HND2 First Semester
  ('COM 411', 'Artificial Intelligence', 'Search, knowledge representation, and intro to ML.', 'HND2', 1, 'approved'),
  ('COM 412', 'Cloud Computing', 'IaaS/PaaS/SaaS, virtualization, and deployment.', 'HND2', 1, 'approved'),
  ('COM 413', 'Web Application Development', 'Full-stack web apps using modern JS frameworks.', 'HND2', 1, 'approved'),
  ('COM 414', 'Data Communication', 'Signals, modulation, and transmission media.', 'HND2', 1, 'approved'),
  ('COM 415', 'Project II (HND Proposal)', 'Proposal and literature review for the HND project.', 'HND2', 1, 'approved'),
  -- HND2 Second Semester
  ('COM 421', 'Machine Learning', 'Supervised, unsupervised learning, and model evaluation.', 'HND2', 2, 'approved'),
  ('COM 422', 'Internet of Things', 'Sensors, embedded systems, and IoT protocols.', 'HND2', 2, 'approved'),
  ('COM 423', 'IT Project Management', 'Planning, scheduling, and managing IT projects.', 'HND2', 2, 'approved'),
  ('COM 424', 'Project III (HND Capstone)', 'Final-year capstone project and defense.', 'HND2', 2, 'approved'),
  ('COM 425', 'Professional Ethics in Computing', 'Ethics, privacy, and professional responsibility.', 'HND2', 2, 'approved')
) AS seed(code, title, description, level, semester_no, status)
WHERE NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.code = seed.code);

-- Backfill semester_no for any pre-existing rows that lack it
UPDATE public.courses SET semester_no = 1 WHERE semester_no IS NULL;