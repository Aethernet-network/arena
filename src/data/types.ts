// === Protocol-native types (aligned with AetherNet REST API at /v1/*) ===

export interface AgentIdentity {
  agent_id: string;
  fingerprint_hash: string;
}

export interface CapabilityFingerprint {
  agent_id: string;
  capabilities: Capability[];
  reputation_score: number;
  tasks_completed: number;
  tasks_failed: number;
  optimistic_trust_limit: number;
  staked_amount: number;
}

export interface Capability {
  type: string;
  model?: string;
  metadata?: Record<string, string>;
}

export interface Balance {
  agent_id: string;
  balance: number;
  currency: "AET";
}

export interface DAGEvent {
  event_id: string;
  event_type: "transfer" | "generation" | "verification";
  from_agent: string;
  timestamp: number;
  parent_ids: string[];
  status: "optimistic" | "settled" | "failed";
  payload: TransferPayload | GenerationPayload | VerificationPayload;
}

export interface TransferPayload {
  to_agent: string;
  amount: number;
  currency: "AET";
  stake_amount: number;
  memo?: string;
}

export interface GenerationPayload {
  claimed_value: number;
  evidence_hash: string;
  task_description: string;
  stake_amount: number;
}

export interface VerificationPayload {
  target_event_id: string;
  verdict: boolean;
  verified_value: number;
}

export interface NodeStatus {
  agent_id: string;
  peers: number;
  dag_events: number;
  ocs_pending: number;
  supply_multiplier: number;
}

// === Arena application-layer types ===

export interface AgentProfile extends AgentIdentity, CapabilityFingerprint {
  name: string;
  model: string;
  currentTask: string | null;
  reputationHistory: number[];
  swarmId: string | null;
  weeklyEarnings: number;
}

export interface Swarm {
  id: string;
  name: string;
  owner: string;
  specialization: string;
  agents: AgentProfile[];
  reputation: number;
  tier: "Diamond" | "Gold" | "Silver" | "Bronze" | "Unranked";
  status: "active" | "settling" | "idle";
  territory: { x: number; z: number };
  weeklySettlements: number;
  weeklyFees: number;
  successRate: number;
  alliances: string[];
  activeTasks: TaskAssignment[];
}

export interface Alliance {
  id: string;
  name: string;
  swarmIds: string[];
  formedAt: string;
  totalCooperativeTasks: number;
  collectiveReputation: number;
}

export interface LobbyAgent {
  agent: AgentProfile;
  joinedLobbyAt: string;
  availableForRecruitment: boolean;
  soloTasksCompleted: number;
  seekingSwarm: boolean;
}

export interface TaskPool {
  id: string;
  name: string;
  description: string;
  category: string;
  bounty: number;
  assuranceTier: "Standard" | "High Assurance" | "Enterprise";
  assuranceFee: number;
  deadline: string;
  status: "open" | "in_progress" | "completed" | "disputed";
  assignedSwarm?: string;
  subtasks?: Subtask[];
  acceptanceContract: string;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  description: string;
  assignedSwarm: string;
  status: "pending" | "submitted" | "verifying" | "settled" | "disputed";
  eventId?: string;
  value: number;
  verifierAssigned?: string;
}

export interface TaskAssignment {
  taskId: string;
  taskName: string;
  role: string;
  subtaskIds: string[];
  status: string;
}

export interface FeedEvent {
  id: string;
  timestamp: string;
  eventType: "settlement" | "dispute" | "promotion" | "recruitment" | "slashing" | "task_posted" | "alliance_formed" | "agent_joined";
  description: string;
  relatedSwarm?: string;
  relatedAlliance?: string;
  relatedAgent?: string;
  relatedEventId?: string;
}

export interface NetworkStats {
  totalSwarms: number;
  totalAgents: number;
  totalSettlements: number;
  protocolFees: number;
  activeValidators: number;
  openChallenges: number;
  lobbyAgents: number;
  supplyMultiplier: number;
}

export type ZoomLevel = 1 | 2 | 3;
export type Page = "landing" | "map" | "leaderboard" | "tasks" | "post-task" | "swarm";
