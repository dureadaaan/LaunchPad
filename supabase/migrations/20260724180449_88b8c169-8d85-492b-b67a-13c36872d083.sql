
CREATE TABLE public.opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  organization text NOT NULL,
  type text NOT NULL CHECK (type IN ('internship','research','hackathon','conference','workshop')),
  location_type text NOT NULL CHECK (location_type IN ('remote','onsite_pk','onsite_global')),
  pakistan_friendly boolean NOT NULL DEFAULT false,
  skill_level text NOT NULL CHECK (skill_level IN ('beginner','intermediate','advanced')),
  paid boolean NOT NULL DEFAULT false,
  deadline date NOT NULL,
  description text NOT NULL DEFAULT '',
  apply_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opportunities are publicly readable"
  ON public.opportunities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX opportunities_deadline_idx ON public.opportunities (deadline);

INSERT INTO public.opportunities (title, organization, type, location_type, pakistan_friendly, skill_level, paid, deadline, description, apply_url, tags) VALUES
('Google Summer of Code 2026', 'Google', 'internship', 'remote', true, 'intermediate', true, CURRENT_DATE + 45, 'Contribute to open source with mentorship and a stipend.', 'https://summerofcode.withgoogle.com/', ARRAY['open-source','mentorship']),
('Microsoft Learn Student Ambassador', 'Microsoft', 'internship', 'remote', true, 'beginner', false, CURRENT_DATE + 20, 'Build community and technical skills as a student ambassador.', 'https://studentambassadors.microsoft.com/', ARRAY['community','leadership']),
('MITACS Globalink Research Internship', 'MITACS Canada', 'research', 'onsite_global', true, 'intermediate', true, CURRENT_DATE + 60, '12-week fully funded research internship in Canada.', 'https://www.mitacs.ca/our-programs/globalink-research-internship-students/', ARRAY['research','funded']),
('DAAD WISE Research Scholarship', 'DAAD Germany', 'research', 'onsite_global', true, 'advanced', true, CURRENT_DATE + 90, 'Summer research at a German university with monthly stipend.', 'https://www.daad.de/wise', ARRAY['research','germany']),
('NASA Space Apps Challenge 2026', 'NASA', 'hackathon', 'remote', true, 'beginner', false, CURRENT_DATE + 5, 'Global 48-hour hackathon using open NASA data.', 'https://www.spaceappschallenge.org/', ARRAY['space','open-data']),
('HackMoot Pakistan', 'DevMoot', 'hackathon', 'onsite_pk', true, 'beginner', false, CURRENT_DATE + 12, 'Nationwide student hackathon held in Islamabad.', 'https://devmoot.pk/', ARRAY['pakistan','student']),
('IEEE HAC 2026 Conference', 'IEEE', 'conference', 'onsite_global', false, 'advanced', true, CURRENT_DATE + 70, 'Humanitarian activities conference for engineers.', 'https://hac.ieee.org/', ARRAY['ieee']),
('Google I/O Extended Karachi', 'GDG Karachi', 'conference', 'onsite_pk', true, 'beginner', false, CURRENT_DATE + 25, 'Local viewing and talks around Google I/O announcements.', 'https://gdg.community.dev/', ARRAY['gdg','local']),
('AWS Cloud Practitioner Workshop', 'AWS Educate', 'workshop', 'remote', true, 'beginner', false, CURRENT_DATE + 3, 'Free online workshop covering AWS fundamentals.', 'https://aws.amazon.com/education/awseducate/', ARRAY['cloud','aws']),
('DeepLearning.AI Bootcamp', 'DeepLearning.AI', 'workshop', 'remote', true, 'intermediate', false, CURRENT_DATE + 15, 'Hands-on ML foundations workshop series.', 'https://www.deeplearning.ai/', ARRAY['ml','ai']),
('Meta University Engineering Internship', 'Meta', 'internship', 'onsite_global', false, 'intermediate', true, CURRENT_DATE + 40, 'Paid summer engineering internship for underrepresented students.', 'https://www.metacareers.com/careers/students-and-grads/', ARRAY['swe','paid']),
('Techstars Startup Weekend Lahore', 'Techstars', 'hackathon', 'onsite_pk', true, 'beginner', false, CURRENT_DATE + 8, '54-hour event where founders build a startup from scratch.', 'https://www.techstars.com/communities/startup-weekend', ARRAY['startup','pakistan']),
('CERN Openlab Summer Student', 'CERN', 'research', 'onsite_global', true, 'advanced', true, CURRENT_DATE + 55, 'Work on cutting-edge CS problems at CERN in Geneva.', 'https://openlab.cern/summer-student-programme', ARRAY['research','physics']),
('LabLab.ai AI Hackathon', 'LabLab.ai', 'hackathon', 'remote', true, 'intermediate', false, CURRENT_DATE + 6, 'Weekend AI hackathon with cash prizes and mentors.', 'https://lablab.ai/', ARRAY['ai','hackathon']),
('GitHub Campus Experts', 'GitHub', 'workshop', 'remote', true, 'beginner', false, CURRENT_DATE + 30, 'Training program to grow tech communities on campus.', 'https://education.github.com/experts', ARRAY['community','github']);
