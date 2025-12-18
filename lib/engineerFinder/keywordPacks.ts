/**
 * Keyword packs for quick injection into engineer finder queries
 */

export const keywordPacks = {
  distributedInfra: [
    "distributed systems",
    "fault tolerant",
    "consensus",
    "raft",
    "paxos",
    "low latency",
    "high throughput",
    "scalability",
    "microservices",
    "service mesh",
  ],
  performance: [
    "profiling",
    "perf",
    "flame graph",
    "eBPF",
    "tail latency",
    "lock contention",
    "optimization",
    "benchmarking",
    "performance engineering",
    "systems performance",
  ],
  mlSystems: [
    "inference",
    "serving",
    "training pipeline",
    "vector database",
    "retrieval",
    "quantization",
    "model serving",
    "ML infrastructure",
    "deep learning systems",
    "model optimization",
  ],
  languages: [
    "rust",
    "modern c++",
    "go runtime",
    "jvm internals",
    "wasm",
    "llvm",
    "compiler",
    "runtime",
    "systems programming",
  ],
  databases: [
    "database internals",
    "storage engine",
    "query optimizer",
    "transaction processing",
    "consensus protocol",
    "distributed database",
  ],
  security: [
    "security engineering",
    "cryptography",
    "zero trust",
    "secure systems",
    "vulnerability research",
  ],
  compilers: [
    "compiler",
    "language runtime",
    "jit",
    "code generation",
    "optimization passes",
  ],
} as const

export type KeywordPackName = keyof typeof keywordPacks

export function getKeywordPack(name: KeywordPackName): string[] {
  return keywordPacks[name] || []
}

export function getAllKeywords(): string[] {
  return Object.values(keywordPacks).flat()
}

