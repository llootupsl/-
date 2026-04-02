/**
 * =============================================================================
 * 时空裂隙 - Web Bluetooth 近场通讯引擎
 * =============================================================================
 */

import { EventEmitter } from 'events';
import { logger } from '../../core/utils/Logger';

export type RiftState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'syncing' | 'error';
export type DeviceType = 'phone' | 'tablet' | 'watch' | 'laptop' | 'unknown';

export interface NearbyDevice {
  id: string;
  name: string;
  type: DeviceType;
  rssi: number;
  discoveredAt: number;
  lastSeen: number;
}

export interface SpacetimeRiftConfig {
  serviceUuid?: string;
  characteristicUuid?: string;
  scanTimeout?: number;
  connectTimeout?: number;
  maxDevices?: number;
  minRssi?: number;
}

const DEFAULT_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const DEFAULT_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

const defaultConfig: Required<SpacetimeRiftConfig> = {
  serviceUuid: DEFAULT_SERVICE_UUID,
  characteristicUuid: DEFAULT_CHARACTERISTIC_UUID,
  scanTimeout: 10000,
  connectTimeout: 5000,
  maxDevices: 10,
  minRssi: -80,
};

/**
 * Web Bluetooth 时空裂隙引擎
 */
export class SpacetimeRift extends EventEmitter {
  private config: Required<SpacetimeRiftConfig>;
  private devices: Map<string, NearbyDevice> = new Map();
  private connectedDevices: Map<string, BluetoothDevice> = new Map();
  private servers: Map<string, BluetoothRemoteGATTServer> = new Map();
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();
  private scanTimeout: number | null = null;
  private isScanning: boolean = false;
  private deviceWatcher: number | null = null;

  constructor(config?: SpacetimeRiftConfig) {
    super();
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 检查浏览器支持
   */
  public static isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * 开始扫描设备
   */
  public async startScan(): Promise<void> {
    if (!SpacetimeRift.isSupported()) {
      throw new Error('Web Bluetooth 不可用');
    }

    if (this.isScanning) {
      logger.warn('SpacetimeRift', 'Already scanning');
      return;
    }

    this.isScanning = true;
    this.emit('scan-start');

    // 请求设备
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.config.serviceUuid] }],
        optionalServices: [this.config.serviceUuid],
      });

      // 监听设备
      if (!device.gatt) {
        throw new Error('设备不支持 GATT');
      }

      // 连接到服务器
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(this.config.serviceUuid);
      const characteristic = await service.getCharacteristic(this.config.characteristicUuid);

      // 启用通知
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleCharacteristicChange(device.id, event.target as BluetoothRemoteGATTCharacteristic);
      });

      // 保存连接
      this.connectedDevices.set(device.id, device);
      this.servers.set(device.id, server);
      this.characteristics.set(device.id, characteristic);

      // 更新设备信息
      const nearbyDevice: NearbyDevice = {
        id: device.id,
        name: device.name || '未知设备',
        type: this.guessDeviceType(device.name || ''),
        rssi: -50,
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
      };

      this.devices.set(device.id, nearbyDevice);
      this.emit('device-connected', nearbyDevice);
      this.emit('scan-end');

    } catch (error) {
      logger.error('SpacetimeRift', 'Scan error', error as Error);
      this.isScanning = false;
      this.emit('scan-end');
      this.emit('error', error);
    }
  }

  /**
   * 停止扫描
   */
  public stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.isScanning = false;
    this.emit('scan-end');
  }

  /**
   * 连接到设备
   */
  public async connect(deviceId: string): Promise<NearbyDevice | null> {
    const device = this.devices.get(deviceId);
    if (!device) {
      logger.warn('SpacetimeRift', `Device not found: ${deviceId}`);
      return null;
    }

    this.emit('connecting', device);

    try {
      const requestedDevice = await navigator.bluetooth.requestDevice({
        filters: [{
          services: [this.config.serviceUuid],
        }],
      });

      if (!requestedDevice.gatt) {
        throw new Error('设备不支持 GATT');
      }

      const server = await requestedDevice.gatt.connect();
      const service = await server.getPrimaryService(this.config.serviceUuid);
      const characteristic = await service.getCharacteristic(this.config.characteristicUuid);

      // 启用通知
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleCharacteristicChange(requestedDevice.id, event.target as BluetoothRemoteGATTCharacteristic);
      });

      // 保存连接
      this.connectedDevices.set(requestedDevice.id, requestedDevice);
      this.servers.set(requestedDevice.id, server);
      this.characteristics.set(requestedDevice.id, characteristic);

      // 更新设备信息
      device.lastSeen = Date.now();

      this.emit('device-connected', device);
      return device;

    } catch (error) {
      logger.error('SpacetimeRift', 'Connect error', error as Error);
      this.emit('error', { type: 'connect-error', deviceId, error });
      return null;
    }
  }

  /**
   * 断开连接
   */
  public async disconnect(deviceId: string): Promise<void> {
    const server = this.servers.get(deviceId);
    if (server?.connected) {
      server.disconnect();
    }
    this.connectedDevices.delete(deviceId);
    this.servers.delete(deviceId);
    this.characteristics.delete(deviceId);
    this.emit('device-disconnected', { deviceId });
  }

  /**
   * 断开所有连接
   */
  public disconnectAll(): void {
    this.connectedDevices.forEach((_, deviceId) => {
      this.disconnect(deviceId);
    });
  }

  /**
   * 发送数据到设备
   */
  public async sendToDevice(deviceId: string, data: string): Promise<void> {
    const characteristic = this.characteristics.get(deviceId);
    if (!characteristic) {
      throw new Error('设备未连接');
    }

    const encoder = new TextEncoder();
    const value = encoder.encode(data);
    await characteristic.writeValue(value);
  }

  /**
   * 广播数据到所有已连接设备
   */
  public async broadcast(data: string): Promise<void> {
    const promises = Array.from(this.characteristics.keys()).map(deviceId =>
      this.sendToDevice(deviceId, data).catch(error => {
        logger.warn('SpacetimeRift', `Failed to send to ${deviceId}`, error as Error);
      })
    );
    await Promise.allSettled(promises);
  }

  /**
   * 处理特征值变化
   */
  private handleCharacteristicChange(deviceId: string, characteristic: BluetoothRemoteGATTCharacteristic): void {
    const decoder = new TextDecoder();
    const value = decoder.decode(characteristic.value);

    try {
      const data = JSON.parse(value);
      this.emit('data', { deviceId, data });
    } catch (error) {
      logger.warn('SpacetimeRift', 'Failed to parse characteristic data as JSON, emitting raw value', error as Error);
      this.emit('data', { deviceId, raw: value });
    }
  }

  /**
   * 获取设备类型
   */
  private guessDeviceType(name: string): DeviceType {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('iphone') || lower.includes('android')) {
      return 'phone';
    }
    if (lower.includes('tablet') || lower.includes('ipad')) {
      return 'tablet';
    }
    if (lower.includes('watch') || lower.includes('wear')) {
      return 'watch';
    }
    if (lower.includes('laptop') || lower.includes('mac') || lower.includes('pc')) {
      return 'laptop';
    }
    return 'unknown';
  }

  /**
   * 获取已发现的设备列表
   */
  public getDevices(): NearbyDevice[] {
    return Array.from(this.devices.values()).filter(d => d.lastSeen > Date.now() - 30000);
  }

  /**
   * 获取已连接的设备列表
   */
  public getConnectedDevices(): NearbyDevice[] {
    const connected: NearbyDevice[] = [];
    this.devices.forEach((device) => {
      const server = this.servers.get(device.id);
      if (server?.connected) {
        connected.push(device);
      }
    });
    return connected;
  }

  /**
   * 检查设备是否已连接
   */
  public isDeviceConnected(deviceId: string): boolean {
    const server = this.servers.get(deviceId);
    return server?.connected ?? false;
  }

  /**
   * 获取连接状态
   */
  public getStatus(): {
    isScanning: boolean;
    deviceCount: number;
    connectedCount: number;
  } {
    return {
      isScanning: this.isScanning,
      deviceCount: this.devices.size,
      connectedCount: this.connectedDevices.size,
    };
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this.stopScan();
    this.disconnectAll();
    this.devices.clear();
    this.removeAllListeners();
  }
}

export default SpacetimeRift;
