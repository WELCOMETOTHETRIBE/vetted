/**
 * Query templates for Engineer Finder
 * Templates use {{variable}} syntax for substitution
 */

export interface QueryTemplate {
  id: string
  name: string
  source: "linkedin" | "github" | "scholar" | "youtube" | "patents" | "stackoverflow" | "general"
  description: string
  queryTemplate: string
  defaultVars: Record<string, string | string[]>
  tags: string[]
}

export const queryTemplates: QueryTemplate[] = [
  {
    id: "linkedin-staff-principal-infra",
    name: "LinkedIn Staff/Principal Infrastructure Engineers",
    source: "linkedin",
    description: "Find senior infrastructure engineers with distributed systems experience",
    queryTemplate: 'site:linkedin.com/in ("Staff" OR "Principal" OR "Distinguished") (engineer OR "software engineer") ("distributed systems" OR "low latency" OR "storage" OR "infrastructure") {{location}} -jobs -company -dir',
    defaultVars: {
      location: "San Francisco",
    },
    tags: ["senior", "infrastructure", "distributed systems"],
  },
  {
    id: "linkedin-maintainer-contributor",
    name: "LinkedIn Maintainers & Core Contributors",
    source: "linkedin",
    description: "Find engineers who maintain or contribute to major open source projects",
    queryTemplate: 'site:linkedin.com/in (maintainer OR "core contributor" OR "tech lead") (Kubernetes OR "Linux kernel" OR "LLVM" OR "PostgreSQL" OR "Redis" OR "MongoDB") {{location}} -jobs -company',
    defaultVars: {
      location: "San Francisco",
    },
    tags: ["open source", "maintainer", "contributor"],
  },
  {
    id: "github-maintainers-k8s",
    name: "GitHub K8s Ecosystem Maintainers",
    source: "github",
    description: "Find maintainers of Kubernetes ecosystem projects",
    queryTemplate: 'site:github.com (maintainer OR "core team") (kubernetes OR envoy OR istio OR prometheus OR grafana) {{location}}',
    defaultVars: {
      location: "San Francisco",
    },
    tags: ["kubernetes", "maintainer", "github"],
  },
  {
    id: "github-author-signal",
    name: "GitHub Project Authors",
    source: "github",
    description: "Find engineers who authored significant projects",
    queryTemplate: 'site:github.com in:readme ("author" OR "created by") ("compiler" OR "database" OR "runtime" OR "distributed systems")',
    defaultVars: {},
    tags: ["author", "creator", "github"],
  },
  {
    id: "scholar-ml-systems",
    name: "Scholar ML Systems & Inference",
    source: "scholar",
    description: "Find researchers working on ML systems and inference optimization",
    queryTemplate: 'site:scholar.google.com ("large language model" OR LLM OR "machine learning systems") ("inference" OR "serving" OR "systems" OR "optimization") {{location}}',
    defaultVars: {
      location: "United States",
    },
    tags: ["ml", "research", "inference"],
  },
  {
    id: "conference-speakers",
    name: "Conference Speakers (Deep Technical)",
    source: "general",
    description: "Find engineers who speak at major tech conferences",
    queryTemplate: '("speaker" OR "talk" OR "presentation") (KubeCon OR QCon OR SREcon OR "Strange Loop" OR "OSDI" OR "SOSP") ("deep dive" OR "internals" OR "systems") (Rust OR Kubernetes OR Postgres OR "distributed systems")',
    defaultVars: {},
    tags: ["speaker", "conference", "technical"],
  },
  {
    id: "patents-inventors",
    name: "Patent Inventors (Distributed Systems)",
    source: "patents",
    description: "Find engineers who have patents in distributed systems",
    queryTemplate: 'site:patents.google.com (inventor) ("distributed storage" OR "consensus" OR "networking" OR "distributed systems") ("Google" OR "Microsoft" OR "Amazon" OR "Meta" OR "Netflix")',
    defaultVars: {},
    tags: ["patents", "inventor", "distributed systems"],
  },
  {
    id: "stackoverflow-top-contributors",
    name: "Stack Overflow Top Contributors (Systems)",
    source: "stackoverflow",
    description: "Find top Stack Overflow contributors in systems programming",
    queryTemplate: 'site:stackoverflow.com (user:reputation>10000) ("rust" OR "c++" OR "systems programming" OR "distributed systems" OR "performance")',
    defaultVars: {},
    tags: ["stackoverflow", "contributor", "systems"],
  },
  {
    id: "youtube-technical-talks",
    name: "YouTube Technical Talk Presenters",
    source: "youtube",
    description: "Find engineers who present technical deep dives on YouTube",
    queryTemplate: 'site:youtube.com ("systems engineer" OR "infrastructure engineer") ("deep dive" OR "internals" OR "how it works") (Kubernetes OR "distributed systems" OR "database" OR "compiler")',
    defaultVars: {},
    tags: ["youtube", "presenter", "technical"],
  },
  {
    id: "linkedin-ai-systems",
    name: "LinkedIn AI/ML Systems Engineers",
    source: "linkedin",
    description: "Find engineers building AI/ML infrastructure and systems",
    queryTemplate: 'site:linkedin.com/in ("AI Engineer" OR "ML Engineer" OR "ML Systems Engineer") ("inference" OR "serving" OR "training infrastructure" OR "vector database") {{location}} -jobs',
    defaultVars: {
      location: "San Francisco",
      roleKeywords: "AI Engineer",
    },
    tags: ["ai", "ml", "systems"],
  },
]

export function getTemplateById(id: string): QueryTemplate | undefined {
  return queryTemplates.find((t) => t.id === id)
}

export function getTemplatesBySource(source: QueryTemplate["source"]): QueryTemplate[] {
  return queryTemplates.filter((t) => t.source === source)
}

export function getTemplatesByTag(tag: string): QueryTemplate[] {
  return queryTemplates.filter((t) => t.tags.includes(tag))
}

