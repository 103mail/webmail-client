import type { MailThread } from "../types";

export const sampleThreads: MailThread[] = [
  {
    id: "t1",
    folderId: "john-inbox",
    subject: "Weekly sync notes",
    read: false,
    messages: [
      {
        id: "t1-3",
        from: { name: "Carol Williams", email: "carol@103mail.com" },
        to: [
          { name: "Alice Johnson", email: "alice@103mail.com" },
          { name: "John", email: "john@103mail.com" },
        ],
        body: "Thanks Alice, I added a few comments on the roadmap section. John, can you review?",
        date: "2026-04-11T11:20:00Z",
      },
      {
        id: "t1-2",
        from: { name: "Alice Johnson", email: "alice@103mail.com" },
        to: [
          { name: "John", email: "john@103mail.com" },
          { name: "Carol Williams", email: "carol@103mail.com" },
        ],
        body: "Hi both,\n\nHere are the notes from today's sync. Let me know if I missed anything.\n\nBest,\nAlice",
        date: "2026-04-11T09:15:00Z",
      },
      {
        id: "t1-1",
        from: { name: "John", email: "john@103mail.com" },
        to: [
          { name: "Alice Johnson", email: "alice@103mail.com" },
          { name: "Carol Williams", email: "carol@103mail.com" },
        ],
        body: "Can someone take notes during the sync today? I'll be joining late.",
        date: "2026-04-11T08:00:00Z",
      },
    ],
  },
  {
    id: "t2",
    folderId: "john-inbox",
    subject: "Re: Deployment schedule",
    read: true,
    messages: [
      {
        id: "t2-2",
        from: { name: "Bob Smith", email: "bob@103mail.com" },
        to: [{ name: "John", email: "john@103mail.com" }],
        body: "Looks good to me. Let's aim for Thursday.\n\nBob",
        date: "2026-04-11T08:42:00Z",
      },
      {
        id: "t2-1",
        from: { name: "John", email: "john@103mail.com" },
        to: [{ name: "Bob Smith", email: "bob@103mail.com" }],
        body: "Bob,\n\nI'm thinking we push the deploy to later this week. Thoughts?",
        date: "2026-04-10T17:30:00Z",
      },
    ],
  },
  {
    id: "t3",
    folderId: "john-inbox",
    subject: "Invoice #1042 attached",
    read: true,
    messages: [
      {
        id: "t3-1",
        from: { name: "Carol Williams", email: "carol@103mail.com" },
        to: [{ name: "John", email: "john@103mail.com" }],
        body: "Hi John,\n\nPlease find the invoice attached. Payment is due by end of month.\n\nThanks,\nCarol",
        date: "2026-04-10T16:30:00Z",
        attachments: [
          { id: "a1", name: "Invoice_1042.pdf", size: "245 KB", type: "application/pdf" },
        ],
      },
    ],
  },
  {
    id: "t4",
    folderId: "john-inbox",
    subject: "Lunch tomorrow?",
    read: false,
    messages: [
      {
        id: "t4-1",
        from: { name: "David Brown", email: "david@103mail.com" },
        to: [{ name: "John", email: "john@103mail.com" }],
        body: "Hey, want to grab lunch tomorrow? There's a new place on 5th street.",
        date: "2026-04-10T12:05:00Z",
      },
    ],
  },
  {
    id: "t5",
    folderId: "jane-inbox",
    subject: "Q2 planning doc",
    read: false,
    messages: [
      {
        id: "t5-3",
        from: { name: "Jane", email: "jane@work.org" },
        to: [
          { name: "Eve Davis", email: "eve@103mail.com" },
          { name: "Frank Miller", email: "frank@103mail.com" },
        ],
        body: "Done — sections 3 and 4 look good. I left a few suggestions inline.",
        date: "2026-04-11T14:00:00Z",
      },
      {
        id: "t5-2",
        from: { name: "Frank Miller", email: "frank@103mail.com" },
        to: [
          { name: "Eve Davis", email: "eve@103mail.com" },
          { name: "Jane", email: "jane@work.org" },
        ],
        body: "I've updated the budget estimates in section 4. Jane, please double-check the numbers.",
        date: "2026-04-11T12:10:00Z",
      },
      {
        id: "t5-1",
        from: { name: "Eve Davis", email: "eve@103mail.com" },
        to: [{ name: "Jane", email: "jane@work.org" }],
        body: "Jane,\n\nI've shared the Q2 planning doc with you. Please review sections 3 and 4 before Friday.\n\nThanks,\nEve",
        date: "2026-04-11T10:00:00Z",
        attachments: [
          { id: "a2", name: "Q2_Planning_2026.docx", size: "1.2 MB", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
          { id: "a3", name: "Budget_Estimates.xlsx", size: "340 KB", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        ],
      },
    ],
  },
  {
    id: "t6",
    folderId: "jane-inbox",
    subject: "Conference tickets confirmed",
    read: true,
    messages: [
      {
        id: "t6-2",
        from: { name: "Frank Miller", email: "frank@103mail.com" },
        to: [{ name: "Jane", email: "jane@work.org" }],
        body: "All set — I've added the hotel booking confirmation too. See you there!",
        date: "2026-04-10T16:45:00Z",
      },
      {
        id: "t6-1",
        from: { name: "Frank Miller", email: "frank@103mail.com" },
        to: [{ name: "Jane", email: "jane@work.org" }],
        body: "Hi Jane,\n\nYour tickets for the React Summit are confirmed. Details below.\n\nCheers,\nFrank",
        date: "2026-04-10T14:20:00Z",
      },
    ],
  },
  {
    id: "t7",
    folderId: "jane-inbox",
    subject: "Bug report: login page",
    read: true,
    messages: [
      {
        id: "t7-1",
        from: { name: "Grace Wilson", email: "grace@103mail.com" },
        to: [{ name: "Jane", email: "jane@work.org" }],
        body: "Jane,\n\nUsers are reporting a 500 error on the login page when using Safari. Can you take a look?\n\nGrace",
        date: "2026-04-09T17:45:00Z",
      },
    ],
  },
];
