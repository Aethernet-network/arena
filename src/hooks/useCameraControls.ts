import type { ZoomLevel, Page } from "../data/types";
import { createContext, useContext } from "react";

export interface ArenaState {
  zoomLevel: ZoomLevel;
  selectedSwarm: string | null;
  selectedAgent: string | null;
  showLobby: boolean;
  activePage: Page;
  sidebarOpen: boolean;
  selectSwarm: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
  setShowLobby: (show: boolean) => void;
  goBack: () => void;
  recenter: () => void;
  flyToSwarm: (id: string) => void;
  setActivePage: (page: Page) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const ArenaContext = createContext<ArenaState>(null!);

export function useArena(): ArenaState {
  return useContext(ArenaContext);
}
