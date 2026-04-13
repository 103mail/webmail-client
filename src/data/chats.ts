import type { Chat, ChatMessage, ChatParticipant } from "../types";

/* ── Own user (the logged-in user) ── */
export const ownUser: ChatParticipant = {
  id: "me",
  name: "John Doe",
  email: "john@103mail.com",
  avatar: "",
  status: "online",
};

/* ── Contacts / participants ── */
export const chatParticipants: ChatParticipant[] = [
  ownUser,
  { id: "alice", name: "Alice Johnson", email: "alice@example.com", avatar: "", status: "online" },
  { id: "bob", name: "Bob Smith", email: "bob@example.com", avatar: "", status: "last seen 25 min ago" },
  { id: "carol", name: "Carol Williams", email: "carol@example.com", avatar: "", status: "last seen 1h ago" },
  { id: "david", name: "David Brown", email: "david@example.com", avatar: "", status: "online" },
  { id: "eve", name: "Eve Davis", email: "eve@example.com", avatar: "", status: "last seen yesterday" },
  { id: "frank", name: "Frank Miller", email: "frank@example.com", avatar: "", status: "last seen 3h ago" },
  { id: "grace", name: "Grace Wilson", email: "grace@example.com", avatar: "", status: "online" },
  { id: "henry", name: "Henry Moore", email: "henry@example.com", avatar: "", status: "last seen 2 days ago" },
];

export const participantMap = new Map(chatParticipants.map((p) => [p.id, p]));

/* ── Helper to build messages ── */
let msgSeq = 0;
function msg(
  chatId: string,
  fromId: string,
  body: string,
  minutesAgo: number,
  status: "sent" | "delivered" | "read" = "read",
): ChatMessage {
  const ts = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  return { id: `msg-${++msgSeq}`, chatId, fromId, body, timestamp: ts, status };
}

/* ── Sample chats ── */
export const sampleChats: Chat[] = [
  {
    id: "chat-alice",
    isGroup: false,
    name: "Alice Johnson",
    avatar: "",
    participants: ["me", "alice"],
    unreadCount: 2,
    lastActivity: new Date(Date.now() - 3 * 60_000).toISOString(),
    description: "UX Designer at Acme Corp",
    messages: [
      msg("chat-alice", "alice", "Hey! Have you seen the new mockups?", 120, "read"),
      msg("chat-alice", "me", "Not yet, can you share them?", 115, "read"),
      msg("chat-alice", "alice", "Sure! I'll send them over in a sec 😊", 110, "read"),
      msg("chat-alice", "me", "Awesome, thanks! 🙌", 105, "read"),
      msg("chat-alice", "alice", "Here you go: mockups-v3.fig", 60, "read"),
      msg("chat-alice", "me", "These look great! Love the new color scheme", 55, "read"),
      msg("chat-alice", "alice", "Thanks! The client wanted something bolder", 50, "read"),
      msg("chat-alice", "me", "Makes sense. Should we discuss in the meeting tomorrow?", 45, "delivered"),
      msg("chat-alice", "alice", "Yes! I also updated the component library", 5),
      msg("chat-alice", "alice", "Can you review when you get a chance? 🙏", 3),
    ],
  },
  {
    id: "chat-team",
    isGroup: true,
    name: "Project Alpha Team",
    avatar: "",
    participants: ["me", "alice", "bob", "carol", "david"],
    unreadCount: 5,
    lastActivity: new Date(Date.now() - 8 * 60_000).toISOString(),
    description: "Planning and coordination for Project Alpha",
    messages: [
      msg("chat-team", "bob", "Morning everyone! Sprint review at 10am", 180, "read"),
      msg("chat-team", "carol", "I'll be there 👍", 175, "read"),
      msg("chat-team", "me", "Same here. I'll share the demo.", 170, "read"),
      msg("chat-team", "alice", "Can we also discuss the timeline?", 165, "read"),
      msg("chat-team", "david", "Sure, I have the updated Gantt chart ready", 160, "read"),
      msg("chat-team", "bob", "Perfect. Also, the client moved the deadline up by a week 😬", 30),
      msg("chat-team", "carol", "Oh no, that's tight. What can we cut?", 25),
      msg("chat-team", "alice", "The animations can be phase 2", 20),
      msg("chat-team", "david", "Agreed. Let's prioritize core functionality", 15),
      msg("chat-team", "bob", "Makes sense. Let's finalize the scope in the meeting", 8),
    ],
  },
  {
    id: "chat-bob",
    isGroup: false,
    name: "Bob Smith",
    avatar: "",
    participants: ["me", "bob"],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 45 * 60_000).toISOString(),
    description: "Backend Developer",
    messages: [
      msg("chat-bob", "me", "Hey Bob, is the API ready for testing?", 120, "read"),
      msg("chat-bob", "bob", "Almost! Just fixing one edge case", 90, "read"),
      msg("chat-bob", "me", "No rush, just checking in", 85, "read"),
      msg("chat-bob", "bob", "Done! You can test now. Endpoint: /api/v2/users", 50, "read"),
      msg("chat-bob", "me", "Thanks! I'll run the integration tests 🚀", 45, "read"),
    ],
  },
  {
    id: "chat-carol",
    isGroup: false,
    name: "Carol Williams",
    avatar: "",
    participants: ["me", "carol"],
    unreadCount: 1,
    lastActivity: new Date(Date.now() - 90 * 60_000).toISOString(),
    description: "Product Manager",
    messages: [
      msg("chat-carol", "carol", "Hi John! Quick question about the release", 200, "read"),
      msg("chat-carol", "me", "Sure, what's up?", 195, "read"),
      msg("chat-carol", "carol", "Are we still on track for Friday?", 190, "read"),
      msg("chat-carol", "me", "Yes, all tests are passing. QA starts tomorrow.", 185, "read"),
      msg("chat-carol", "carol", "Great! The stakeholders will be happy 😄", 90),
    ],
  },
  {
    id: "chat-design",
    isGroup: true,
    name: "Design Crew",
    avatar: "",
    participants: ["me", "alice", "eve", "grace"],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 3 * 3600_000).toISOString(),
    description: "Design system discussions and reviews",
    messages: [
      msg("chat-design", "eve", "New icon set is uploaded to Figma", 240, "read"),
      msg("chat-design", "grace", "Love them! Very clean 🎨", 235, "read"),
      msg("chat-design", "alice", "Should we update the style guide?", 230, "read"),
      msg("chat-design", "me", "Yes, I can draft the updates this week", 220, "read"),
      msg("chat-design", "eve", "Thanks John! Tag me for review", 200, "read"),
    ],
  },
  {
    id: "chat-david",
    isGroup: false,
    name: "David Brown",
    avatar: "",
    participants: ["me", "david"],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 5 * 3600_000).toISOString(),
    description: "DevOps Engineer",
    messages: [
      msg("chat-david", "david", "CI pipeline is green again ✅", 360, "read"),
      msg("chat-david", "me", "Finally! What was the issue?", 355, "read"),
      msg("chat-david", "david", "Flaky test in the auth module. I added retries for now.", 350, "read"),
      msg("chat-david", "me", "Good call. We should fix the root cause though.", 340, "read"),
      msg("chat-david", "david", "Yeah, I'll create a ticket for it", 300, "read"),
    ],
  },
  {
    id: "chat-eve",
    isGroup: false,
    name: "Eve Davis",
    avatar: "",
    participants: ["me", "eve"],
    unreadCount: 0,
    lastActivity: new Date(Date.now() - 24 * 3600_000).toISOString(),
    description: "Graphic Designer",
    messages: [
      msg("chat-eve", "me", "Hey Eve, loved the new logo concepts!", 1500, "read"),
      msg("chat-eve", "eve", "Thanks! Which one do you prefer?", 1490, "read"),
      msg("chat-eve", "me", "The second one with the gradient 💜", 1480, "read"),
      msg("chat-eve", "eve", "Good choice! I'll refine that one.", 1440, "read"),
    ],
  },
  {
    id: "chat-frank",
    isGroup: false,
    name: "Frank Miller",
    avatar: "",
    participants: ["me", "frank"],
    unreadCount: 3,
    lastActivity: new Date(Date.now() - 20 * 60_000).toISOString(),
    description: "Security Analyst",
    messages: [
      msg("chat-frank", "frank", "Found a vulnerability in the auth flow", 60, "read"),
      msg("chat-frank", "me", "Yikes! What kind?", 55, "read"),
      msg("chat-frank", "frank", "XSS in the password reset page", 50, "read"),
      msg("chat-frank", "me", "I'll patch it right away", 45, "read"),
      msg("chat-frank", "frank", "Already submitted a detailed report", 40, "read"),
      msg("chat-frank", "frank", "Also check the session handling", 25),
      msg("chat-frank", "frank", "There might be a token leak in the refresh flow", 22),
      msg("chat-frank", "frank", "I'll send over the full audit report by EOD", 20),
    ],
  },
];
