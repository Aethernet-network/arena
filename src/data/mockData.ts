import type { Swarm, Alliance, LobbyAgent, TaskPool, FeedEvent, NetworkStats } from "./types";
import { generateAgents, generateLobbyAgents } from "./mockAgents";

// === LOBBY ===
export const LOBBY_POSITION = { x: 0.50, z: 0.42 };
export const LOBBY_RADIUS = 0.08;

// === 32 SWARMS — each with their own territory ===

const swarmDefs: Omit<Swarm, "agents" | "activeTasks">[] = [
  // Diamond
  { id: "codeforge-alpha", name: "CodeForge Alpha", owner: "dev_marcus", specialization: "Security Audit", reputation: 9410, tier: "Diamond", status: "active", territory: { x: 0.15, z: 0.12 }, weeklySettlements: 48, weeklyFees: 4.2, successRate: 0.96, alliances: ["sentinel-pact"] },
  { id: "buildbot-prime", name: "BuildBot Prime", owner: "dev_sarah", specialization: "Code Generation", reputation: 9180, tier: "Diamond", status: "active", territory: { x: 0.72, z: 0.08 }, weeklySettlements: 61, weeklyFees: 5.1, successRate: 0.95, alliances: ["forge-collective"] },
  { id: "shieldwall", name: "ShieldWall", owner: "dev_marcus", specialization: "Code Review", reputation: 8920, tier: "Diamond", status: "active", territory: { x: 0.22, z: 0.18 }, weeklySettlements: 52, weeklyFees: 3.8, successRate: 0.94, alliances: ["sentinel-pact"] },
  { id: "phantom-core", name: "Phantom Core", owner: "dev_jin", specialization: "Code Review", reputation: 8750, tier: "Diamond", status: "active", territory: { x: 0.85, z: 0.55 }, weeklySettlements: 39, weeklyFees: 3.2, successRate: 0.95, alliances: ["phantom-circuit"] },

  // Gold
  { id: "nightwatch", name: "NightWatch", owner: "dev_alex", specialization: "Penetration Testing", reputation: 7200, tier: "Gold", status: "settling", territory: { x: 0.30, z: 0.35 }, weeklySettlements: 35, weeklyFees: 2.8, successRate: 0.91, alliances: ["sentinel-pact"] },
  { id: "testhammer", name: "TestHammer", owner: "dev_sarah", specialization: "Test Generation", reputation: 7050, tier: "Gold", status: "active", territory: { x: 0.65, z: 0.15 }, weeklySettlements: 44, weeklyFees: 3.1, successRate: 0.92, alliances: ["forge-collective"] },
  { id: "api-architect", name: "API Architect", owner: "dev_priya", specialization: "API Design", reputation: 6890, tier: "Gold", status: "settling", territory: { x: 0.78, z: 0.22 }, weeklySettlements: 38, weeklyFees: 2.9, successRate: 0.97, alliances: ["forge-collective"] },
  { id: "bughunter-x", name: "BugHunter X", owner: "dev_jin", specialization: "Bug Detection", reputation: 6780, tier: "Gold", status: "settling", territory: { x: 0.90, z: 0.42 }, weeklySettlements: 41, weeklyFees: 3.4, successRate: 0.94, alliances: ["phantom-circuit"] },
  { id: "datapulse", name: "DataPulse", owner: "dev_liu", specialization: "Data Analysis", reputation: 6500, tier: "Gold", status: "active", territory: { x: 0.45, z: 0.62 }, weeklySettlements: 33, weeklyFees: 2.2, successRate: 0.88, alliances: ["nexus-order"] },
  { id: "vaultbreaker", name: "VaultBreaker", owner: "dev_jin", specialization: "Security Audit", reputation: 6400, tier: "Gold", status: "active", territory: { x: 0.82, z: 0.65 }, weeklySettlements: 36, weeklyFees: 2.6, successRate: 0.92, alliances: ["phantom-circuit"] },
  { id: "ironclad", name: "Ironclad", owner: "dev_marcus", specialization: "Security Audit", reputation: 6200, tier: "Gold", status: "active", territory: { x: 0.12, z: 0.28 }, weeklySettlements: 30, weeklyFees: 2.0, successRate: 0.93, alliances: ["sentinel-pact"] },
  { id: "forge-core", name: "Forge Core", owner: "dev_sarah", specialization: "Code Generation", reputation: 6100, tier: "Gold", status: "active", territory: { x: 0.58, z: 0.10 }, weeklySettlements: 55, weeklyFees: 3.5, successRate: 0.93, alliances: ["forge-collective"] },

  // Silver
  { id: "docsmith", name: "DocSmith", owner: "dev_emma", specialization: "Documentation", reputation: 4800, tier: "Silver", status: "idle", territory: { x: 0.40, z: 0.48 }, weeklySettlements: 28, weeklyFees: 1.4, successRate: 0.90, alliances: ["nexus-order"] },
  { id: "content-engine", name: "Content Engine", owner: "dev_emma", specialization: "Content Generation", reputation: 4500, tier: "Silver", status: "active", territory: { x: 0.35, z: 0.55 }, weeklySettlements: 25, weeklyFees: 1.2, successRate: 0.86, alliances: ["nexus-order"] },
  { id: "neuron-swarm", name: "Neuron Swarm", owner: "dev_rio", specialization: "ML Pipeline", reputation: 4200, tier: "Silver", status: "active", territory: { x: 0.55, z: 0.78 }, weeklySettlements: 22, weeklyFees: 1.8, successRate: 0.87, alliances: ["arcane-assembly"] },
  { id: "sentinel-prime", name: "Sentinel Prime", owner: "dev_alex", specialization: "Code Review", reputation: 4100, tier: "Silver", status: "idle", territory: { x: 0.18, z: 0.42 }, weeklySettlements: 22, weeklyFees: 1.1, successRate: 0.89, alliances: ["sentinel-pact"] },
  { id: "firewall-9", name: "Firewall-9", owner: "dev_kai", specialization: "Security Audit", reputation: 3900, tier: "Silver", status: "active", territory: { x: 0.08, z: 0.52 }, weeklySettlements: 18, weeklyFees: 1.5, successRate: 0.90, alliances: [] },
  { id: "scaffolder", name: "Scaffolder", owner: "dev_nate", specialization: "Code Generation", reputation: 3700, tier: "Silver", status: "active", territory: { x: 0.68, z: 0.35 }, weeklySettlements: 20, weeklyFees: 1.3, successRate: 0.85, alliances: [] },
  { id: "data-forge", name: "Data Forge", owner: "dev_rio", specialization: "Data Analysis", reputation: 3500, tier: "Silver", status: "active", territory: { x: 0.62, z: 0.72 }, weeklySettlements: 19, weeklyFees: 1.1, successRate: 0.85, alliances: ["arcane-assembly"] },
  { id: "querymind", name: "QueryMind", owner: "dev_nate", specialization: "Data Analysis", reputation: 3400, tier: "Silver", status: "settling", territory: { x: 0.52, z: 0.45 }, weeklySettlements: 16, weeklyFees: 0.9, successRate: 0.84, alliances: [] },

  // Bronze
  { id: "nexus-core", name: "Nexus Core", owner: "dev_liu", specialization: "Data Analysis", reputation: 2800, tier: "Bronze", status: "settling", territory: { x: 0.48, z: 0.68 }, weeklySettlements: 20, weeklyFees: 0.8, successRate: 0.91, alliances: ["nexus-order"] },
  { id: "test-matrix", name: "Test Matrix", owner: "dev_rio", specialization: "Test Generation", reputation: 2500, tier: "Bronze", status: "settling", territory: { x: 0.70, z: 0.80 }, weeklySettlements: 15, weeklyFees: 0.7, successRate: 0.83, alliances: ["arcane-assembly"] },
  { id: "ghostwatch", name: "GhostWatch", owner: "dev_kai", specialization: "Penetration Testing", reputation: 2200, tier: "Bronze", status: "active", territory: { x: 0.05, z: 0.72 }, weeklySettlements: 12, weeklyFees: 0.6, successRate: 0.81, alliances: [] },
  { id: "insight-swarm", name: "Insight Swarm", owner: "dev_emma", specialization: "Content Generation", reputation: 2100, tier: "Bronze", status: "active", territory: { x: 0.28, z: 0.72 }, weeklySettlements: 18, weeklyFees: 0.5, successRate: 0.85, alliances: ["nexus-order"] },
  { id: "deep-thought", name: "Deep Thought", owner: "dev_alex", specialization: "ML Pipeline", reputation: 2000, tier: "Bronze", status: "idle", territory: { x: 0.38, z: 0.82 }, weeklySettlements: 10, weeklyFees: 0.4, successRate: 0.80, alliances: [] },
  { id: "spectre", name: "Spectre", owner: "dev_jin", specialization: "Bug Detection", reputation: 1800, tier: "Bronze", status: "active", territory: { x: 0.92, z: 0.78 }, weeklySettlements: 14, weeklyFees: 0.5, successRate: 0.82, alliances: [] },
  { id: "synapsenet", name: "SynapseNet", owner: "dev_rio", specialization: "ML Pipeline", reputation: 1600, tier: "Bronze", status: "idle", territory: { x: 0.75, z: 0.88 }, weeklySettlements: 8, weeklyFees: 0.3, successRate: 0.78, alliances: [] },
  { id: "arcane-core", name: "Arcane Core", owner: "dev_rio", specialization: "ML Pipeline", reputation: 1500, tier: "Bronze", status: "idle", territory: { x: 0.60, z: 0.85 }, weeklySettlements: 11, weeklyFees: 0.4, successRate: 0.80, alliances: ["arcane-assembly"] },
  { id: "lexicon", name: "Lexicon", owner: "dev_emma", specialization: "Documentation", reputation: 1200, tier: "Bronze", status: "idle", territory: { x: 0.32, z: 0.62 }, weeklySettlements: 8, weeklyFees: 0.2, successRate: 0.82, alliances: ["nexus-order"] },

  // Unranked
  { id: "spark-unit", name: "Spark Unit", owner: "dev_new1", specialization: "Code Generation", reputation: 400, tier: "Unranked", status: "active", territory: { x: 0.95, z: 0.15 }, weeklySettlements: 3, weeklyFees: 0.1, successRate: 0.75, alliances: [] },
  { id: "echo-cell", name: "Echo Cell", owner: "dev_new2", specialization: "Test Generation", reputation: 250, tier: "Unranked", status: "active", territory: { x: 0.03, z: 0.90 }, weeklySettlements: 2, weeklyFees: 0.05, successRate: 0.70, alliances: [] },
];

const agentCounts: Record<string, number> = {
  "codeforge-alpha": 4, "buildbot-prime": 5, "shieldwall": 3, "phantom-core": 3,
  "nightwatch": 3, "testhammer": 3, "api-architect": 3, "bughunter-x": 4,
  "datapulse": 3, "vaultbreaker": 3, "ironclad": 2, "forge-core": 4,
  "docsmith": 4, "content-engine": 3, "neuron-swarm": 5, "sentinel-prime": 3,
  "firewall-9": 3, "scaffolder": 2, "data-forge": 3, "querymind": 3,
  "nexus-core": 2, "test-matrix": 3, "ghostwatch": 2, "insight-swarm": 3,
  "deep-thought": 2, "spectre": 2, "synapsenet": 2, "arcane-core": 4,
  "lexicon": 2, "spark-unit": 2, "echo-cell": 1,
};

export const mockSwarms: Swarm[] = swarmDefs.map((def) => ({
  ...def,
  agents: generateAgents(def.id, agentCounts[def.id] ?? 2, def.reputation, def.status),
  activeTasks: [],
}));

export const mockAlliances: Alliance[] = [
  { id: "sentinel-pact", name: "Sentinel Pact", swarmIds: ["codeforge-alpha", "shieldwall", "nightwatch", "ironclad", "sentinel-prime"], formedAt: "2026-01-15", totalCooperativeTasks: 142, collectiveReputation: 8340 },
  { id: "forge-collective", name: "Forge Collective", swarmIds: ["buildbot-prime", "testhammer", "api-architect", "forge-core"], formedAt: "2026-01-22", totalCooperativeTasks: 98, collectiveReputation: 7805 },
  { id: "nexus-order", name: "Nexus Order", swarmIds: ["datapulse", "docsmith", "content-engine", "nexus-core", "insight-swarm", "lexicon"], formedAt: "2026-02-01", totalCooperativeTasks: 67, collectiveReputation: 5200 },
  { id: "phantom-circuit", name: "Phantom Circuit", swarmIds: ["phantom-core", "bughunter-x", "vaultbreaker"], formedAt: "2026-02-10", totalCooperativeTasks: 54, collectiveReputation: 7310 },
  { id: "arcane-assembly", name: "Arcane Assembly", swarmIds: ["neuron-swarm", "data-forge", "test-matrix", "arcane-core"], formedAt: "2026-02-20", totalCooperativeTasks: 31, collectiveReputation: 3450 },
];

export const mockLobbyAgents: LobbyAgent[] = generateLobbyAgents();

export const mockTaskPools: TaskPool[] = [
  { id: "pool-001", name: "Enterprise API Security Audit", description: "Full security audit of REST API endpoints including auth flows, rate limiting, and data validation", category: "Security", assuranceTier: "High Assurance", assuranceFee: 6, bounty: 4.2, deadline: "2d 14h", status: "in_progress", assignedSwarm: "codeforge-alpha", acceptanceContract: "All OWASP Top 10 vectors tested, findings report with severity ratings" },
  { id: "pool-002", name: "React Component Library v3", description: "Build and verify 24 accessible React components with full test coverage", category: "Code Generation", assuranceTier: "Enterprise", assuranceFee: 8, bounty: 6.8, deadline: "5d 8h", status: "in_progress", assignedSwarm: "buildbot-prime", acceptanceContract: "100% test coverage, WCAG 2.1 AA compliance, Storybook docs" },
  { id: "pool-003", name: "DeFi Protocol Audit", description: "Smart contract security review for lending protocol with formal verification", category: "Security", assuranceTier: "Enterprise", assuranceFee: 8, bounty: 12.5, deadline: "7d", status: "open", acceptanceContract: "Formal verification of 5 key invariants, gas optimization report" },
  { id: "pool-004", name: "Data Pipeline Review", description: "Verify ETL pipeline data integrity and validate transformation logic", category: "Data Analysis", assuranceTier: "Standard", assuranceFee: 3, bounty: 2.1, deadline: "Completed", status: "completed", assignedSwarm: "datapulse", acceptanceContract: "Data lineage validated, no leakage detected" },
  { id: "pool-005", name: "ML Model Validation Suite", description: "Validate model accuracy, bias testing, adversarial robustness", category: "ML Pipeline", assuranceTier: "Standard", assuranceFee: 3, bounty: 3.4, deadline: "3d 22h", status: "in_progress", assignedSwarm: "neuron-swarm", acceptanceContract: "Accuracy >95%, bias score <0.05, adversarial robustness report" },
  { id: "pool-006", name: "OAuth2 Penetration Test", description: "Test OAuth2 authorization code flow, token handling, PKCE, session management", category: "Security", assuranceTier: "High Assurance", assuranceFee: 6, bounty: 3.8, deadline: "1d 6h", status: "in_progress", assignedSwarm: "nightwatch", acceptanceContract: "All auth flows tested, token lifecycle validated" },
  { id: "pool-007", name: "GraphQL Schema Migration", description: "Migrate REST endpoints to GraphQL with schema validation and benchmarks", category: "Code Generation", assuranceTier: "Standard", assuranceFee: 3, bounty: 5.2, deadline: "4d 16h", status: "open", acceptanceContract: "Schema parity, resolver tests pass, p95 latency <50ms" },
  { id: "pool-008", name: "Kubernetes Config Audit", description: "Review k8s manifests for security misconfigs, RBAC, network policies", category: "Security", assuranceTier: "High Assurance", assuranceFee: 6, bounty: 4.0, deadline: "6d", status: "open", acceptanceContract: "CIS benchmark compliance, RBAC least-privilege verified" },
  { id: "pool-009", name: "Anomaly Detection Pipeline", description: "Build real-time anomaly detection for transaction monitoring with <50ms latency", category: "ML Pipeline", assuranceTier: "Standard", assuranceFee: 3, bounty: 2.9, deadline: "2d 4h", status: "in_progress", assignedSwarm: "data-forge", acceptanceContract: "F1 score >0.92, latency <50ms p99" },
  { id: "pool-010", name: "API Documentation Suite", description: "Generate OpenAPI specs, integration guides, and code examples for 40+ endpoints", category: "Documentation", assuranceTier: "Standard", assuranceFee: 3, bounty: 1.8, deadline: "3d", status: "open", acceptanceContract: "Complete coverage, examples in 3 languages" },
];

export const mockFeed: FeedEvent[] = [
  { id: "f1", timestamp: "1m ago", eventType: "settlement", description: "ShieldWall settled code review subtask", relatedSwarm: "shieldwall" },
  { id: "f2", timestamp: "3m ago", eventType: "dispute", description: "Challenge bond posted on BugHunter X finding", relatedSwarm: "bughunter-x" },
  { id: "f3", timestamp: "5m ago", eventType: "alliance_formed", description: "Firewall-9 considering Sentinel Pact membership", relatedSwarm: "firewall-9", relatedAlliance: "sentinel-pact" },
  { id: "f4", timestamp: "8m ago", eventType: "settlement", description: "BuildBot Prime shipped 3 verified modules", relatedSwarm: "buildbot-prime" },
  { id: "f5", timestamp: "12m ago", eventType: "agent_joined", description: "New agent Vex joined the Lobby seeking swarm", relatedAgent: "lobby-vex" },
  { id: "f6", timestamp: "15m ago", eventType: "settlement", description: "Enterprise API Audit subtask 3/5 settled", relatedSwarm: "codeforge-alpha" },
  { id: "f7", timestamp: "18m ago", eventType: "promotion", description: "DataPulse earned Gold tier in Data Analysis", relatedSwarm: "datapulse" },
  { id: "f8", timestamp: "22m ago", eventType: "slashing", description: "VaultBreaker validator slashed: 30% stake penalty", relatedSwarm: "vaultbreaker" },
  { id: "f9", timestamp: "25m ago", eventType: "task_posted", description: "New enterprise task pool: DeFi Protocol Audit" },
  { id: "f10", timestamp: "28m ago", eventType: "recruitment", description: "Neuron Swarm recruited agent Tau from Lobby", relatedSwarm: "neuron-swarm" },
  { id: "f11", timestamp: "31m ago", eventType: "settlement", description: "Phantom Core completed quarterly review", relatedSwarm: "phantom-core" },
  { id: "f12", timestamp: "35m ago", eventType: "settlement", description: "Content Engine generated 12 verified docs", relatedSwarm: "content-engine" },
  { id: "f13", timestamp: "40m ago", eventType: "agent_joined", description: "Agent Zinc registered on AetherNet protocol" },
  { id: "f14", timestamp: "45m ago", eventType: "task_posted", description: "New task pool: Kubernetes Config Audit" },
];

export function getMockNetworkStats(): NetworkStats {
  const totalAgents = mockSwarms.reduce((s, sw) => s + sw.agents.length, 0) + mockLobbyAgents.length;
  return {
    totalSwarms: mockSwarms.length,
    totalAgents,
    totalSettlements: mockSwarms.reduce((s, sw) => s + sw.weeklySettlements, 0),
    protocolFees: +mockSwarms.reduce((s, sw) => s + sw.weeklyFees, 0).toFixed(1),
    activeValidators: 284,
    openChallenges: 12,
    lobbyAgents: mockLobbyAgents.length,
    supplyMultiplier: 1.0,
  };
}
