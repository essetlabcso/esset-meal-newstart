export type LandingNavItem = {
    id: string;
    label: string;
};

export const LANDING_NAV_ITEMS: LandingNavItem[] = [
    { id: "about", label: "About" },
    { id: "how-it-works", label: "How it Works" },
    { id: "reality-check", label: "Reality Check" },
    { id: "use-cases", label: "Scenarios" },
    { id: "faq", label: "FAQ" },
];

export const BEFORE_ESSET = [
    "Evidence collection starts at the deadline.",
    "Data lives in scattered folders and chats.",
    "Reports are reconstructed from memory.",
    "No clear link between activities and outcomes.",
    "Indicators update only for reporting weeks.",
    "Changes are not tracked clearly over time.",
    "Lessons are discussed but never captured.",
    "Partner inputs arrive in messy formats.",
];

export const WITH_ESSET = [
    "Reporting starts on day one — no scramble.",
    "**Single source of truth**: ToC-linked data.",
    "**ToC-linked evidence** captured as you work.",
    "Institutional memory stays safe and accessible.",
    "**Readiness visible day one** with live tracking.",
    "Changes and learning documented over time.",
    "Lessons become clear decisions and actions.",
    "Partner inputs stay organized and comparable.",
];

/* Backward-compatible re-exports */
export const REACTIVE_REPORTING_CYCLE = BEFORE_ESSET.slice(0, 4);
export const ESSET_STANDARD = WITH_ESSET.slice(0, 4);
export const TYPICAL_WORKFLOW = BEFORE_ESSET;
export const ESSET_WORKFLOW = WITH_ESSET;

export const WHAT_WHY_HOW = [
    {
        title: "What",
        subtitle: "What is ESSET MEAL?",
        body: "A practical workspace that connects your results map, evidence, and reporting.",
    },
    {
        title: "Why",
        subtitle: "Why use it?",
        body: "So reporting stops being a last-minute rebuild from folders, chats, and memory.",
    },
    {
        title: "How",
        subtitle: "How does it work?",
        body: "Capture evidence as you implement, link it to results, and generate reporting packs anytime.",
    },
];

export const HOW_IT_WORKS_STEPS = [
    {
        step: "Step 1",
        title: "Map Strategy",
        body: "Build your results map. Define key outcomes and outputs in a simple ToC map.",
        hint: "Start with one project and its main pathways.",
    },
    {
        step: "Step 2",
        title: "Capture Evidence",
        body: "Add indicator updates and attach stories, survey findings, and field evidence.",
        hint: "Link each evidence item to a map node.",
    },
    {
        step: "Step 3",
        title: "Learn & Adapt",
        body: "Turn ongoing tracking into dashboards, draft reports, and short learning notes — so your team can adapt before the next deadline.",
        hint: "See what is on track — and decide what to change.",
    },
];

export const ACCESS_CONTROL_ROWS = [
    {
        role: "Field Team",
        access: "Input activity data and evidence limited to their scope.",
        capability: "Write",
    },
    {
        role: "MEAL Team",
        access: "Review aggregated data and validate quality before publishing.",
        capability: "Review",
    },
    {
        role: "Program Manager",
        access: "Approve reports and control what gets shared externally.",
        capability: "Approve",
    },
    {
        role: "Donor",
        access: "View final reports without internal drafts or raw evidence.",
        capability: "Read only",
    },
];

export const MANIFESTO_LINES = [
    "MEAL should end in a decision, not a document.",
    "Reporting should start on day one, not at the deadline.",
    "Evidence is stronger when linked to the result it supports.",
    "Learning counts only when it changes what we do next.",
    "Communities deserve clear 'You said, we did' closure.",
    "Adaptation should be explainable, not defensible.",
    "Partners' contributions should be comparable, not chaotic.",
    "A good system reduces panic and increases clarity.",
];

export const TAILORED_SOLUTIONS = [
    {
        title: "Multi-Project Porto-folios",
        body: "Keep results, evidence, and reporting consistent across your entire portfolio.",
        fit: "Best for MEAL officers managing multiple grants.",
    },
    {
        title: "Consortium & Sub-Grants",
        body: "Collect partner inputs in a comparable format and consolidate into reporting packs.",
        fit: "Best for lead agencies and network coordinators.",
    },
    {
        title: "Low-Bandwidth Field Ops",
        body: "Capture evidence as teams work, even with constrained field connectivity.",
        fit: "Best for frontline field teams and partners.",
    },
    {
        title: "Adaptive & Iterative Learning",
        body: "Track assumptions, changes, and decisions without losing critical project history.",
        fit: "Best for complex, fast-changing humanitarian contexts.",
    },
];

export const RESOURCES = [
    {
        title: "ESSET MEAL Toolkit",
        body: "Practical templates and checklists to build a calm, evidence-linked workflow.",
        status: "Toolkit (coming soon)",
    },
    {
        title: "Quick videos (2–5 min)",
        body: "Short walkthroughs for Reality Check, evidence linking, and reporting packs.",
        status: "Coming soon",
    },
    {
        title: "Blogs and insights",
        body: "Guidance on adaptive MEAL, reporting quality, and learning in complex contexts.",
        status: "Coming soon",
    },
    {
        title: "Self-paced learning",
        body: "Short lessons for teams to set up, run, and improve their MEAL system.",
        status: "Coming soon",
    },
];

export type FaqItem = {
    question: string;
    answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
    {
        question: "Do I need strong internet to use ESSET MEAL?",
        answer:
            "No. Teams can work in low-bandwidth contexts and sync updates when connection is available.",
    },
    {
        question: "Can we use it with partners and consortia?",
        answer:
            "Yes. ESSET is designed for partner inputs with role-based access and aggregated visibility.",
    },
    {
        question: "What do we need to get started in 7 days?",
        answer:
            "A project scope, key users, and basic reporting needs are enough to start a pilot setup.",
    },
    {
        question: "Is the Reality Check saved or shared with anyone?",
        answer:
            "Reality Check responses stay in your browser only. Nothing is uploaded by default.",
    },
    {
        question: "Can we export results for donor reporting?",
        answer:
            "Yes. Reporting outputs are built from linked evidence and can be exported for donor updates.",
    },
    {
        question: "How does ESSET handle data privacy and access control?",
        answer:
            "Access is role-based and scoped by workspace and project. Teams only see data within their permissions.",
    },
    {
        question: "Can we start simple and grow later?",
        answer:
            "Yes. Teams can start with one project workflow and expand modules as capacity grows.",
    },
    {
        question: "What happens after the 7-Day Pilot?",
        answer:
            "You review fit, decide implementation scope, and transition to a full workspace rollout if needed.",
    },
];

export type RealityCheckQuestion = {
    id: string;
    prompt: string;
};

export const REALITY_CHECK_QUESTIONS: RealityCheckQuestion[] = [
    { id: "q1", prompt: "We start evidence collection only when reporting deadlines arrive." },
    { id: "q2", prompt: "Our MEAL data is spread across many folders, chats, and personal files." },
    { id: "q3", prompt: "Indicator definitions are unclear or interpreted differently by teams." },
    { id: "q4", prompt: "We struggle to connect collected evidence to specific outcomes in our ToC." },
    { id: "q5", prompt: "Reports are rebuilt manually from memory at the end of the period." },
    { id: "q6", prompt: "When staff changes happen, project knowledge is lost." },
    { id: "q7", prompt: "Partner submissions arrive in inconsistent formats and need heavy cleanup." },
    { id: "q8", prompt: "Learning discussions happen, but decisions are not recorded clearly." },
    { id: "q9", prompt: "Program changes are made without a traceable evidence trail." },
    { id: "q10", prompt: "Access control is unclear, so teams see too much or too little information." },
    { id: "q11", prompt: "We cannot quickly see what data is missing before reporting week." },
    { id: "q12", prompt: "It is hard to explain why results changed across reporting periods." },
];
