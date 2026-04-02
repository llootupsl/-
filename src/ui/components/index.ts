/**
 * =============================================================================
 * OMNIS APIEN - 永夜熵纪
 * 赛博朋克 UI 组件库
 * 完美深度实现的巅峰之作
 * =============================================================================
 */

export { GameHUD } from './GameHUD';
export { ResourcePanel } from './ResourcePanel';
export { NarrativePanel } from './NarrativePanel';
export { CitizenPanel } from './CitizenPanel';
export { DivinePanel } from './DivinePanel';
export { SettingsPanel } from './SettingsPanel';
export { AIConfigPanel } from './AIConfigPanel';
export { EpochPanel } from './EpochPanel';
export { MiniMap } from './MiniMap';
export { ToastContainer as LegacyToastContainer } from './ToastContainer';
export { Tooltip } from './Tooltip';
export { Modal, ConfirmDialog, AlertDialog } from './Modal';
export { DivineVerificationModal, useDivineVerification } from './DivineVerificationModal';
export { Tabs, TabPane } from './Tabs';
export { Dropdown } from './Dropdown';
export { HUDLayout, useGameHUD } from './HUDLayout';
export { GameOverScreen } from './GameOverScreen';

export { 
  ToastContainer, 
  useToast, 
  useToastStore, 
  toast 
} from '../../components/ui/Toast';

export {
  Button,
  IconButton,
  ButtonGroup,
  Panel,
  Card,
  PanelSection,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Badge,
  Divider,
  Avatar,
  Progress,
  Skeleton,
  Tag,
  Empty,
  Spinner,
} from './common';

export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
  PanelProps,
  PanelVariant,
  PanelSize,
  CardProps,
  CardVariant,
  InputProps,
  InputSize,
  InputStatus,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  SwitchProps,
  BadgeProps,
  BadgeVariant,
  DividerProps,
  AvatarProps,
  AvatarSize,
  ProgressProps,
  ProgressStatus,
  SkeletonProps,
  TagProps,
  EmptyProps,
  SpinnerProps,
} from './common';

export { ErrorBoundary } from './ErrorBoundary';
export { ErrorModal } from './ErrorModal';
export type { ErrorModalProps, ErrorSeverity, ErrorRecovery } from './ErrorModal';

export { DraggablePanel } from './DraggablePanel';
export { MinimizedPanelBar } from './MinimizedPanelBar';

export { default as MetaCognitionVisualization } from './MetaCognitionVisualization';
export type {
  MetaCognitionInfluence,
  ValueSystem as MetaValueSystem,
  MetaCognitionState as MetaState,
  Goal as MetaGoal,
  MetaCognitionVisualizationProps,
} from './MetaCognitionVisualization';

export { default as MetaCognitionDebugPanel } from './MetaCognitionDebugPanel';
export type { MetaCognitionDebugPanelProps } from './MetaCognitionDebugPanel';
export { 
  EnvironmentPanel, 
  EnvironmentMap, 
  ClimateIndicators, 
  ClimateTrendChart,
  DisasterWarningPanel,
  ActiveDisastersList,
  SEIRChart,
  useEnvironmentState,
} from './EnvironmentPanel';
export type {
  EnvironmentPanelProps,
  EnvironmentMapProps,
  ClimateIndicatorProps,
  ClimateTrendChartProps,
  DisasterWarningPanelProps,
  ActiveDisastersListProps,
  SEIRChartProps,
  SEIRStats,
  InfectionZone,
  ClimateTrendData,
} from './EnvironmentPanel';

export { 
  InfrastructurePanel,
  InfrastructureMap,
  StatusIndicator,
  InfrastructureStats,
  ConstructionPanel,
  DetailPanel,
  InfrastructureList,
  useInfrastructureState,
} from './InfrastructurePanel';
export type {
  InfrastructurePanelProps,
  InfrastructureMapProps,
  StatusIndicatorProps,
  ConstructionPanelProps,
  BuildOptions,
  DetailPanelProps,
  InfrastructureStatsProps,
  InfrastructureListProps,
} from './InfrastructurePanel';

export { SupplyChainVisualization } from './SupplyChainVisualization';
