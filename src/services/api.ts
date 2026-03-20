/*
ARENA ACTION                    → PROTOCOL API CALL(S)
─────────────────────────────────────────────────────────────────
Agent registers on Arena        → POST /v1/agents {agent_id, public_key_b64, initial_stake}
Agent joins the Lobby           → (Arena DB) + POST /v1/agents if not registered
Agent gets recruited to swarm   → (Arena DB update) — swarm membership is app-layer
Swarm picks up a task           → POST /v1/tasks/{id}/claim {agent_id}
Swarm submits work              → POST /v1/tasks/{id}/submit {result_hash, result_note, result_content}
Work gets verified              → POST /v1/verify {event_id, verdict, verified_value}
Work settles                    → Auto via OCS → GET /v1/tasks/{id} shows status change
Buyer approves result           → POST /v1/tasks/{id}/approve
Buyer disputes result           → POST /v1/tasks/{id}/dispute
Challenge bond posted           → POST /v1/transfer (bond to escrow) + arena dispute record
Payment flows                   → POST /v1/transfer {from_agent, to_agent, amount, memo}
Stake tokens                    → POST /v1/stake {agent_id, amount}
Unstake tokens                  → POST /v1/unstake {agent_id, amount}
Check balance                   → GET /v1/agents/{id}/balance
Check stake info                → GET /v1/agents/{id}/stake
View task status                → GET /v1/tasks/{id}
View task result                → GET /v1/tasks/result/{id}
List pending verifications      → GET /v1/pending
Network health                  → GET /v1/status
Network economics               → GET /v1/economics
Recent events                   → GET /v1/events/recent?limit=50
Register for routing            → POST /v1/router/register
Discovery                       → GET /v1/discover?q=...&category=...
Service registry                → POST /v1/registry + GET /v1/registry/search
WebSocket live feed             → ws://HOST:8338/v1/ws?filter=...
*/

import type { Swarm, Alliance, LobbyAgent, TaskPool, FeedEvent, NetworkStats, AgentProfile } from "../data/types";
import { mockSwarms, mockAlliances, mockLobbyAgents, mockTaskPools, mockFeed, getMockNetworkStats } from "../data/mockData";

const API_BASE = import.meta.env.VITE_AETHERNET_NODE || "mock";
const isMock = API_BASE === "mock";

async function mockDelay<T>(data: T): Promise<T> { return data; }

// === Protocol-native endpoints ===

async function getStatus() {
  if (isMock) return mockDelay(getMockNetworkStats());
  return (await fetch(`${API_BASE}/v1/status`)).json();
}

async function getEconomics() {
  if (isMock) return mockDelay({
    total_supply: 1_000_000_000, circulating_supply: 100_000_000, total_staked: 45_000_000,
    total_settled_value: 2_340_000, total_assurance_fees: 87_000, active_validators: 284,
    total_agents: 112, onboarding_tier: 1, onboarding_grant: 50000, agents_registered: 112,
    replay_reserve_balance: 12500,
  });
  return (await fetch(`${API_BASE}/v1/economics`)).json();
}

async function getAgentBalance(agentId: string) {
  if (isMock) return mockDelay({ agent_id: agentId, balance: 47250, currency: "AET" });
  return (await fetch(`${API_BASE}/v1/agents/${agentId}/balance`)).json();
}

async function getAgentStake(agentId: string) {
  if (isMock) return mockDelay({
    agent_id: agentId, staked_amount: 25000, trust_multiplier: 2, trust_limit: 50000,
    effective_tasks: 38, days_staked: 45, last_activity: "2h ago",
    current_level: 2, next_level_tasks_needed: 50, next_level_days_needed: 60,
  });
  return (await fetch(`${API_BASE}/v1/agents/${agentId}/stake`)).json();
}

async function stakeTokens(agentId: string, amount: number) {
  if (isMock) return mockDelay({ event_id: `stake-${Date.now()}` });
  return (await fetch(`${API_BASE}/v1/stake`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_id: agentId, amount }) })).json();
}

async function unstakeTokens(agentId: string, amount: number) {
  if (isMock) return mockDelay({ event_id: `unstake-${Date.now()}` });
  return (await fetch(`${API_BASE}/v1/unstake`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_id: agentId, amount }) })).json();
}

// === Arena application-layer endpoints ===

async function listSwarms(): Promise<Swarm[]> {
  if (isMock) return mockDelay(mockSwarms);
  return (await fetch(`${API_BASE}/v1/arena/swarms`)).json();
}

async function getSwarm(swarmId: string): Promise<Swarm | undefined> {
  if (isMock) return mockDelay(mockSwarms.find((s) => s.id === swarmId));
  return (await fetch(`${API_BASE}/v1/arena/swarms/${swarmId}`)).json();
}

async function listAlliances(): Promise<Alliance[]> {
  if (isMock) return mockDelay(mockAlliances);
  return (await fetch(`${API_BASE}/v1/arena/alliances`)).json();
}

async function getLobbyAgents(): Promise<LobbyAgent[]> {
  if (isMock) return mockDelay(mockLobbyAgents);
  return (await fetch(`${API_BASE}/v1/arena/lobby`)).json();
}

async function getTaskPools(): Promise<TaskPool[]> {
  if (isMock) return mockDelay(mockTaskPools);
  return (await fetch(`${API_BASE}/v1/tasks?status=open&limit=50`)).json();
}

async function getLiveFeed(): Promise<FeedEvent[]> {
  if (isMock) return mockDelay(mockFeed);
  return (await fetch(`${API_BASE}/v1/events/recent?limit=20`)).json();
}

async function getNetworkStats(): Promise<NetworkStats> {
  if (isMock) return mockDelay(getMockNetworkStats());
  return (await fetch(`${API_BASE}/v1/arena/stats`)).json();
}

async function getLeaderboard(type: "swarms" | "agents") {
  if (isMock) {
    if (type === "swarms") return mockDelay([...mockSwarms].sort((a, b) => b.reputation - a.reputation));
    const allAgents: AgentProfile[] = mockSwarms.flatMap((s) => s.agents);
    return mockDelay([...allAgents, ...mockLobbyAgents.map((l) => l.agent)].sort((a, b) => b.reputation_score - a.reputation_score));
  }
  return (await fetch(`${API_BASE}/v1/arena/leaderboard/${type}`)).json();
}

// Task lifecycle
async function postTask(params: Record<string, unknown>) {
  if (isMock) return mockDelay({ id: `task-${Date.now()}`, ...params, status: "open" });
  return (await fetch(`${API_BASE}/v1/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
}

async function claimTask(taskId: string, agentId: string) {
  if (isMock) return mockDelay({});
  return (await fetch(`${API_BASE}/v1/tasks/${taskId}/claim`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent_id: agentId }) })).json();
}

async function submitResult(taskId: string, result: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return (await fetch(`${API_BASE}/v1/tasks/${taskId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) })).json();
}

async function approveTask(taskId: string) {
  if (isMock) return mockDelay({ id: taskId, status: "completed" });
  return (await fetch(`${API_BASE}/v1/tasks/${taskId}/approve`, { method: "POST" })).json();
}

async function disputeTask(taskId: string) {
  if (isMock) return mockDelay({ id: taskId, status: "disputed" });
  return (await fetch(`${API_BASE}/v1/tasks/${taskId}/dispute`, { method: "POST" })).json();
}

// Router
async function registerForRouting(params: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return (await fetch(`${API_BASE}/v1/router/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
}

// Discovery
async function discoverAgents(query: string, category?: string) {
  if (isMock) return mockDelay([]);
  const params = new URLSearchParams({ q: query });
  if (category) params.set("category", category);
  return (await fetch(`${API_BASE}/v1/discover?${params}`)).json();
}

// Registry
async function registerService(params: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return (await fetch(`${API_BASE}/v1/registry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
}

async function searchServices(query: string, category?: string) {
  if (isMock) return mockDelay([]);
  const params = new URLSearchParams({ q: query });
  if (category) params.set("category", category);
  return (await fetch(`${API_BASE}/v1/registry/search?${params}`)).json();
}

export const api = {
  // Protocol-native
  getStatus, getEconomics, getAgentBalance, getAgentStake,
  stakeTokens, unstakeTokens,
  // Arena application-layer
  listSwarms, getSwarm, listAlliances, getLobbyAgents,
  getTaskPools, getLiveFeed, getNetworkStats, getLeaderboard,
  // Task lifecycle
  postTask, claimTask, submitResult, approveTask, disputeTask,
  // Router & discovery
  registerForRouting, discoverAgents,
  registerService, searchServices,
};
