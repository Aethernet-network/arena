import { useState, useEffect } from "react";
import { api } from "../services/api";
import type { Swarm, Alliance, LobbyAgent, TaskPool, FeedEvent, NetworkStats } from "../data/types";

export function useSwarms() {
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  useEffect(() => { api.listSwarms().then(setSwarms); }, []);
  return swarms;
}

export function useAlliances() {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  useEffect(() => { api.listAlliances().then(setAlliances); }, []);
  return alliances;
}

export function useLobbyAgents() {
  const [agents, setAgents] = useState<LobbyAgent[]>([]);
  useEffect(() => { api.getLobbyAgents().then(setAgents); }, []);
  return agents;
}

export function useTaskPools() {
  const [pools, setPools] = useState<TaskPool[]>([]);
  useEffect(() => {
    api.getTaskPools().then(setPools);
    const interval = setInterval(() => api.getTaskPools().then(setPools), 15000);
    return () => clearInterval(interval);
  }, []);
  return pools;
}

export function useLiveFeed() {
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  useEffect(() => { api.getLiveFeed().then(setFeed); }, []);
  return feed;
}

export function useNetworkStats() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  useEffect(() => { api.getNetworkStats().then(setStats); }, []);
  return stats;
}
