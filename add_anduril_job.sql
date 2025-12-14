-- Add Anduril Industries company
INSERT INTO "Company" (id, name, slug, industry, location, size, website, about, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Anduril Industries',
  'anduril-industries',
  'Defense Technology',
  'Costa Mesa, CA',
  '1001-5000',
  'https://anduril.com',
  'Anduril Industries is a defense technology company with a mission to transform U.S. and allied military capabilities with advanced technology. By bringing the expertise, technology, and business model of the 21st century''s most innovative companies to the defense industry, Anduril is changing how military systems are designed, built and sold. Anduril''s family of systems is powered by Lattice OS, an AI-powered operating system that turns thousands of data streams into a realtime, 3D command and control center.',
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Get the admin user ID (assuming there's an admin user)
-- If you need to create an admin user first, run this:
-- INSERT INTO "User" (id, email, name, "handle", password, role, "createdAt", "updatedAt")
-- VALUES (gen_random_uuid(), 'admin@vetted.com', 'Admin', 'admin', '$2a$10$hashedpassword', 'ADMIN', NOW(), NOW());

-- Add the Senior Manager, Cyber Assurance job
INSERT INTO "Job" (
  id, title, "companyId", "postedById", location, "isRemote", "isHybrid", 
  "employmentType", "salaryMin", "salaryMax", "salaryCurrency", 
  description, requirements, "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  'Senior Manager, Cyber Assurance',
  c.id,
  u.id,
  'Costa Mesa, California, United States',
  false,
  false,
  'FULL_TIME',
  191000,
  253000,
  'USD',
  'Senior Manager, Cyber Assurance position at Anduril Industries. The Cyber Assurance Team comprises ISSM, ISSO, and ISSE personnel who collectively ensure security compliance, authorization success, and security engineering throughout the system lifecycle. CAT members support proposal development, design reviews, system authorization, and continuous monitoring across all protection levels.

We are looking for a Senior Manager, Cyber Assurance to provide strategic and operational leadership for the Cyber Assurance Team to ensure that all program systems achieve and maintain cybersecurity authorizations, comply with applicable security policies (JSIG, ICD 503, NIST 800-53, DoD RMF), and deliver secure engineering throughout the system lifecycle.

Key responsibilities include:
- Define the CAT vision, objectives, and performance metrics
- Prioritize and allocate resources across ISSM, ISSO, and ISSE tasks
- Direct the end-to-end RMF lifecycle
- Ensure System Security Plans, Security Assessment Reports, and POA&Ms are authored
- Supervise, mentor, and evaluate ISSM, ISSO, and ISSE personnel
- Conduct regular CAT meetings and status briefings
- Oversee continuous monitoring program
- Manage GRC platforms and security artifacts
- Lead risk-assessment workshops
- Direct incident-response activities

Salary Range: $191,000 - $253,000 USD
Location: Costa Mesa, California, United States

Apply at: https://job-boards.greenhouse.io/andurilindustries/jobs/4977542007?gh_jid=4977542007',
  'Bachelor''s degree in Computer Science, Information Security, or related field (Master''s preferred). 8+ years of progressive cyber-security leadership experience in DoD or classified environments. Certifications: AM/IAT Level III (CISSP, CASP+, CISM, or equivalent). Deep knowledge of JSIG, ICD 503, NIST 800-53, DoD RMF (DoDI 8510.01). Active DoD Top Secret (TS/SCI-eligible) clearance required.',
  NOW(),
  NOW()
FROM "Company" c
CROSS JOIN "User" u
WHERE c.name = 'Anduril Industries' 
  AND u.role = 'ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM "Job" j 
    WHERE j.title = 'Senior Manager, Cyber Assurance' 
    AND j."companyId" = c.id
  );
