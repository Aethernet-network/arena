/*
ARENA ACTION                    → PROTOCOL API CALL(S)
─────────────────────────────────────────────────────────────────
All write ops include X-API-Key header for ALB node-agnostic auth.
API key auto-generated via POST /v1/platform/keys on first use.
Stored in localStorage for persistence across sessions.
*/

import type { Swarm, Alliance, LobbyAgent, TaskPool, FeedEvent, NetworkStats, AgentProfile } from "../data/types";
import { mockSwarms, mockAlliances, mockLobbyAgents, mockTaskPools, mockFeed, getMockNetworkStats } from "../data/mockData";

// === Mode constants ===
const API_BASE = import.meta.env.VITE_AETHERNET_NODE || "mock";
const isMock = API_BASE === "mock";
const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
const isLive = !isMock;

export { isMock, isDemoMode, isLive, API_BASE };

// === API Key + Agent ID persistence ===

const ENV_API_KEY = import.meta.env.VITE_AETHERNET_API_KEY || "";
const API_KEY_STORAGE = "aethernet_api_key";
const AGENT_ID_STORAGE = "aethernet_agent_id";

function getApiKey(): string | null {
  if (ENV_API_KEY) return ENV_API_KEY;
  try { return localStorage.getItem(API_KEY_STORAGE); } catch { return null; }
}

function storeApiKey(key: string): void {
  try { localStorage.setItem(API_KEY_STORAGE, key); } catch {}
}
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
  if (status === 429) {
    if (code === "faucet_cooldown") return "Faucet is on cooldown. Try again in 24 hours.";
    if (code === "agent_rate_limited") return "Too many requests. Please wait a moment.";
    return "Rate limit reached. Please try again shortly.";
  }
  if (code === "insufficient_category_security") return "Not enough validators for this assurance tier. Try posting without assurance.";
  if (raw.includes("budget must be at least")) return "Minimum task budget is 0.1 AET.";
  if (raw.includes("insufficient staked balance")) return "You don't have enough staked to unstake that amount.";
  if (raw.includes("already registered") || raw.includes("already exists")) return "This agent is already registered.";
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

function authHeaders(): Record<string, string> {
  const key = getApiKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["X-API-Key"] = key;
  return headers;
}

// Signed fetch — uses Ed25519 wallet signing when connected, falls back to API key
async function signedFetch<T>(url: string, init: RequestInit & { method: string }): Promise<T> {
  if (_activeSecretKey && _activeAgentId) {
    const { signRequest } = await import("../wallet/signer");
    const path = new URL(url).pathname;
    const body = typeof init.body === "string" ? init.body : "";
    const sigHeaders = await signRequest(init.method, path, body, _activeAgentId, _activeSecretKey);
    const headers = { ...(init.headers as Record<string, string>), ...sigHeaders, "Content-Type": "application/json" };
    return fetchJSON<T>(url, { ...init, headers });
  }
  // No wallet — fall back to API key auth
  return fetchJSON<T>(url, { ...init, headers: authHeaders() });
}

// === API Key initialization ===

async function ensureApiKey(): Promise<string | null> {
  if (isMock) return null;
  if (ENV_API_KEY) return ENV_API_KEY;
  const stored = getApiKey();
  if (stored) return stored;

  try {
    const res = await fetchJSON<any>(`${API_BASE}/v1/platform/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "arena-user", email: "arena@aethernet.network", tier: "free" }),
    });
    if (res.key) { storeApiKey(res.key); return res.key; }
  } catch (err) {
    console.warn("Failed to generate API key:", err);
  }
  return null;
}

let _apiKeyPromise: Promise<string | null> | null = null;
export function initApi(): Promise<string | null> {
  if (!_apiKeyPromise) _apiKeyPromise = ensureApiKey();
  return _apiKeyPromise;
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

// === Authenticated write endpoints (wallet signing → API key fallback) ===

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
    method: "POST", body: JSON.stringify({ agent_id: agentId }),
  });
}

async function registerAgent(params?: { agent_id?: string; public_key_b64?: string }) {
  if (isMock) return mockDelay({ agent_id: `mock-agent-${Date.now()}`, fingerprint_hash: "mock-hash" });
  // Registration uses API key auth (no wallet exists yet)
  const res = await fetchJSON<any>(`${API_BASE}/v1/agents`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify(params || {}),
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
  const short = (id: string) => id && id.length > 12 ? id.slice(0, 6) + "…" + id.slice(-4) : (id || "");
  switch (e.type) {
    case "Transfer":
      if (e.from && e.to && e.amount) return `${short(e.from)} → ${short(e.to)} ${(e.amount / 1_000_000).toFixed(0)} AET`;
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
    console.log("raw tasks response:", raw);

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
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/approve`, { method: "POST", body: "" });
}

async function disputeTask(taskId: string) {
  if (isMock) return mockDelay({ id: taskId, status: "disputed" });
  return signedFetch<any>(`${API_BASE}/v1/tasks/${taskId}/dispute`, { method: "POST", body: "" });
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
