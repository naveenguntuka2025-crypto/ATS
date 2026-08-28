import { db } from "./client";
import { users, clients, requirements, requirementAssignees, candidates, submissions, submissionStatusHistory, notes } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  const [admin] = await db.insert(users).values({ name: "Alex Admin", email: "admin@demo.com", passwordHash: password, role: "ADMIN" }).returning();
  const [manager] = await db.insert(users).values({ name: "Morgan Manager", email: "manager@demo.com", passwordHash: password, role: "MANAGER" }).returning();
  const [recruiter1] = await db.insert(users).values({ name: "Riley Recruiter", email: "recruiter1@demo.com", passwordHash: password, role: "RECRUITER" }).returning();
  const [recruiter2] = await db.insert(users).values({ name: "Sam Sourcer", email: "recruiter2@demo.com", passwordHash: password, role: "RECRUITER" }).returning();

  const [clientA] = await db
    .insert(clients)
    .values({ name: "Northwind Financial", contactName: "Dana Price", contactEmail: "dana@northwind-demo.com", ownerId: manager.id })
    .returning();
  const [clientB] = await db
    .insert(clients)
    .values({ name: "Contoso Health Systems", contactName: "Jamie Lee", contactEmail: "jamie@contoso-demo.com", ownerId: manager.id })
    .returning();

  const [reqA] = await db
    .insert(requirements)
    .values({
      title: "Senior React Developer",
      description: "Building a customer portal. Need strong React + TypeScript, some Node.js.",
      skills: "React, TypeScript, Node.js, REST APIs",
      location: "Remote (US)",
      employmentType: "C2C",
      rateMin: 65,
      rateMax: 80,
      positions: 2,
      priority: "HIGH",
      status: "OPEN",
      clientId: clientA.id,
      postedById: manager.id,
    })
    .returning();

  const [reqB] = await db
    .insert(requirements)
    .values({
      title: "DevOps Engineer",
      description: "AWS-heavy infra team, CI/CD pipeline ownership.",
      skills: "AWS, Terraform, Kubernetes, CI/CD",
      location: "Dallas, TX (Hybrid)",
      employmentType: "W2",
      rateMin: 55,
      rateMax: 70,
      positions: 1,
      priority: "MEDIUM",
      status: "OPEN",
      clientId: clientB.id,
      postedById: manager.id,
    })
    .returning();

  const [reqC] = await db
    .insert(requirements)
    .values({
      title: "QA Automation Engineer",
      description: "Selenium/Playwright test automation for a claims processing app.",
      skills: "Playwright, Selenium, Java",
      location: "Remote",
      employmentType: "C1099",
      rateMin: 45,
      rateMax: 55,
      positions: 1,
      priority: "LOW",
      status: "ON_HOLD",
      clientId: clientB.id,
      postedById: manager.id,
    })
    .returning();

  await db.insert(requirementAssignees).values([
    { requirementId: reqA.id, userId: recruiter1.id },
    { requirementId: reqB.id, userId: recruiter1.id },
    { requirementId: reqB.id, userId: recruiter2.id },
  ]);

  const [candA] = await db
    .insert(candidates)
    .values({
      firstName: "Priya",
      lastName: "Nandakumar",
      email: "priya.demo@example.com",
      currentTitle: "Senior Frontend Engineer",
      skills: "React, TypeScript, GraphQL",
      experienceYears: 7,
      location: "Remote",
      workAuthorization: "GC",
      source: "INTERNAL",
      ownerId: recruiter1.id,
    })
    .returning();

  const [candB] = await db
    .insert(candidates)
    .values({
      firstName: "Marcus",
      lastName: "Webb",
      email: "marcus.demo@example.com",
      currentTitle: "DevOps Engineer",
      skills: "AWS, Terraform, Docker",
      experienceYears: 5,
      location: "Dallas, TX",
      workAuthorization: "USC",
      source: "DICE",
      ownerId: recruiter2.id,
    })
    .returning();

  const [candC] = await db
    .insert(candidates)
    .values({
      firstName: "Elena",
      lastName: "Ferraro",
      email: "elena.demo@example.com",
      currentTitle: "Full-Stack Developer",
      skills: "React, Node.js, PostgreSQL",
      experienceYears: 4,
      location: "Remote",
      workAuthorization: "H1B",
      source: "LINKEDIN",
      ownerId: recruiter1.id,
    })
    .returning();

  const [subA] = await db
    .insert(submissions)
    .values({ candidateId: candA.id, requirementId: reqA.id, submittedById: recruiter1.id, submittedRate: 72, status: "SUBMITTED_TO_CLIENT" })
    .returning();
  const [subB] = await db
    .insert(submissions)
    .values({ candidateId: candB.id, requirementId: reqB.id, submittedById: recruiter2.id, submittedRate: 62, status: "INTERVIEW_SCHEDULED" })
    .returning();
  const [subC] = await db
    .insert(submissions)
    .values({ candidateId: candC.id, requirementId: reqA.id, submittedById: recruiter1.id, submittedRate: 68, status: "SUBMITTED" })
    .returning();

  await db.insert(submissionStatusHistory).values([
    { submissionId: subA.id, fromStatus: null, toStatus: "SUBMITTED" },
    { submissionId: subA.id, fromStatus: "SUBMITTED", toStatus: "SUBMITTED_TO_CLIENT", changedById: manager.id },
    { submissionId: subB.id, fromStatus: null, toStatus: "SUBMITTED" },
    { submissionId: subB.id, fromStatus: "SUBMITTED", toStatus: "INTERVIEW_SCHEDULED", changedById: recruiter2.id },
    { submissionId: subC.id, fromStatus: null, toStatus: "SUBMITTED" },
  ]);

  await db.insert(notes).values([
    { requirementId: reqA.id, authorId: manager.id, body: "Client wants candidates who can start within 2 weeks." },
    { candidateId: candA.id, authorId: recruiter1.id, body: "Strong communicator, did a great walkthrough of a past project." },
    { submissionId: subB.id, authorId: recruiter2.id, body: "Client scheduled a technical interview for Thursday." },
  ]);

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts (password: password123 for all):");
  console.log("  admin@demo.com      (Admin)");
  console.log("  manager@demo.com    (Manager)");
  console.log("  recruiter1@demo.com (Recruiter)");
  console.log("  recruiter2@demo.com (Recruiter)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
