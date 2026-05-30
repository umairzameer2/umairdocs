import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorId = searchParams.get('authorId')
    const organizationId = searchParams.get('organizationId')

    if (!authorId && !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Author ID or Organization ID is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { isTrashed: false }

    if (organizationId) {
      where.organizationId = organizationId
    } else if (authorId) {
      where.authorId = authorId
      where.organizationId = null
    }

    const documents = await db.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      // Exclude content from list API - content can be very large with embedded images
      // Content is fetched separately when a document is opened for editing
      select: {
        id: true,
        title: true,
        template: true,
        icon: true,
        isStarred: true,
        isTrashed: true,
        authorId: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      documents: documents.map((doc) => ({
        ...doc,
        authorName: doc.author.name || doc.author.email,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Fetch documents error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, template, icon, authorId, content, organizationId } = await request.json()

    if (!title || !authorId) {
      return NextResponse.json(
        { success: false, error: 'Title and author ID are required' },
        { status: 400 }
      )
    }

    // Get template default content
    const templateContent = getTemplateContent(template)

    const document = await db.document.create({
      data: {
        title,
        template: template || 'blank',
        icon: icon || '📄',
        authorId,
        organizationId: organizationId || null,
        content: content || templateContent,
      },
    })

    // Log the change
    await db.changeTrack.create({
      data: {
        documentId: document.id,
        userId: authorId,
        action: 'create',
        description: `Created document "${title}"`,
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getTemplateContent(template: string): string {
  switch (template) {
    case 'software-proposal':
      return `# Software Development Proposal

By [Your Company Name]

## 1. Summary

We propose a custom software solution to streamline [Client]'s operations and improve scalability.

## 2. Scope

- Requirement analysis
- Design & Development
- Integration & Testing
- Deployment & Support

## 3. Timeline

12 weeks total: 2 (Planning) + 8 (Development) + 2 (Launch)

## 4. Budget

Estimated: $XX,XXX (includes development, testing, and support)

## 5. Approval

Signature: ____________________   Date: __________`

    case 'project-proposal':
      return `# Project Proposal

**Project Title:** [Your Project Title Here]

**Prepared By:** [Your Name or Organization]

**Date:** [Proposal Date]

## 1. Introduction

This proposal outlines the plan for the [Project Title]. The purpose of this project is to address [problem/need] by delivering a tailored solution that is efficient, scalable, and user-centric.

## 2. Objectives

- Clearly define the project goals and expected outcomes
- Establish milestones and timelines
- Outline technical and business requirements

## 3. Proposed Solution

The proposed solution involves developing a [web/mobile/desktop] application that allows users to [key features/functions]. The system will be built using [tech stack] and adhere to modern design and security practices.

## 4. Timeline & Deliverables

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Planning | 1 Week | Requirements Doc, Timeline |
| Design | 2 Weeks | Wireframes, UI Mockups |
| Development | 4 Weeks | Functional App |
| Testing & Launch | 1 Week | Final QA, Live Deployment |

## 5. Budget Estimate

The total estimated budget for this project is $XX,XXX. This includes development, testing, design, deployment, and support.

## 6. Conclusion

We believe this project will provide tangible value by [key benefits]. We look forward to collaborating with you and bringing this vision to life.

Sincerely,

[Your Name]
[Position / Team]
[Organization]`

    case 'business-letter':
      return `# Business Letter

[Your Name]
[Your Title]
[Company Name]
[Date]

Dear [Recipient Name],

I am writing to formally address [subject of the letter].

[Body paragraph 1 - Introduction]

[Body paragraph 2 - Main content]

[Body paragraph 3 - Action items or next steps]

Thank you for your attention to this matter. Please don't hesitate to reach out if you have any questions.

Sincerely,

[Your Name]
[Your Title]
[Your Contact Information]`

    case 'resume':
      return `# [Your Name]

📧 [email@example.com] | 📱 [Phone Number] | 📍 [City, State]

---

## Professional Summary
A brief summary highlighting your key qualifications and career goals.

## Experience

### [Job Title] - [Company Name]
*[Start Date] - [End Date]*
- Key achievement or responsibility
- Key achievement or responsibility
- Key achievement or responsibility

### [Job Title] - [Company Name]
*[Start Date] - [End Date]*
- Key achievement or responsibility
- Key achievement or responsibility

## Education

### [Degree] - [University Name]
*Graduation Year*
- Relevant coursework or honors

## Skills
- Technical skills
- Soft skills
- Tools & technologies

---

*References available upon request*`

    case 'cover-letter':
      return `# Cover Letter

[Your Name]
[Your Address]
[City, State, ZIP]
[Email]
[Phone]
[Date]

[Employer Name]
[Company Name]
[Company Address]

Dear [Hiring Manager's Name],

I am excited to apply for the [Position Title] role at [Company Name]. With my background in [relevant field] and passion for [relevant interest], I am confident I would be a valuable addition to your team.

In my previous role at [Previous Company], I [key achievement or responsibility]. This experience taught me [relevant skill or lesson], which I believe would translate well to this position.

What particularly draws me to [Company Name] is [specific reason - company value, project, mission]. I admire [specific detail about the company] and would be thrilled to contribute to [specific goal or project].

I would welcome the opportunity to discuss how my skills and experiences align with your team's needs. Thank you for considering my application.

Best regards,

[Your Name]`

    case 'letter':
      return `# Letter

[Your Name]
[Your Address]
[City, State, ZIP Code]
[Email Address]
[Phone Number]
[Date]

[Recipient Name]
[Recipient Title]
[Recipient Organization]
[Recipient Address]

Dear [Recipient Name],

[Opening paragraph - State the purpose of your letter]

[Body paragraph 1 - Provide details, context, or background information]

[Body paragraph 2 - Elaborate on your main point or make your request]

[Closing paragraph - Summarize and state any action items or next steps]

Thank you for your time and consideration. I look forward to hearing from you.

Warm regards,

[Your Name]
[Your Title]`

    case 'brochure':
      return `# [Company/Organization Name]

## [Tagline or Mission Statement]

---

### About Us
[Brief description of your company or organization. What do you do? What makes you unique?]

---

### Our Services

#### 🎯 [Service 1]
Description of your first service offering and its key benefits.

#### 🚀 [Service 2]
Description of your second service offering and its key benefits.

#### 💡 [Service 3]
Description of your third service offering and its key benefits.

---

### Why Choose Us?
- ✅ **Benefit 1**: [Description]
- ✅ **Benefit 2**: [Description]
- ✅ **Benefit 3**: [Description]
- ✅ **Benefit 4**: [Description]

---

### Testimonials
> "[Customer testimonial 1]" — [Customer Name], [Company]

> "[Customer testimonial 2]" — [Customer Name], [Company]

---

### Contact Us
📧 [Email] | 📱 [Phone] | 🌐 [Website]
📍 [Address]

*Follow us: [Social Media Links]*`

    case 'recipe':
      return `# [Recipe Name]

**Prep Time:** XX minutes | **Cook Time:** XX minutes | **Servings:** X

---

## Ingredients
- [Ingredient 1] - [quantity]
- [Ingredient 2] - [quantity]
- [Ingredient 3] - [quantity]
- [Ingredient 4] - [quantity]
- [Ingredient 5] - [quantity]
- [Ingredient 6] - [quantity]

## Instructions

1. **Step 1**: [Describe the first step in detail]
2. **Step 2**: [Describe the second step]
3. **Step 3**: [Describe the third step]
4. **Step 4**: [Describe the fourth step]
5. **Step 5**: [Describe the final step]

## Chef's Notes
- [Tip or variation]
- [Storage instructions]
- [Serving suggestions]

---

*Recipe by [Your Name]*
*Difficulty: [Easy/Medium/Hard]*`

    case 'meeting-notes':
      return `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Time:** [Start Time] - [End Time]
**Location:** [Meeting Location / Virtual Link]

---

## Attendees
- [Name 1] - [Role]
- [Name 2] - [Role]
- [Name 3] - [Role]
- [Name 4] - [Role]

## Agenda
1. [Agenda item 1]
2. [Agenda item 2]
3. [Agenda item 3]
4. [Agenda item 4]

---

## Discussion Summary

### [Agenda Item 1]
- Key discussion points
- Decisions made
- Concerns raised

### [Agenda Item 2]
- Key discussion points
- Decisions made
- Concerns raised

### [Agenda Item 3]
- Key discussion points
- Decisions made
- Concerns raised

---

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Action 1] | [Name] | [Date] |
| [Action 2] | [Name] | [Date] |
| [Action 3] | [Name] | [Date] |

---

## Next Meeting
**Date:** [Next meeting date]
**Agenda items:** [Brief list]

*Notes taken by [Your Name]*`

    case 'training-proposal':
      return `# Training Proposal

## Overview
This proposal outlines a comprehensive training program designed to enhance team skills and capabilities in [subject area].

## Training Objectives
1. Develop proficiency in [skill area 1]
2. Master best practices for [skill area 2]
3. Apply learned concepts to real-world scenarios
4. Achieve measurable improvement in [KPI/metric]

## Target Audience
- [Department/Team 1]
- [Department/Team 2]
- [Role/Level description]

## Training Structure

### Module 1: [Title]
**Duration:** [X hours/days]
- Learning objective 1
- Learning objective 2
- Hands-on exercise

### Module 2: [Title]
**Duration:** [X hours/days]
- Learning objective 1
- Learning objective 2
- Practical application

### Module 3: [Title]
**Duration:** [X hours/days]
- Learning objective 1
- Learning objective 2
- Assessment & certification

## Delivery Method
- [ ] In-person workshops
- [ ] Virtual training sessions
- [ ] Self-paced online modules
- [ ] Blended learning approach

## Budget Estimate
| Item | Cost |
|------|------|
| Training materials | $X,XXX |
| Instructor fees | $X,XXX |
| Venue/Platform | $X,XXX |
| Certification | $X,XXX |
| **Total** | **$XX,XXX** |

---

*Prepared by [Your Name]*
*Date: ${new Date().toLocaleDateString()}*`

    case 'job-offer-letter':
      return `# Job Offer Letter

[Company Name]
[Company Address]
[Date]

Dear [Candidate Name],

We are delighted to extend an offer of employment for the position of **[Job Title]** at [Company Name]. We were impressed with your qualifications and experience, and we believe you will be a valuable addition to our team.

## Position Details
- **Title:** [Job Title]
- **Department:** [Department Name]
- **Reports to:** [Manager Name and Title]
- **Start Date:** [Start Date]
- **Employment Type:** [Full-time/Part-time/Contract]

## Compensation
- **Base Salary:** $[Amount] per [year/hour]
- **Bonus:** [If applicable]
- **Equity:** [If applicable]

## Benefits
- Health insurance ([details])
- Retirement plan ([details])
- Paid time off: [X] days per year
- [Additional benefits]

## Conditions of Employment
- Successful completion of background check
- Proof of legal right to work
- [Any other conditions]

Please confirm your acceptance of this offer by signing below and returning this letter by [Response Deadline].

We are excited about the possibility of you joining our team!

Warm regards,

[Hiring Manager Name]
[Hiring Manager Title]
[Company Name]

---

**Acceptance:**

I accept the offer of employment as outlined above.

Signature: _________________ Date: _________________`

    case 'essay':
      return `# [Essay Title]

[Your Name]
[Course Name]
[Instructor Name]
[Date]

---

## Introduction

[Begin with a compelling hook that captures the reader's attention. Provide background context for your topic and present your thesis statement — the central argument or claim your essay will support.]

## Body Paragraph 1

**Topic Sentence:** [State the main point of this paragraph]

[Provide evidence, examples, or reasoning that supports your topic sentence. Analyze the evidence and explain how it connects to your thesis.]

## Body Paragraph 2

**Topic Sentence:** [State the main point of this paragraph]

[Continue building your argument with new evidence or a different perspective. Use transition words to connect ideas between paragraphs.]

## Body Paragraph 3

**Topic Sentence:** [State the main point of this paragraph]

[Further develop your argument. Address potential counterarguments and explain why your thesis remains strong.]

## Conclusion

[Restate your thesis in a new way. Summarize the key points you've made. End with a thought-provoking statement, call to action, or implication of your argument.]

---

## References
1. [Author]. ([Year]). *[Title]*. [Publisher].
2. [Author]. ([Year]). *[Title]*. [Publisher].
3. [Author]. ([Year]). *[Title]*. [Publisher].`

    case 'book':
      return `# [Book Title]

**By [Author Name]**

---

## Dedication
[To whom you dedicate this book]

---

## Table of Contents
1. Chapter 1: [Title]
2. Chapter 2: [Title]
3. Chapter 3: [Title]
4. Chapter 4: [Title]
5. Chapter 5: [Title]

---

## Chapter 1: [Chapter Title]

[Begin your chapter with an engaging opening. Develop your narrative, present your ideas, or tell your story. Use paragraphs, dialogue, and descriptive language as appropriate for your genre.]

[Continue writing your chapter content here. Build momentum, develop characters or arguments, and guide the reader through your vision.]

[Close the chapter with a hook or satisfying conclusion that makes the reader want to continue.]

---

## Chapter 2: [Chapter Title]

[Continue your narrative. Reference events or developments from the previous chapter to maintain continuity and build on established themes.]

---

*Copyright © [Year] [Author Name]. All rights reserved.*`

    case 'class-notes':
      return `# Class Notes

**Subject:** [Course/Subject Name]
**Date:** ${new Date().toLocaleDateString()}
**Instructor:** [Instructor Name]
**Topic:** [Today's Topic]

---

## Key Concepts

### [Concept 1]
- Definition: [Define the concept]
- Key points:
  - [Point 1]
  - [Point 2]
  - [Point 3]
- Example: [Provide an example]

### [Concept 2]
- Definition: [Define the concept]
- Key points:
  - [Point 1]
  - [Point 2]
  - [Point 3]
- Example: [Provide an example]

### [Concept 3]
- Definition: [Define the concept]
- Key points:
  - [Point 1]
  - [Point 2]
- Example: [Provide an example]

---

## Important Formulas / Equations
- [Formula 1]: [Description]
- [Formula 2]: [Description]

## Vocabulary
| Term | Definition |
|------|-----------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |
| [Term 3] | [Definition] |

---

## Questions to Review
1. [Question 1]
2. [Question 2]
3. [Question 3]

## Upcoming Assignments
- [ ] [Assignment 1] — Due: [Date]
- [ ] [Assignment 2] — Due: [Date]

---

*Notes by [Your Name]*`

    case 'consulting-agreement':
      return `# Consulting Agreement

This Consulting Agreement ("Agreement") is entered into as of [Date] by and between:

**Client:** [Client Company Name] ("Client")
Address: [Client Address]

**Consultant:** [Consultant Name] ("Consultant")
Address: [Consultant Address]

---

## 1. Scope of Services
The Consultant agrees to provide the following services to the Client:
- [Service description 1]
- [Service description 2]
- [Service description 3]

## 2. Term
This Agreement shall commence on [Start Date] and continue until [End Date], unless terminated earlier in accordance with Section 7.

## 3. Compensation
- **Fee:** $[Amount] per [hour/day/month/project]
- **Payment Schedule:** [Net 30 / Upon completion / Monthly]
- **Expenses:** [Reimbursable / Not reimbursable]

## 4. Deliverables
| Deliverable | Due Date |
|------------|----------|
| [Deliverable 1] | [Date] |
| [Deliverable 2] | [Date] |
| [Deliverable 3] | [Date] |

## 5. Confidentiality
The Consultant agrees to maintain the confidentiality of all proprietary information disclosed by the Client during the term of this Agreement.

## 6. Independent Contractor
The Consultant is an independent contractor and not an employee of the Client. The Consultant is responsible for all taxes and insurance.

## 7. Termination
Either party may terminate this Agreement with [X] days written notice. Upon termination, the Consultant shall be compensated for work completed to date.

## 8. Governing Law
This Agreement shall be governed by the laws of [State/Jurisdiction].

---

**Signatures:**

Client: _________________________ Date: _____________
Name: [Name]
Title: [Title]

Consultant: _____________________ Date: _____________
Name: [Name]`

    default:
      return `# Untitled Document

Start writing here...

`
  }
}
