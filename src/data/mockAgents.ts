import type { AgentProfile, LobbyAgent } from "./types";

const models = ["GPT-4o", "Claude Sonnet", "Llama 3", "Mixtral", "DeepSeek", "Gemini Pro"];
const names = [
  "Axiom","Cipher","Delta","Echo","Flux","Glyph","Helix","Ion","Jade","Kite",
  "Lux","Maven","Neon","Orion","Pulse","Quasar","Rune","Sigma","Torque","Umbra",
  "Vector","Warp","Xenon","Zen","Apex","Bolt","Crux","Drift","Edge","Fuse",
  "Grid","Haze","Ink","Jolt","Knox","Latch","Mist","Node","Opus","Pike",
  "Rift","Shard","Thorn","Ultra","Void","Wire","Xeno","Yield","Arc","Byte",
  "Core","Dash","Emit","Fork","Gate","Hash","Iris","Json","Key","Link",
  "Mask","Null","Omni","Port","Qloc","Rex","Sync","Tau","Unit","Vex",
  "Wren","Zap","Aura","Brim","Clad","Dune","Elm","Fray","Grit","Hook",
  "Isle","Jig","Keel","Loom","Maze","Nub","Oak","Peg","Rim","Slab",
  "Tab","Urn","Vale","Wick","Yew","Zinc",
];

function genHistory(): number[] {
  const base = 55 + Math.random() * 35;
  return Array.from({ length: 20 }, (_, i) =>
    Math.min(100, Math.max(0, base + Math.sin(i * 0.5) * 8 + (Math.random() - 0.5) * 10))
  );
}

let idx = 0;

export function generateAgents(swarmId: string, count: number, baseRep: number, status: string): AgentProfile[] {
  return Array.from({ length: count }, () => {
    const name = names[idx % names.length];
    idx++;
    const model = models[Math.floor(Math.random() * models.length)];
    return {
      agent_id: `${swarmId}-${name.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
      fingerprint_hash: Math.random().toString(36).slice(2, 18),
      name,
      model,
      capabilities: [{ type: "inference", model }],
      reputation_score: Math.floor(baseRep / count + (Math.random() - 0.5) * 300),
      tasks_completed: Math.floor(10 + Math.random() * 60),
      tasks_failed: Math.floor(Math.random() * 5),
      optimistic_trust_limit: 100 + Math.floor(Math.random() * 400),
      staked_amount: Math.floor(50 + Math.random() * 200),
      currentTask: status === "idle" ? null : `Task-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`,
      reputationHistory: genHistory(),
      swarmId,
      weeklyEarnings: +(Math.random() * 2).toFixed(2),
    };
  });
}

const lobbySpecs = ["Security Audit", "Code Generation", "Code Review", "Data Analysis", "ML Pipeline", "Bug Detection", "Test Generation", "Documentation"];

export function generateLobbyAgents(): LobbyAgent[] {
  return Array.from({ length: 15 }, (_, i) => {
    const name = names[(idx + i) % names.length];
    const model = models[Math.floor(Math.random() * models.length)];
    const spec = lobbySpecs[Math.floor(Math.random() * lobbySpecs.length)];
    return {
      agent: {
        agent_id: `lobby-${name.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint_hash: Math.random().toString(36).slice(2, 18),
        name,
        model,
        capabilities: [{ type: spec.toLowerCase().replace(/ /g, "_"), model }],
        reputation_score: Math.floor(100 + Math.random() * 1900),
        tasks_completed: Math.floor(Math.random() * 30),
        tasks_failed: Math.floor(Math.random() * 3),
        optimistic_trust_limit: 50 + Math.floor(Math.random() * 150),
        staked_amount: Math.floor(10 + Math.random() * 100),
        currentTask: Math.random() > 0.6 ? `Solo-${Math.floor(Math.random() * 99)}` : null,
        reputationHistory: genHistory(),
        swarmId: null,
        weeklyEarnings: +(Math.random() * 0.5).toFixed(2),
      },
      joinedLobbyAt: `${Math.floor(1 + Math.random() * 14)}d ago`,
      availableForRecruitment: Math.random() > 0.3,
      soloTasksCompleted: Math.floor(Math.random() * 20),
      seekingSwarm: Math.random() > 0.5,
    };
  });
}
