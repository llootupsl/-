/**
 * 核心类型定义
 */

/**
 * 通用 ID 类型
 */
export type EntityId = string & { readonly brand: unique symbol };

/**
 * 创建实体 ID
 */
export function createEntityId(): EntityId {
  return crypto.randomUUID() as EntityId;
}

/**
 * 2D 向量
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 3D 向量
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 4D 向量
 */
export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * V5修复：向量辅助函数 - 从数组创建 Vec2
 */
export function vec2From(arr: [number, number] | number[]): Vec2 {
  return { x: arr[0], y: arr[1] };
}

/**
 * V5修复：向量辅助函数 - 从数组创建 Vec3
 */
export function vec3From(arr: [number, number, number] | number[]): Vec3 {
  return { x: arr[0], y: arr[1], z: arr[2] };
}

/**
 * V5修复：向量辅助函数 - Vec2 转数组
 */
export function vec2ToArr(v: Vec2): [number, number] {
  return [v.x, v.y];
}

/**
 * V5修复：向量辅助函数 - Vec3 转数组
 */
export function vec3ToArr(v: Vec3): [number, number, number] {
  return [v.x, v.y, v.z];
}

/**
 * 颜色
 */
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

/**
 * 时间戳
 */
export type Timestamp = number;

/**
 * 持续时间 (毫秒)
 */
export type Duration = number;

/**
 * 百分比 (0-1)
 */
export type Probability = number;

/**
 * 权重
 */
export type Weight = number;

/**
 * 枚举转联合类型工具
 */
export type EnumToUnion<T> = T extends string ? T : never;

/**
 * 可选字段
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必需字段
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 只读类型
 */
export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

/**
 * 深度只读
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 可序列化类型
 */
export type SerializablePrimitive = string | number | boolean | null |
  SerializablePrimitive[] |
  { [key: string]: SerializablePrimitive };

/**
 * 回调函数类型
 */
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
export type EventCallback<T = unknown> = (event: T) => void;
export type AsyncEventCallback<T = unknown> = (event: T) => Promise<void>;

/**
 * 构造函数类型
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * 实例类型
 */
export type InstanceType<T> = T extends Constructor<infer R> ? R : never;

/**
 * Promise 类型
 */
export type PromiseOr<T> = T | Promise<T>;

/**
 * 空值类型
 */
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;

/**
 * 记录类型
 */
export type StringRecord<T = unknown> = Record<string, T>;
export type NumberRecord<T = unknown> = Record<number, T>;

/**
 * 数组类型
 */
export type NonEmptyArray<T> = [T, ...T[]];
export type FixedArray<T, L extends number> = Array<T> & { length: L };

/**
 * 哈希表类型
 */
export interface HashMap<T> {
  [key: string]: T;
}

/**
 * 范围类型
 */
export interface Range {
  min: number;
  max: number;
}

/**
 * 矩形区域
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 边界框
 */
export interface BoundingBox {
  min: Vec3;
  max: Vec3;
}

/**
 * 射线
 */
export interface Ray {
  origin: Vec3;
  direction: Vec3;
}

/**
 * 平面
 */
export interface Plane {
  normal: Vec3;
  distance: number;
}

/**
 * 矩阵 4x4
 */
export interface Matrix4 {
  elements: Float32Array;
}

/**
 * 四元数
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * 变换
 */
export interface Transform {
  position: Vec3;
  rotation: Quaternion;
  scale: Vec3;
}

/**
 * 状态机状态
 */
export interface StateMachineState<T = string> {
  id: T;
  onEnter?: Callback;
  onExit?: Callback;
  onUpdate?: (deltaTime: Duration) => void;
}

/**
 * 状态机转换
 */
export interface StateTransition<T = string> {
  from: T;
  to: T;
  condition?: () => boolean;
  onTransition?: Callback;
}

/**
 * 事件发射器
 */
export interface EventEmitter<Events extends StringRecord> {
  on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
  off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  once<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
}

/**
 * 可更新的接口
 */
export interface Updatable {
  update(deltaTime: Duration): void;
}

/**
 * 可销毁的接口
 */
export interface Disposable {
  dispose(): void;
}

/**
 * 可序列化的接口
 */
export interface Serializable<T = unknown> {
  serialize(): T;
  deserialize(data: T): void;
}

/**
 * 可克隆的接口
 */
export interface Cloneable<T> {
  clone(): T;
}

/**
 * .Equal() 方法接口
 */
export interface Equatable<T> {
  equals(other: T): boolean;
}

/**
 * 哈希接口
 */
export interface Hashable {
  hash(): number;
}

/**
 * 比较结果
 */
export enum CompareResult {
  LESS = -1,
  EQUAL = 0,
  GREATER = 1,
}

/**
 * 排序比较函数
 */
export type CompareFn<T> = (a: T, b: T) => CompareResult;

/**
 * 筛选函数
 */
export type FilterFn<T> = (item: T, index: number) => boolean;

/**
 * 映射函数
 */
export type MapFn<T, R = T> = (item: T, index: number) => R;

/**
 * 归约函数
 */
export type ReduceFn<T, R = T> = (acc: R, item: T, index: number) => R;

/**
 * 谓词函数
 */
export type Predicate<T> = (item: T) => boolean;

/**
 * 异步谓词函数
 */
export type AsyncPredicate<T> = (item: T) => Promise<boolean>;
