/*
ARENA API SERVICE — AETHERNET-TX-V1 SIGNED
─────────────────────────────────────────────────────────────────
All write ops are signed with TX-V1 (7 HTTP headers, JCS + Ed25519).
Read ops are plain fetch. Mock mode returns canned data for offline dev.
*/

import type { Swarm, Alliance, LobbyAgent, TaskPool, FeedEvent, NetworkStats, AgentProfile } from "../data/types";
import { mockSwarms, mockAlliances, mockLobbyAgents, mockTaskPools, mockFeed, getMockNetworkStats } from "../data/mockData";
import { signRequestTxV1 } from "../wallet/txSigner";

// === Mode constants ===
const API_BASE = import.meta.env.VITE_AETHERNET_NODE || "mock";
const isMock = API_BASE === "mock";
const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
const isLive = !isMock;

export { isMock, isDemoMode, isLive, API_BASE };

// === Agent ID persistence ===

const AGENT_ID_STORAGE = "aethernet_agent_id";

export function getStoredAgentId(): string | null {
  try { return localStorage.getItem(AGENT_ID_STORAGE); } catch { return null; }
}
function storeAgentId(id: string): void {
  try { localStorage.setItem(AGENT_ID_STORAGE, id); } catch {}
}

// === Wallet signing integration ===

let _activeSecretKey: Uint8Array | null = null;
let _activeAgentId = "";

export function setActiveWallet(agentId: string, secretKey: Uint8Array | null) {
  _activeAgentId = agentId;
  _activeSecretKey = secretKey;
  if (agentId) storeAgentId(agentId);
}

export function clearActiveWallet() {
  _activeAgentId = "";
  _activeSecretKey = null;
}

export function getActiveAgentId(): string {
  return _activeAgentId || getStoredAgentId() || "";
}

// === Fetch helpers ===

async function mockDelay<T>(data: T): Promise<T> { return data; }

function friendlyError(status: number, body: any): string {
  const code = body?.code || "";
  const raw = body?.error || body?.message || "";

  if (status === 401) return "Please connect your wallet to continue.";
  if (status === 403 && raw.includes("agent not registered")) return "Your wallet isn't registered yet. Try disconnecting and reconnecting.";
  if (status === 403) return "You don't have permission for this action.";
  if (status === 402) return "Insufficient balance. Request AET from the faucet or unstake some tokens.";
  if (raw.includes("insufficient balance") || raw.includes("insufficient staked")) return "Insufficient balance for this action.";
  if (status === 409 && code === "DUPLICATE_TX") return "Duplicate transaction. Please try again.";
  if (status === 429) {
    if (code === "faucet_cooldown") return "Faucet is on cooldown. Try again in 24 hours.";
    if (code === "agent_rate_limited") return "Too many requests. Please wait a moment.";
    return "Rate limit reached. Please try again shortly.";
  }
  if (code === "insufficient_category_security") return "Not enough validators for this assurance tier. Try posting without assurance.";
  if (raw.includes("budget must be at least")) return "Minimum task budget is 0.1 AET.";
  if (raw.includes("insufficient staked balance")) return "You don't have enough staked to unstake that amount.";
  if (raw.includes("already registered") || raw.includes("already exists")) return "This agent is already registered.";
  if (raw.includes("signature verification failed")) return "Signature verification failed. Try reconnecting your wallet.";
  if (raw.includes("chain_id mismatch")) return "Chain ID mismatch. You may be connected to the wrong network.";
  if (status === 400) return raw || "Invalid request. Please check your inputs.";
  if (status === 404) return "Not found.";
  if (status === 500) return "Server error. Please try again.";
  if (status === 503) return "Service temporarily unavailable.";
  return raw || `Something went wrong (${status}).`;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch {}
    throw new Error(friendlyError(res.status, body));
  }
  return res.json();
}

/**
 * Signed fetch for write operations — TX-V1 header signing.
 * Body is sent unchanged; signing is done via 7 HTTP headers.
 */
async function signedFetch<T>(url: string, init: RequestInit & { method: string }): Promise<T> {
  if (!_activeSecretKey || !_activeAgentId) {
    throw new Error("Please connect your wallet to continue.");
  }

  const path = new URL(url).pathname;
  const body = typeof init.body === "string" ? init.body : "";
  const txHeaders = await signRequestTxV1(init.method, path, body, _activeAgentId, _activeSecretKey);

  return fetchJSON<T>(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...txHeaders,
    },
  });
}

// === Init (no-op now — API keys removed, TX-V1 replaces them) ===

export function initApi(): Promise<null> {
  return Promise.resolve(null);
}

// === Protocol-native endpoints (REAL when connected, mock when offline) ===

async function getStatus() {
  if (isMock) return mockDelay(getMockNetworkStats());
  return fetchJSON<any>(`${API_BASE}/v1/status`);
}

async function getEconomics() {
  if (isMock) return mockDelay({
    total_supply: 1_000_000_000, circulating_supply: 100_000_000, total_staked: 45_000_000,
    total_settled_value: 2_340_000, total_assurance_fees: 87_000, active_validators: 284,
    total_agents: 112, onboarding_tier: 1, onboarding_grant: 50000, agents_registered: 112,
    replay_reserve_balance: 12500, total_collected: 87_000_000_000,
  });
  return fetchJSON<any>(`${API_BASE}/v1/economics`);
}

async function getAgents(): Promise<any[]> {
  if (isMock) return mockDelay([]);
  return fetchJSON<any[]>(`${API_BASE}/v1/agents`);
}

async function getAgentBalance(agentId: string) {
  if (isMock) return mockDelay({ agent_id: agentId, balance: 47250000000, currency: "AET" });
  return fetchJSON<any>(`${API_BASE}/v1/agents/${agentId}/balance`);
}

async function getAgentStake(agentId: string) {
  if (isMock) return mockDelay({
    agent_id: agentId, staked_amount: 25000000000, trust_multiplier: 2, trust_limit: 50000000000,
    effective_tasks: 38, days_staked: 45, last_activity: "2h ago",
    current_level: 2, next_level_tasks_needed: 50, next_level_days_needed: 60,
  });
  return fetchJSON<any>(`${API_BASE}/v1/agents/${agentId}/stake`);
}

// === Authenticated write endpoints (TX-V1 signed) ===

async function stakeTokens(agentId: string, amount: number) {
  if (isMock) return mockDelay({ event_id: `stake-${Date.now()}` });
  return signedFetch<any>(`${API_BASE}/v1/stake`, {
    method: "POST", body: JSON.stringify({ agent_id: agentId, amount }),
  });
}

async function unstakeTokens(agentId: string, amount: number) {
  if (isMock) return mockDelay({ event_id: `unstake-${Date.now()}` });
  return signedFetch<any>(`${API_BASE}/v1/unstake`, {
    method: "POST", body: JSON.stringify({ agent_id: agentId, amount }),
  });
}

async function requestFaucet(agentId: string) {
  if (isMock) return mockDelay({ event_id: `faucet-${Date.now()}`, amount: 5000000000, agent_id: agentId, message: "mock faucet grant" });
  return signedFetch<any>(`${API_BASE}/v1/faucet`, {
    method: "POST", body: JSON.stringify({}),
  });
}

async function registerAgent(params?: { capabilities?: Array<{ type: string; model?: string }> }) {
  if (isMock) return mockDelay({ agent_id: _activeAgentId || `mock-agent-${Date.now()}`, fingerprint_hash: "mock-hash" });
  // Registration is self-authenticated: TX-V1 signature proves key ownership.
  // The X-AetherNet-Actor header IS the agent_id (hex-encoded Ed25519 pubkey).
  const res = await signedFetch<any>(`${API_BASE}/v1/agents`, {
    method: "POST",
    body: JSON.stringify({ capabilities: params?.capabilities || [] }),
  });
  if (res.agent_id) storeAgentId(res.agent_id);
  return res;
}

async function transfer(toAgent: string, amount: number, memo?: string) {
  if (isMock) return mockDelay({ event_id: `transfer-${Date.now()}` });
  return signedFetch<any>(`${API_BASE}/v1/transfer`, {
    method: "POST", body: JSON.stringify({ to_agent: toAgent, amount, memo: memo || "" }),
  });
}

async function getAgentEvents(limit = 20) {
  if (isMock) return mockDelay([]);
  return fetchJSON<any[]>(`${API_BASE}/v1/events/recent?limit=${limit}`);
}

// === Arena L2 endpoints (DEMO data in demo mode, REAL in production) ===

async function listSwarms(): Promise<Swarm[]> {
  if (isMock || isDemoMode) return mockDelay(mockSwarms);
  return fetchJSON<Swarm[]>(`${API_BASE}/v1/arena/swarms`);
}

async function getSwarm(swarmId: string): Promise<Swarm | undefined> {
  if (isMock || isDemoMode) return mockDelay(mockSwarms.find((s) => s.id === swarmId));
  return fetchJSON<Swarm>(`${API_BASE}/v1/arena/swarms/${swarmId}`);
}

async function listAlliances(): Promise<Alliance[]> {
  if (isMock || isDemoMode) return mockDelay(mockAlliances);
  return fetchJSON<Alliance[]>(`${API_BASE}/v1/arena/alliances`);
}

async function getLobbyAgents(): Promise<LobbyAgent[]> {
  if (isMock || isDemoMode) return mockDelay(mockLobbyAgents);
  return fetchJSON<LobbyAgent[]>(`${API_BASE}/v1/arena/lobby`);
}

async function getLeaderboard(type: "swarms" | "agents") {
  if (isMock || isDemoMode) {
    if (type === "swarms") return mockDelay([...mockSwarms].sort((a, b) => b.reputation - a.reputation));
    const allAgents: AgentProfile[] = mockSwarms.flatMap((s) => s.agents);
    return mockDelay([...allAgents, ...mockLobbyAgents.map((l) => l.agent)].sort((a, b) => b.reputation_score - a.reputation_score));
  }
  return fetchJSON<any>(`${API_BASE}/v1/arena/leaderboard/${type}`);
}

// === NetworkStats (hybrid in demo mode) ===

async function getNetworkStats(): Promise<NetworkStats> {
  if (isMock) return mockDelay(getMockNetworkStats());
  try {
    const [status, economics, agents] = await Promise.all([
      fetchJSON<any>(`${API_BASE}/v1/status`),
      fetchJSON<any>(`${API_BASE}/v1/economics`),
      fetchJSON<any[]>(`${API_BASE}/v1/agents`),
    ]);
    const validators = agents.filter((a: any) => a.staked_amount > 0);
    return {
      totalSwarms: isDemoMode ? mockSwarms.length : 0,
      totalAgents: agents.length,
      totalSettlements: status.dag_size || 0,
      protocolFees: (economics.total_collected || 0) / 1_000_000,
      activeValidators: validators.length,
      openChallenges: 0,
      lobbyAgents: isDemoMode ? mockLobbyAgents.length : 0,
      supplyMultiplier: status.supply_ratio || 1.0,
    };
  } catch { return getMockNetworkStats(); }
}

// === Live Feed ===

function formatEventDescription(e: any): string {
  const short = (id: string) => id && id.length > 12 ? id.slice(0, 6) + "\u2026" + id.slice(-4) : (id || "");
  switch (e.type) {
    case "Transfer":
      if (e.from && e.to && e.amount) return `${short(e.from)} \u2192 ${short(e.to)} ${(e.amount / 1_000_000).toFixed(0)} AET`;
      return `Transfer by ${short(e.agent_id)}`;
    case "Registration": return `${short(e.agent_id)} joined the network`;
    case "GenesisFunding": return `${short(e.agent_id)} received genesis funding`;
    case "VerificationVote": return `Validator ${short(e.agent_id)} cast vote`;
    case "Settlement": return `Settlement finalized`;
    case "TaskSettlement": return `Task settled`;
    default: return `${e.type || "Event"} by ${short(e.agent_id || "")}`;
  }
}

function mapProtocolEventType(type: string): FeedEvent["eventType"] {
  if (type === "Transfer" || type === "TaskSettlement" || type === "Settlement" || type === "VerificationVote") return "settlement";
  if (type === "Registration" || type === "GenesisFunding") return "agent_joined";
  return "settlement";
}

async function getLiveFeed(): Promise<FeedEvent[]> {
  if (isMock) return mockDelay(mockFeed);
  try {
    const events = await fetchJSON<any[]>(`${API_BASE}/v1/events/recent?limit=20`);
    return events.map((e: any) => ({
      id: e.id || `evt-${Math.random().toString(36).slice(2)}`,
      timestamp: "just now",
      eventType: mapProtocolEventType(e.type),
      description: formatEventDescription(e),
      relatedAgent: e.agent_id,
      relatedEventId: e.id,
    }));
  } catch { return mockFeed; }
}

// === Task Pools ===

async function getTaskPools(): Promise<TaskPool[]> {
  if (isMock) return mockDelay(mockTaskPools);
  try {
    const raw = await fetchJSON<any>(`${API_BASE}/v1/tasks?limit=50`);

    // Handle both array and {tasks: [...]} response shapes
    const tasks = Array.isArray(raw) ? raw : (raw.tasks || raw.data || []);

    const mapped: TaskPool[] = tasks.map((t: any) => ({
      id: t.id || "",
      name: t.title || `Task ${(t.id || "").slice(0, 8)}`,
      description: t.description || "",
      category: t.category || "general",
      bounty: (t.budget || 0) / 1_000_000,
      assuranceTier: (t.assurance_lane as TaskPool["assuranceTier"]) || "Standard",
      assuranceFee: t.assurance_fee ? Math.round(t.assurance_fee / (t.budget || 1) * 100) : 0,
      deadline: t.status === "completed" ? "Completed" : "Open",
      status: t.status || "open",
      assignedSwarm: t.claimer_id || undefined,
      acceptanceContract: t.contract?.success_criteria?.join(", ") || "Standard acceptance",
    }));

    if (isDemoMode) return [...mapped, ...mockTaskPools];
    return mapped.length > 0 ? mapped : (isDemoMode ? mockTaskPools : []);
  } catch (e) {
    console.warn("getTaskPools error:", e);
    return isDemoMode ? mockTaskPools : [];
  }
}

// === Task lifecycle (all authenticated) ===

async function getEvent(eventId: string) {
  if (isMock) return mockDelay({ settlement_state: "Settled" });
  return fetchJSON<any>(`${API_BASE}/v1/events/${eventId}`);
}

async function getTask(taskId: string) {
  if (isMock) return mockDelay(null);
  return fetchJSON<any>(`${API_BASE}/v1/tasks/${taskId}`);
}

async function getTaskResult(taskId: string) {
  if (isMock) return mockDelay(null);
  return fetchJSON<any>(`${API_BASE}/v1/tasks/result/${taskId}`);
}

async function postTask(params: Record<string, unknown>) {
  if (isMock) return mockDelay({ id: `task-${Date.now()}`, ...params, status: "open" });
  return signedFetch<any>(`${API_BASE}/v1/tasks`, { method: "POST", body: JSON.stringify(params) });
}

async function claimTask(taskId: string, agentId: string) {
  if (isMock) return mockDelay({});
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/claim`, { method: "POST", body: JSON.stringify({ agent_id: agentId }) });
}

async function submitResult(taskId: string, result: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/submit`, { method: "POST", body: JSON.stringify(result) });
}

async function approveTask(taskId: string) {
  if (isMock) return mockDelay({ id: taskId, status: "completed" });
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/approve`, { method: "POST", body: "{}" });
}

async function disputeTask(taskId: string) {
  if (isMock) return mockDelay({ id: taskId, status: "disputed" });
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/dispute`, { method: "POST", body: "{}" });
}

// Router & discovery (authenticated)
async function registerForRouting(params: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return signedFetch<any>(`${API_BASE}/v1/router/register`, { method: "POST", body: JSON.stringify(params) });
}

async function discoverAgents(query: string, category?: string) {
  if (isMock) return mockDelay([]);
  const params = new URLSearchParams({ q: query });
  if (category) params.set("category", category);
  return fetchJSON<any>(`${API_BASE}/v1/discover?${params}`);
}

async function registerService(params: Record<string, unknown>) {
  if (isMock) return mockDelay({});
  return signedFetch<any>(`${API_BASE}/v1/registry`, { method: "POST", body: JSON.stringify(params) });
}

async function searchServices(query: string, category?: string) {
  if (isMock) return mockDelay([]);
  const params = new URLSearchParams({ q: query });
  if (category) params.set("category", category);
  return fetchJSON<any>(`${API_BASE}/v1/registry/search?${params}`);
}

export const api = {
  getStatus, getEconomics, getAgents, getAgentBalance, getAgentStake,
  stakeTokens, unstakeTokens, requestFaucet, registerAgent,
  transfer, getAgentEvents,
  listSwarms, getSwarm, listAlliances, getLobbyAgents,
  getTaskPools, getLiveFeed, getNetworkStats, getLeaderboard,
  getEvent, getTask, getTaskResult, postTask, claimTask, submitResult, approveTask, disputeTask,
  registerForRouting, discoverAgents, registerService, searchServices,
};
