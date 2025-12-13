# USP Features - Quick Start Implementation Guide

## Top 3 Critical USP Features to Build First

### 1. Predictive Candidate Scoring 🔥🔥🔥🔥🔥

**Why First**: This is the most unique feature - no competitor has predictive success scoring.

**MVP Scope** (Week 1-2):
- Score candidates 0-100 based on role fit
- Show confidence level (high/medium/low)
- Display top 3 risk factors
- Store scores in database

**Implementation Steps**:

#### Step 1: Database Schema
```prisma
// Add to Candidate model
model Candidate {
  // ... existing fields
  predictiveScore      Float?   // 0-100
  scoreConfidence      String?  // HIGH, MEDIUM, LOW
  scoreRiskFactors     String?  @db.Text // JSON array
  scoreGeneratedAt     DateTime?
  scoreJobId           String?  // Score is job-specific
}
```

#### Step 2: Create Scoring Algorithm
```typescript
// lib/ai/predictive-scoring.ts
export async function calculatePredictiveScore(
  candidate: Candidate,
  job: Job
): Promise<{
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  riskFactors: string[];
}> {
  // Factors to consider:
  // 1. Skill match (40%)
  // 2. Experience level (20%)
  // 3. Career progression (15%)
  // 4. Education fit (10%)
  // 5. Location/remote fit (10%)
  // 6. Red flags (negative 5%)
  
  // Use AI to analyze and score
}
```

#### Step 3: API Endpoint
```typescript
// app/api/candidates/[id]/predictive-score/route.ts
export async function POST(req: Request) {
  // Calculate score for candidate + job
  // Store in database
  // Return score with reasoning
}
```

#### Step 4: UI Component
```typescript
// components/PredictiveScore.tsx
// Display score badge, confidence, risk factors
// Show in candidate detail modal
```

**Files to Create**:
- `lib/ai/predictive-scoring.ts`
- `app/api/candidates/[id]/predictive-score/route.ts`
- `components/PredictiveScore.tsx`
- Update `prisma/schema.prisma`
- Update `components/CandidatesContent.tsx`

---

### 2. Intelligent Engagement Workflows 🔥🔥🔥🔥🔥

**Why Second**: Automates the most time-consuming part of recruitment.

**MVP Scope** (Week 2-3):
- Create simple workflow templates
- Schedule automated touches
- Track engagement metrics
- Basic A/B testing

**Implementation Steps**:

#### Step 1: Database Schema
```prisma
model EngagementWorkflow {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  steps       String   @db.Text // JSON array of steps
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  engagements Engagement[]
}

model Engagement {
  id          String   @id @default(cuid())
  candidateId String
  workflowId  String?
  type        String   // EMAIL, CALL, MESSAGE, LINKEDIN
  content     String?  @db.Text
  scheduledAt DateTime
  sentAt      DateTime?
  openedAt    DateTime?
  clickedAt   DateTime?
  respondedAt DateTime?
  status      String   // PENDING, SENT, OPENED, CLICKED, RESPONDED
  
  candidate   Candidate @relation(fields: [candidateId], references: [id])
  workflow    EngagementWorkflow? @relation(fields: [workflowId], references: [id])
}
```

#### Step 2: Workflow Engine
```typescript
// lib/ai/engagement-workflows.ts
export async function executeWorkflow(
  candidateId: string,
  workflowId: string
): Promise<void> {
  // Load workflow steps
  // Schedule each step
  // Track execution
}
```

#### Step 3: Templates
```typescript
// Pre-built templates:
// - Initial Outreach (3 touches over 2 weeks)
// - Follow-up Sequence (2 touches over 1 week)
// - Re-engagement (1 touch per month)
```

#### Step 4: UI Builder
```typescript
// components/EngagementWorkflowBuilder.tsx
// Drag-and-drop workflow builder
// Template selection
// Preview and test
```

**Files to Create**:
- `lib/ai/engagement-workflows.ts`
- `app/api/engagement/workflows/route.ts`
- `app/api/engagement/execute/route.ts`
- `components/EngagementWorkflowBuilder.tsx`
- Update `prisma/schema.prisma`

---

### 3. Referral Network System 🔥🔥🔥🔥🔥

**Why Third**: Leverages the social network - unique to Vetted.

**MVP Scope** (Week 3-4):
- Submit referrals from connections
- Track referral status
- Basic leaderboard
- Reward system (points/badges)

**Implementation Steps**:

#### Step 1: Database Schema
```prisma
model Referral {
  id            String   @id @default(cuid())
  referrerId    String   // User who made referral
  candidateId   String   // Candidate being referred
  jobId         String?  // Specific job (optional)
  status        String   // PENDING, REVIEWED, INTERVIEWED, HIRED, REJECTED
  notes         String?  @db.Text
  rewardPoints  Int      @default(0)
  createdAt     DateTime @default(now())
  
  referrer      User     @relation("Referrer", fields: [referrerId], references: [id])
  candidate     Candidate @relation(fields: [candidateId], references: [id])
  job           Job?     @relation(fields: [jobId], references: [id])
}

// Add to User model
model User {
  // ... existing fields
  referralsMade Referral[] @relation("Referrer")
  totalReferralPoints Int   @default(0)
}
```

#### Step 2: Referral Submission
```typescript
// app/api/referrals/route.ts
export async function POST(req: Request) {
  // Create referral
  // Link to candidate
  // Notify recruiter
  // Award points
}
```

#### Step 3: Leaderboard
```typescript
// app/api/referrals/leaderboard/route.ts
export async function GET() {
  // Top referrers by points
  // Top referrers by hires
  // Recent referrals
}
```

#### Step 4: UI Components
```typescript
// components/ReferralForm.tsx - Submit referral
// components/ReferralLeaderboard.tsx - Show rankings
// components/ReferralBadge.tsx - Display points/badges
```

**Files to Create**:
- `lib/referrals/referral-system.ts`
- `app/api/referrals/route.ts`
- `app/api/referrals/leaderboard/route.ts`
- `components/ReferralForm.tsx`
- `components/ReferralLeaderboard.tsx`
- Update `prisma/schema.prisma`
- Update `components/NetworkContent.tsx` (add referral button)

---

## Quick Implementation Checklist

### Week 1: Predictive Scoring
- [ ] Add database fields
- [ ] Create scoring algorithm
- [ ] Build API endpoint
- [ ] Add UI component
- [ ] Test with sample candidates

### Week 2: Engagement Workflows (Part 1)
- [ ] Add database schema
- [ ] Create workflow engine
- [ ] Build basic templates
- [ ] Test workflow execution

### Week 3: Engagement Workflows (Part 2)
- [ ] Build workflow builder UI
- [ ] Add scheduling logic
- [ ] Track engagement metrics
- [ ] Test end-to-end

### Week 4: Referral System
- [ ] Add database schema
- [ ] Create referral submission
- [ ] Build leaderboard
- [ ] Add reward system
- [ ] Integrate with network page

---

## Technical Requirements

### Dependencies to Add
```json
{
  "dependencies": {
    // For scheduling
    "node-cron": "^3.0.3",
    // For email (if not already)
    "nodemailer": "^6.9.8",
    // For calendar (optional)
    "googleapis": "^128.0.0"
  }
}
```

### Environment Variables
```bash
# Email for engagement workflows
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# For calendar integration (optional)
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
```

---

## Success Criteria

### Predictive Scoring
- ✅ Scores generated for all candidates
- ✅ Confidence levels displayed
- ✅ Risk factors shown
- ✅ Scores stored in database

### Engagement Workflows
- ✅ Workflows can be created
- ✅ Automated touches scheduled
- ✅ Engagement tracked
- ✅ Metrics displayed

### Referral System
- ✅ Referrals can be submitted
- ✅ Status tracked
- ✅ Leaderboard functional
- ✅ Points awarded

---

## Next Steps After MVP

1. **Enhance Predictive Scoring**:
   - Add historical data learning
   - Improve accuracy over time
   - Add more risk factors

2. **Expand Engagement Workflows**:
   - More templates
   - A/B testing
   - Optimal timing ML

3. **Gamify Referrals**:
   - Badges and achievements
   - Tiered rewards
   - Social sharing

---

**Start with Predictive Scoring** - it's the most unique and provides immediate value.

