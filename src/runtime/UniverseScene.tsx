import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { GameView } from '@/ui/components/GameView';
import { WebGPUCanvas } from '@/ui/components/WebGPUCanvas';
import { audioEngine, SoundType } from '@/audio/AudioEngine';
import { citizenManager } from '@/citizen/CitizenManager';
import { systemIntegrator } from '@/core/SystemIntegrator';
import { eventCleanupManager } from '@/core/EventCleanupManager';
import { economicSystemBinder } from '@/core/economy/EconomicSystemBinder';
import { gnnResultApplicator, type CitizenState as GNNCitizenState } from '@/core/gnn/GNNResultApplicator';
import { GNN_CONFIG } from '@/core/constants';
import { logger } from '@/core/utils/Logger';
import { syncEmotionToUI } from '@/ui/EmotionSync';
import { errorReporter } from '@/utils/ErrorReporter';
import { useGameStore } from '@/store/gameStore';
import { socialGNN, deriveEmbeddingFromCitizen } from '@/ai/SocialGNN';
import { economicSystem } from '@/economy/EconomicSystem';
import { techTree } from '@/economy/TechTree';
import { daoSystem } from '@/governance/DAOSystem';
import { HelpButton, HelpPanel, FeatureDiscoveryManager } from '@/components/help';
import { TutorialManager, TutorialRestartButton } from '@/components/tutorial';
import { useHelpStore } from '@/stores/helpStore';
import { useShouldShowTutorial, useTutorialStore } from '@/stores/tutorialStore';
import { toast } from '@/stores/toastStore';
import type { ModeConfig } from '@/ui/components/ModeSelect';
import type { EntityId } from '@/core/types';
import type { LLMManager } from '@/ai/LLMBridge';
import { RelationType } from '@/core/types/citizen';

const EightCharsPanel = lazy(() =>
  import('@/fortune/EightCharsPanel').then((module) => ({ default: module.EightCharsPanel })),
);
const ChatPanel = lazy(() => import('@/chat/ChatPanel').then((module) => ({ default: module.ChatPanel })));
const DivinePanel = lazy(() =>
  import('@/ui/components/DivinePanel').then((module) => ({ default: module.DivinePanel })),
);
const CitizenPanel = lazy(() =>
  import('@/ui/components/CitizenPanel').then((module) => ({ default: module.CitizenPanel })),
);
const GameOverScreen = lazy(() =>
  import('@/ui/components/GameOverScreen').then((module) => ({ default: module.GameOverScreen })),
);
const SystemStatusPanel = lazy(() =>
  import('@/ui/components/SystemStatusPanel').then((module) => ({ default: module.SystemStatusPanel })),
);
const GenesisTwinPanel = lazy(() =>
  import('@/api/GenesisTwinPanel').then((module) => ({ default: module.GenesisTwinPanel })),
);
const BenchmarkPanel = lazy(() =>
  import('@/bench/BenchmarkPanel').then((module) => ({ default: module.BenchmarkPanel })),
);
const DAOPanel = lazy(() =>
  import('@/ui/components/DAOPanel').then((module) => ({ default: module.DAOPanel })),
);
const SpaceWarpPanel = lazy(() =>
  import('@/network/p2p/SpaceWarpPanel').then((module) => ({ default: module.SpaceWarpPanel })),
);

let lastGnnUpdateTime = 0;
let webGpuRendererModulePromise: Promise<typeof import('@/rendering/WebGPURenderer')> | null = null;

function getWebGpuRendererModule() {
  if (!webGpuRendererModulePromise) {
    webGpuRendererModulePromise = import('@/rendering/WebGPURenderer');
  }

  return webGpuRendererModulePromise;
}

interface UseGameLoopOptions {
  enabled: boolean;
  onUpdate?: (deltaMs: number) => void;
}

function useGameLoop(options: UseGameLoopOptions) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const emotionSyncRef = useRef<number>(0);
  const citizenSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!options.enabled) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const loop = (currentTime: number) => {
      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      options.onUpdate?.(deltaMs);

      emotionSyncRef.current += deltaMs;
      if (emotionSyncRef.current >= 500) {
        emotionSyncRef.current = 0;
        const state = useGameStore.getState();
        syncEmotionToUI(
          state.emotion.hope / 100,
          state.emotion.discontent / 100,
          state.entropy / 100,
        );
      }

      citizenSyncRef.current += deltaMs;
      if (citizenSyncRef.current >= 100) {
        citizenSyncRef.current = 0;
        const citizens = citizenManager
          .getAll()
          .slice(0, 1000)
          .map((citizen) => ({
            id: citizen.id,
            position: citizen.position.world,
            lodLevel: citizen.getLODLevel(),
            visible: citizen.visible,
            energy: citizen.state.energy,
            health: citizen.state.health,
            mood: citizen.state.mood,
            neuralActivity: citizen.getAverageFiringRate(),
          }));

        void getWebGpuRendererModule().then(({ webGPURenderer }) => {
          webGPURenderer.setCitizens(citizens);
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [options.enabled, options.onUpdate]);
}

export interface UniverseSceneProps {
  currentMode: ModeConfig;
  onExitToMenu: () => void;
}

export function UniverseScene({ currentMode, onExitToMenu }: UniverseSceneProps) {
  const [showEightChars, setShowEightChars] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showDivine, setShowDivine] = useState(false);
  const [showCitizen, setShowCitizen] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showGenesisTwin, setShowGenesisTwin] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [showDao, setShowDao] = useState(false);
  const [showSpaceWarp, setShowSpaceWarp] = useState(false);
  const [llmManager, setLlmManager] = useState<LLMManager | null>(null);
  const peerIdentityRef = useRef({
    id: `observer-${Math.random().toString(36).slice(2, 10)}`,
    name: '高维监察者',
  });

  const gamePhase = useGameStore((state) => state.phase);
  const resetGame = useGameStore((state) => state.resetGame);

  const shouldShowTutorial = useShouldShowTutorial();
  const startTutorial = useTutorialStore((state) => state.startTutorial);

  const { isOpen: isHelpOpen, toggleHelp, closeHelp, contextualPanel } = useHelpStore();
  const panelFallback = <div className="panel-loading panel-loading--glass">载入模块中...</div>;

  const setupEventBindings = useCallback(() => {
    const handleCitizenBorn = (citizen: { id: string; needs: Record<string, unknown> }) => {
      economicSystemBinder.handleGameStateChange({
        source: 'population',
        type: 'citizenBorn',
        data: {
          id: citizen.id,
          needs: citizen.needs,
        },
        economicImpact: 0.1,
      });

      useGameStore.getState().addNarrative(`新市民诞生：${citizen.id.slice(0, 8)}`, 'event');
    };

    const handleCitizenDied = (citizenId: string) => {
      economicSystemBinder.handleGameStateChange({
        source: 'population',
        type: 'citizenDied',
        data: {
          id: citizenId,
        },
        economicImpact: -0.1,
      });

      useGameStore.getState().addNarrative(`市民消逝：${citizenId.slice(0, 8)}`, 'event');
    };

    const handleTechCompleted = (tech: { name: string }) => {
      useGameStore.getState().addNarrative(`科技突破：${tech.name}`, 'achievement');
    };

    citizenManager.on('citizenBorn', handleCitizenBorn);
    citizenManager.on('citizenDied', handleCitizenDied);
    techTree.on('researchCompleted', handleTechCompleted);

    logger.debug('UniverseScene', 'Event bindings configured');

    return () => {
      citizenManager.off('citizenBorn', handleCitizenBorn);
      citizenManager.off('citizenDied', handleCitizenDied);
      techTree.off('researchCompleted', handleTechCompleted);
      logger.debug('UniverseScene', 'Event bindings cleaned up');
    };
  }, []);

  const handleGameUpdate = useCallback((deltaMs: number) => {
    const state = useGameStore.getState();
    if (state.phase !== 'running') {
      return;
    }

    state.tick(deltaMs);

    economicSystem.update(deltaMs);
    economicSystemBinder.update(deltaMs);
    systemIntegrator.update(deltaMs);

    const economicResources = economicSystem.getAllResources();
    for (const resource of economicResources) {
      const resourceTypeMap: Record<string, keyof typeof state.resources> = {
        core_energy: 'coreEnergy',
        compute_quota: 'computeQuota',
        biomass: 'biomass',
        information: 'information',
        trust: 'trust',
      };

      const mappedKey = resourceTypeMap[resource.type];
      if (!mappedKey) {
        continue;
      }

      const currentAmount = state.resources[mappedKey];
      const delta = resource.amount - currentAmount;
      if (Math.abs(delta) > 0.01) {
        state.addResource(mappedKey, delta);
      }
    }

    if (typeof daoSystem.update === 'function') {
      try {
        daoSystem.update(deltaMs);
      } catch (error) {
        const appError = error instanceof Error ? error : new Error(String(error));
        logger.error('DAO', 'Update failed', appError);
        errorReporter.report(appError, 'governance', {
          type: 'warning',
          title: 'DAO 更新失败',
        });
      }
    }

    if (typeof techTree.update === 'function') {
      try {
        techTree.update(deltaMs);
      } catch (error) {
        const appError = error instanceof Error ? error : new Error(String(error));
        logger.error('TechTree', 'Update failed', appError);
        errorReporter.report(appError, 'unknown', {
          type: 'warning',
          title: '科技树更新失败',
        });
      }
    }

    if (state.resources.computeQuota > 0) {
      const researchPoints = state.resources.computeQuota * 0.001 * (deltaMs / 1000);
      const completedTech = techTree.updateResearch
        ? techTree.updateResearch(deltaMs / 1000, researchPoints)
        : null;

      if (completedTech) {
        state.addNarrative(`科技突破：${completedTech.name}`, 'achievement');
      }
    }

    const techEffects = techTree.applyEffects ? techTree.applyEffects() : {};
    const daoModifiers = daoSystem.applyLawsToGameState ? daoSystem.applyLawsToGameState() : {};

    const currentTime = Date.now();
    if (!lastGnnUpdateTime || currentTime - lastGnnUpdateTime > GNN_CONFIG.UPDATE_INTERVAL) {
      const citizens = citizenManager.getAll();
      const citizenStates = new Map<string, GNNCitizenState>();

      for (const citizen of citizens) {
        const embedding = deriveEmbeddingFromCitizen({
          energy: citizen.state.energy,
          mood: citizen.state.mood,
          health: citizen.state.health,
          age: citizen.age,
          intelligence: citizen.attributes?.intelligence,
          socialStatus: citizen.attributes?.socialStatus,
          genome: Array.isArray(citizen.genome?.genes)
            ? (citizen.genome.genes as number[])
            : undefined,
        });

        socialGNN.addNode({
          id: citizen.id,
          type: 'citizen',
          features: [
            citizen.state.energy / 100,
            citizen.state.mood / 100,
            citizen.state.health / 100,
          ],
          embedding,
        });

        citizenStates.set(citizen.id, {
          id: citizen.id,
          politicalAlignment: citizen.attributes?.politicalAlignment || 0.5,
          economicPreference: citizen.attributes?.economicPreference || 0.5,
          socialActivity: citizen.state.energy / 100,
          relations: new Map(
            citizen.relations.map((relation) => [
              relation.targetId,
              { type: relation.type, strength: relation.intimacy },
            ]),
          ),
        });

        for (const relation of citizen.relations) {
          const validTypes = ['friend', 'family', 'work', 'trade', 'follow', 'conflict'] as const;
          const relationType = validTypes.includes(relation.type as (typeof validTypes)[number])
            ? (relation.type as (typeof validTypes)[number])
            : 'friend';

          socialGNN.addEdge({
            source: citizen.id,
            target: relation.targetId,
            weight: relation.intimacy,
            type: relationType,
          });
        }
      }

      socialGNN.messagePassing(2);

      const gnnOutput = {
        embeddings: socialGNN.getAllEmbeddings(),
        influenceScores: socialGNN.getInfluenceScores(),
        communityAssignments: socialGNN.getCommunityAssignments(),
        relationPredictions: socialGNN.getRelationPredictions(),
      };

      const behaviorMods = gnnResultApplicator.applyResults(gnnOutput, citizenStates, deltaMs);

      for (const mod of behaviorMods) {
        const citizen = citizenManager.getById(mod.citizenId as EntityId);
        if (!citizen) {
          continue;
        }

        for (const change of mod.changes) {
          if (change.attribute === 'politicalAlignment') {
            if (!citizen.attributes) {
              citizen.attributes = {
                intelligence: 0,
                socialStatus: 0,
                strength: 0,
                agility: 0,
                charisma: 0,
                politicalAlignment: 0.5,
                economicPreference: 0.5,
              };
            }
            citizen.attributes.politicalAlignment = change.newValue as number;
          } else if (change.attribute === 'economicPreference') {
            if (!citizen.attributes) {
              citizen.attributes = {
                intelligence: 0,
                socialStatus: 0,
                strength: 0,
                agility: 0,
                charisma: 0,
                politicalAlignment: 0.5,
                economicPreference: 0.5,
              };
            }
            citizen.attributes.economicPreference = change.newValue as number;
          } else if (change.attribute === 'socialActivity') {
            citizen.state.energy = (change.newValue as number) * 100;
          } else if (change.attribute.startsWith('relations.')) {
            const targetId = change.attribute.split('.')[1];
            const existingIndex = citizen.relations.findIndex((relation) => relation.targetId === targetId);

            if (change.newValue === 'none' && existingIndex >= 0) {
              citizen.relations.splice(existingIndex, 1);
            } else if (existingIndex < 0 && change.newValue !== 'none') {
              const relationTypeMap: Record<string, RelationType> = {
                friend: RelationType.FRIEND,
                family: RelationType.FAMILY,
                work: RelationType.WORK,
                trade: RelationType.WORK,
                follow: RelationType.FRIEND,
                conflict: RelationType.ENEMY,
              };

              citizen.relations.push({
                targetId: targetId as EntityId,
                type: relationTypeMap[change.newValue as string] || RelationType.NEUTRAL,
                intimacy: 0.5,
                establishedAt: Date.now(),
              });
            }
          }

          if (
            typeof change.newValue === 'number' &&
            Math.abs(change.newValue - (change.oldValue as number)) > 0.1
          ) {
            state.addNarrative(`市民 ${citizen.id.slice(0, 8)} ${change.reason}`, 'event');
          }
        }
      }

      lastGnnUpdateTime = currentTime;
    }

    state.updateResources(deltaMs);
    state.updateEmotion(deltaMs);
    state.syncCitizenStats();
    citizenManager.updateAll(deltaMs);

    const entropyDelta = deltaMs * 0.001 * (1 + state.entropy / 100);
    const entropyReduction = (techEffects.entropyReduction || 0) + (daoModifiers.entropyRate || 0);
    state.updateEntropy(entropyDelta - (entropyReduction * deltaMs) / 1000);
    state.checkWarnings();

    const currentState = useGameStore.getState();
    if (currentState.entropy >= 100) {
      currentState.endGame();
    } else if (currentState.citizenStats.total === 0 && currentState.time.year > 1) {
      currentState.endGame();
    } else if (currentState.resources.coreEnergy <= 0 && currentState.citizenStats.total > 0) {
      currentState.endGame();
    }
  }, []);

  useGameLoop({
    enabled: true,
    onUpdate: handleGameUpdate,
  });

  useEffect(() => {
    const cleanup = setupEventBindings();
    return cleanup;
  }, [setupEventBindings]);

  useEffect(() => {
    return () => {
      audioEngine.stopBGM();
    };
  }, []);

  useEffect(() => {
    if (shouldShowTutorial) {
      const timer = window.setTimeout(() => {
        startTutorial();
      }, 1000);
      return () => window.clearTimeout(timer);
    }
  }, [shouldShowTutorial, startTutorial]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'h':
          event.preventDefault();
          toggleHelp();
          break;
        case 'c':
          if (!showCitizen && !isHelpOpen) {
            event.preventDefault();
            setShowCitizen(true);
          }
          break;
        case 'd':
          if (!showDivine && !isHelpOpen) {
            event.preventDefault();
            setShowDivine(true);
          }
          break;
        case 's':
          if (!showSystemStatus && !isHelpOpen) {
            event.preventDefault();
            setShowSystemStatus(true);
          }
          break;
      }
    };

    const cleanup = eventCleanupManager.register(window, 'keydown', handleKeyDown);
    return cleanup;
  }, [isHelpOpen, showCitizen, showDivine, showSystemStatus, toggleHelp]);

  const playClick = useCallback(() => {
    audioEngine.play(SoundType.UI_CLICK);
  }, []);

  const ensureLlmManager = useCallback(async () => {
    if (llmManager) {
      return llmManager;
    }

    try {
      const { LLMManager: RuntimeLLMManager } = await import('@/ai/LLMBridge');
      const manager = RuntimeLLMManager.getInstance();
      setLlmManager(manager);
      return manager;
    } catch (error) {
      logger.warn('UniverseScene', 'LLM manager unavailable', error as Error);
      return null;
    }
  }, [llmManager]);

  const handleOpenChat = useCallback(() => {
    playClick();
    setShowChat(true);
    void ensureLlmManager();
  }, [ensureLlmManager, playClick]);

  const handleOpenEightChars = useCallback(() => {
    playClick();
    setShowEightChars(true);
  }, [playClick]);

  const handleOpenDivine = useCallback(() => {
    playClick();
    setShowDivine(true);
  }, [playClick]);

  const handleOpenCitizen = useCallback(() => {
    playClick();
    setShowCitizen(true);
  }, [playClick]);

  const handleOpenSystemStatus = useCallback(() => {
    playClick();
    setShowSystemStatus(true);
  }, [playClick]);

  const handleOpenGenesisTwin = useCallback(() => {
    playClick();
    setShowGenesisTwin(true);
  }, [playClick]);

  const handleOpenBenchmark = useCallback(() => {
    playClick();
    setShowBenchmark(true);
  }, [playClick]);

  const handleOpenDao = useCallback(() => {
    playClick();
    setShowDao(true);
  }, [playClick]);

  const handleOpenSpaceWarp = useCallback(() => {
    playClick();
    setShowSpaceWarp(true);
  }, [playClick]);

  const handleToggleHelp = useCallback(() => {
    playClick();
    toggleHelp();
  }, [playClick, toggleHelp]);

  const handleBack = useCallback(() => {
    audioEngine.stopBGM();
    playClick();
    onExitToMenu();
  }, [onExitToMenu, playClick]);

  const startCurrentUniverse = useCallback(async () => {
    const gameStore = useGameStore.getState();
    audioEngine.play(SoundType.BIRTH);
    gameStore.setPerformanceMode(currentMode.id);
    await gameStore.startGenesis();
    await audioEngine.playBGM();
  }, [currentMode.id]);

  const handleTutorialAction = useCallback((action: string) => {
    switch (action) {
      case 'openCitizen':
        setShowCitizen(true);
        break;
      case 'openDivine':
        setShowDivine(true);
        break;
      case 'openDAO':
        setShowDao(true);
        break;
      default:
        break;
    }
  }, []);

  const handleRestart = useCallback(async () => {
    try {
      resetGame();
      await startCurrentUniverse();
    } catch (error) {
      const appError = error instanceof Error ? error : new Error(String(error));
      logger.error('UniverseScene', 'Restart failed', appError);
      toast.error('重启失败', '重新生成世界时发生错误。');
    }
  }, [resetGame, startCurrentUniverse]);

  const handleMainMenu = useCallback(() => {
    resetGame();
    audioEngine.stopBGM();
    onExitToMenu();
  }, [onExitToMenu, resetGame]);

  return (
    <>
      <WebGPUCanvas mode={currentMode} isActive={true} />

      <GameView
        currentMode={currentMode}
        onBack={handleBack}
        onOpenChat={handleOpenChat}
        onOpenEightChars={handleOpenEightChars}
        onOpenDivine={handleOpenDivine}
        onOpenCitizen={handleOpenCitizen}
        onOpenGenesisTwin={handleOpenGenesisTwin}
        onOpenBenchmark={handleOpenBenchmark}
        onOpenDao={handleOpenDao}
        onOpenSpaceWarp={handleOpenSpaceWarp}
        onOpenSystemStatus={handleOpenSystemStatus}
      />

      <div className="universe-utility-bar">
        <HelpButton onClick={handleToggleHelp} />
        <button
          className="universe-utility-btn"
          onClick={handleOpenSystemStatus}
          aria-label="Open system status"
          title="System status (S)"
        >
          Observatory
        </button>
      </div>

      <Suspense fallback={panelFallback}>
        {showEightChars && (
          <EightCharsPanel isOpen={showEightChars} onClose={() => setShowEightChars(false)} />
        )}
      </Suspense>

      {showChat && (
        <Suspense fallback={panelFallback}>
          <div className="chat-overlay">
            <ChatPanel
              userName="观察者"
              llmManager={llmManager}
              onMessage={(message) => logger.debug('Chat', message.content)}
            />
            <button className="chat-close" onClick={() => setShowChat(false)}>
              关闭
            </button>
          </div>
        </Suspense>
      )}

      {showGenesisTwin && (
        <Suspense fallback={panelFallback}>
          <div className="feature-overlay">
            <GenesisTwinPanel />
            <button className="feature-overlay__close" onClick={() => setShowGenesisTwin(false)}>
              关闭
            </button>
          </div>
        </Suspense>
      )}

      {showBenchmark && (
        <Suspense fallback={panelFallback}>
          <div className="feature-overlay">
            <BenchmarkPanel />
            <button className="feature-overlay__close" onClick={() => setShowBenchmark(false)}>
              关闭
            </button>
          </div>
        </Suspense>
      )}

      <Suspense fallback={panelFallback}>
        {showDivine && <DivinePanel isOpen={showDivine} onClose={() => setShowDivine(false)} />}
      </Suspense>

      <Suspense fallback={panelFallback}>
        {showCitizen && <CitizenPanel isOpen={showCitizen} onClose={() => setShowCitizen(false)} />}
      </Suspense>

      <Suspense fallback={panelFallback}>
        {showDao && <DAOPanel isOpen={showDao} onClose={() => setShowDao(false)} />}
      </Suspense>

      {showSpaceWarp && (
        <Suspense fallback={panelFallback}>
          <div className="feature-overlay">
            <SpaceWarpPanel
              peerId={peerIdentityRef.current.id}
              peerName={peerIdentityRef.current.name}
              onDisconnect={() => setShowSpaceWarp(false)}
            />
            <button className="feature-overlay__close" onClick={() => setShowSpaceWarp(false)}>
              关闭
            </button>
          </div>
        </Suspense>
      )}

      <Suspense fallback={null}>
        {showSystemStatus && (
          <SystemStatusPanel
            isOpen={showSystemStatus}
            onClose={() => setShowSystemStatus(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {gamePhase === 'gameover' && (
          <GameOverScreen onRestart={handleRestart} onMainMenu={handleMainMenu} />
        )}
      </Suspense>

      <TutorialManager onAction={handleTutorialAction} />
      <TutorialRestartButton />

      <HelpPanel isOpen={isHelpOpen} onClose={closeHelp} contextPanel={contextualPanel} />

      {!shouldShowTutorial && <FeatureDiscoveryManager autoShow={true} />}

      <style>{`
        .universe-utility-bar {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 220;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .universe-utility-btn {
          padding: 0.5rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(26, 239, 251, 0.2);
          background: rgba(7, 21, 37, 0.9);
          color: rgba(214, 248, 255, 0.82);
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }

        .universe-utility-btn:hover {
          color: #1aeffb;
          border-color: #1aeffb;
          transform: translateY(-1px);
        }

        .chat-overlay {
          position: fixed;
          inset: auto 1.25rem 1.25rem auto;
          width: min(420px, calc(100vw - 2rem));
          z-index: 240;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .feature-overlay {
          position: fixed;
          inset: 1rem;
          z-index: 245;
          display: grid;
          grid-template-rows: 1fr auto;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 28px;
          border: 1px solid rgba(26, 239, 251, 0.18);
          background: rgba(4, 10, 18, 0.94);
          box-shadow: 0 28px 72px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(18px);
          overflow: auto;
        }

        .chat-close {
          align-self: flex-end;
          padding: 0.45rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(26, 239, 251, 0.2);
          background: rgba(7, 21, 37, 0.92);
          color: rgba(214, 248, 255, 0.78);
          cursor: pointer;
        }

        .feature-overlay__close {
          justify-self: end;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(26, 239, 251, 0.2);
          background: rgba(7, 21, 37, 0.92);
          color: rgba(214, 248, 255, 0.78);
          cursor: pointer;
        }

        .panel-loading--glass {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 180px;
          min-height: 88px;
          padding: 1rem 1.25rem;
          border-radius: 20px;
          border: 1px solid rgba(26, 239, 251, 0.18);
          background: rgba(7, 21, 37, 0.88);
          color: rgba(214, 248, 255, 0.82);
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(14px);
        }

        @media (max-width: 768px) {
          .universe-utility-bar {
            top: auto;
            right: 1rem;
            bottom: 1rem;
            flex-direction: column;
            align-items: flex-end;
          }

          .chat-overlay {
            inset: auto 1rem 5rem 1rem;
            width: auto;
          }

          .feature-overlay {
            inset: 0.75rem 0.75rem 4.75rem;
          }
        }
      `}</style>
    </>
  );
}

export default UniverseScene;
