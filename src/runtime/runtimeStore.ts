import { create } from 'zustand';
import type { CapabilityId, CapabilityProfile } from './capabilities';
import type { RuntimePathSource } from './runtimeVocabulary';

export type RuntimeSeverity = 'info' | 'success' | 'warning' | 'error';
export type RuntimeBootPhase = 'cold' | 'probing' | 'hydrating' | 'ready' | 'error';
export type RuntimeSubsystemState = 'idle' | 'loading' | 'ready' | 'degraded' | 'error';

export interface RuntimeTraceEvent {
  id: string;
  timestamp: number;
  stage: 'boot' | 'world' | 'integration' | 'ui';
  severity: RuntimeSeverity;
  title: string;
  detail?: string;
  subsystemId?: string;
}

export interface SubsystemSnapshot {
  id: string;
  label: string;
  group: 'boot' | 'rendering' | 'simulation' | 'integration' | 'experience';
  state: RuntimeSubsystemState;
  source: RuntimePathSource;
  detail: string;
  capabilityId?: CapabilityId;
  metrics?: Record<string, string | number | boolean>;
  updatedAt: number;
}

interface RuntimeStoreState {
  bootPhase: RuntimeBootPhase;
  capabilityProfile: CapabilityProfile | null;
  traces: RuntimeTraceEvent[];
  subsystems: Record<string, SubsystemSnapshot>;
  setBootPhase: (phase: RuntimeBootPhase) => void;
  setCapabilityProfile: (profile: CapabilityProfile) => void;
  upsertSubsystem: (snapshot: SubsystemSnapshot) => void;
  patchSubsystem: (
    id: string,
    patch: Partial<Omit<SubsystemSnapshot, 'id' | 'updatedAt'>>,
  ) => void;
  pushTrace: (event: Omit<RuntimeTraceEvent, 'id' | 'timestamp'>) => void;
  resetRuntime: () => void;
}

const MAX_TRACES = 40;

export const useRuntimeStore = create<RuntimeStoreState>((set) => ({
  bootPhase: 'cold',
  capabilityProfile: null,
  traces: [],
  subsystems: {},

  setBootPhase: (phase) => {
    set({ bootPhase: phase });
  },

  setCapabilityProfile: (profile) => {
    set({ capabilityProfile: profile });
  },

  upsertSubsystem: (snapshot) => {
    set((state) => ({
      subsystems: {
        ...state.subsystems,
        [snapshot.id]: snapshot,
      },
    }));
  },

  patchSubsystem: (id, patch) => {
    set((state) => {
      const current = state.subsystems[id];
      if (!current) {
        return state;
      }

      return {
        subsystems: {
          ...state.subsystems,
          [id]: {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  pushTrace: (event) => {
    set((state) => ({
      traces: [
        ...state.traces.slice(-(MAX_TRACES - 1)),
        {
          ...event,
          id: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  resetRuntime: () => {
    set({
      bootPhase: 'cold',
      capabilityProfile: null,
      traces: [],
      subsystems: {},
    });
  },
}));

export function setBootPhase(phase: RuntimeBootPhase): void {
  useRuntimeStore.getState().setBootPhase(phase);
}

export function setCapabilityProfile(profile: CapabilityProfile): void {
  useRuntimeStore.getState().setCapabilityProfile(profile);
}

export function upsertSubsystem(snapshot: SubsystemSnapshot): void {
  useRuntimeStore.getState().upsertSubsystem(snapshot);
}

export function patchSubsystem(
  id: string,
  patch: Partial<Omit<SubsystemSnapshot, 'id' | 'updatedAt'>>,
): void {
  useRuntimeStore.getState().patchSubsystem(id, patch);
}

export function pushRuntimeTrace(
  event: Omit<RuntimeTraceEvent, 'id' | 'timestamp'>,
): void {
  useRuntimeStore.getState().pushTrace(event);
}

export function resetRuntimeStore(): void {
  useRuntimeStore.getState().resetRuntime();
}
