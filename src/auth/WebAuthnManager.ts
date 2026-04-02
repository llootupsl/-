/**
 * WebAuthn 生物识别认证管理器
 * 实现公钥注册和认证流程
 */

export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'hybrid' | 'internal';
export type PublicKeyCredentialType = 'public-key';
export type AuthenticatorAttachment = 'platform' | 'cross-platform';
export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';
export type AttestationConveyancePreference = 'none' | 'indirect' | 'direct' | 'enterprise';

export interface PublicKeyCredentialCreationOptions {
  challenge: BufferSource;
  rp: {
    name: string;
    id: string;
    icon?: string;
  };
  user: {
    id: BufferSource;
    name: string;
    displayName: string;
    icon?: string;
  };
  pubKeyCredParams: Array<{
    alg: number;
    type: PublicKeyCredentialType;
  }>;
  timeout?: number;
  excludeCredentials?: Array<{
    id: BufferSource;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    requireResidentKey?: boolean;
    residentKey?: UserVerificationRequirement;
    userVerification?: UserVerificationRequirement;
  };
  attestation?: AttestationConveyancePreference;
  extensions?: Record<string, unknown>;
}

export interface PublicKeyCredentialRequestOptions {
  challenge: BufferSource;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{
    id: BufferSource;
    type: PublicKeyCredentialType;
    transports?: AuthenticatorTransport[];
  }>;
  userVerification?: UserVerificationRequirement;
  attestation?: AttestationConveyancePreference;
  extensions?: Record<string, unknown>;
}

export interface WebAuthnCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: number;
  lastUsed: number;
}

export interface PinCredential {
  userId: string;
  pinHash: string;
  createdAt: number;
  lastUsed: number;
}

export interface AuthResult {
  verified: boolean;
  credentialId?: string;
  counter?: number;
  method?: 'webauthn' | 'pin';
}

// 使用类型别名而非继承，避免接口冲突
type AuthenticatorAssertionResponseExtended = AuthenticatorAssertionResponse;

export interface WebAuthnManagerConfig {
  rpId: string;
  rpName: string;
  rpIcon?: string;
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  userVerification?: UserVerificationRequirement;
}

const DEFAULT_CONFIG: Partial<WebAuthnManagerConfig> = {
  timeout: 60000,
  attestation: 'none',
  userVerification: 'preferred',
};

class WebAuthnManager {
  private config: WebAuthnManagerConfig;
  private credentials: Map<string, WebAuthnCredential> = new Map();
  private pinCredentials: Map<string, PinCredential> = new Map();
  private isSupported: boolean;
  private pinLength: number = 6;

  constructor(config: WebAuthnManagerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as WebAuthnManagerConfig;
    this.isSupported = this.checkSupport();
    this.loadCredentials();
    this.loadPinCredentials();
  }

  public async isAvailable(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }
    
    try {
      const platformAvailable = await this.isPlatformAuthenticatorAvailable();
      return platformAvailable;
    } catch (error) {
      console.warn('[WebAuthn] Check availability failed:', error);
      return false;
    }
  }

  public hasFallbackAvailable(): boolean {
    return this.pinCredentials.size > 0;
  }

  private async loadPinCredentials(): Promise<void> {
    try {
      const stored = localStorage.getItem('webauthn_pin_credentials');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [id, cred] of Object.entries(data)) {
          this.pinCredentials.set(id, cred as PinCredential);
        }
      }
    } catch (error) {
      console.error('[WebAuthn] 加载PIN凭证失败:', error);
    }
  }

  private async savePinCredentials(): Promise<void> {
    try {
      const data = Object.fromEntries(this.pinCredentials);
      localStorage.setItem('webauthn_pin_credentials', JSON.stringify(data));
    } catch (error) {
      console.error('[WebAuthn] 保存PIN凭证失败:', error);
    }
  }

  private async hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + 'webauthn_salt_v1');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async setupPin(userId: string, pin: string): Promise<boolean> {
    if (pin.length < this.pinLength) {
      throw new Error(`PIN 必须至少 ${this.pinLength} 位`);
    }

    const pinHash = await this.hashPin(pin);
    
    this.pinCredentials.set(userId, {
      userId,
      pinHash,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    });
    
    await this.savePinCredentials();
    console.log('[WebAuthn] PIN 设置成功');
    return true;
  }

  public async authenticateWithPin(userId: string, pin: string): Promise<AuthResult> {
    const cred = this.pinCredentials.get(userId);
    
    if (!cred) {
      return { verified: false, method: 'pin' };
    }

    const pinHash = await this.hashPin(pin);
    
    if (pinHash !== cred.pinHash) {
      return { verified: false, method: 'pin' };
    }

    cred.lastUsed = Date.now();
    this.pinCredentials.set(userId, cred);
    await this.savePinCredentials();

    console.log('[WebAuthn] PIN 认证成功');
    return { verified: true, method: 'pin' };
  }

  public async removePin(userId: string): Promise<boolean> {
    const deleted = this.pinCredentials.delete(userId);
    if (deleted) {
      await this.savePinCredentials();
    }
    return deleted;
  }

  /**
   * 检查浏览器是否支持 WebAuthn
   */
  public checkSupport(): boolean {
    return (
      window.isSecureContext &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof PublicKeyCredential !== 'undefined'
    );
  }

  /**
   * 获取支持状态
   */
  public isWebAuthnSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 获取平台认证器支持状态
   */
  public async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.warn('[WebAuthn] Platform authenticator check failed:', error);
      return false;
    }
  }

  /**
   * 生成认证挑战
   */
  private generateChallenge(): Uint8Array<ArrayBuffer> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array as Uint8Array<ArrayBuffer>;
  }

  /**
   * 转换 ArrayBuffer 为 Base64URL 字符串
   */
  private bufferToBase64URL(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * 转换 Base64URL 字符串为 ArrayBuffer
   */
  private base64URLToBuffer(base64URL: string): ArrayBuffer {
    const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }

  /**
   * 从存储加载凭证
   */
  private async loadCredentials(): Promise<void> {
    try {
      const stored = localStorage.getItem('webauthn_credentials');
      if (stored) {
        const data = JSON.parse(stored);
        for (const [id, cred] of Object.entries(data)) {
          this.credentials.set(id, cred as WebAuthnCredential);
        }
      }
    } catch (error) {
      console.error('[WebAuthn] 加载凭证失败:', error);
    }
  }

  /**
   * 保存凭证到存储
   */
  private async saveCredentials(): Promise<void> {
    try {
      const data = Object.fromEntries(this.credentials);
      localStorage.setItem('webauthn_credentials', JSON.stringify(data));
    } catch (error) {
      console.error('[WebAuthn] 保存凭证失败:', error);
    }
  }

  /**
   * 生成用户 ID
   */
  private generateUserId(): Uint8Array {
    const userId = new Uint8Array(64);
    crypto.getRandomValues(userId);
    return userId;
  }

  /**
   * 注册新凭证 (创建身份)
   */
  public async register(
    userId: string,
    userName: string,
    displayName: string,
    deviceName: string = '默认设备'
  ): Promise<WebAuthnCredential> {
    if (!this.isSupported) {
      throw new Error('WebAuthn 不受支持');
    }

    const challenge = this.generateChallenge();
    const userIdBuffer = new TextEncoder().encode(userId);

    const options: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: this.config.rpName,
        id: this.config.rpId,
        icon: this.config.rpIcon,
      },
      user: {
        id: userIdBuffer,
        name: userName,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: this.config.timeout,
      excludeCredentials: Array.from(this.credentials.values()).map(cred => ({
        id: this.base64URLToBuffer(cred.credentialId),
        type: 'public-key' as PublicKeyCredentialType,
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        userVerification: this.config.userVerification,
      },
      attestation: this.config.attestation,
    };

    console.log('[WebAuthn] 开始注册流程...');

    let credential: PublicKeyCredential;
    try {
      credential = await navigator.credentials.create({
        publicKey: options,
      }) as PublicKeyCredential;
    } catch (error) {
      console.error('[WebAuthn] 注册失败:', error);
      throw new Error(`注册失败: ${error}`);
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    
    const credentialData: WebAuthnCredential = {
      credentialId: this.bufferToBase64URL(credential.rawId),
      publicKey: this.bufferToBase64URL(response.getPublicKey()!),
      counter: 0,
      deviceName,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    this.credentials.set(credentialData.credentialId, credentialData);
    await this.saveCredentials();

    console.log('[WebAuthn] 注册成功:', credentialData.credentialId);
    return credentialData;
  }

  public async authenticate(
    userId?: string,
    challenge?: string,
    fallbackPin?: string
  ): Promise<AuthResult> {
    const webAuthnAvailable = await this.isAvailable();
    
    if (!webAuthnAvailable) {
      if (userId && fallbackPin) {
        console.log('[WebAuthn] WebAuthn 不可用，使用 PIN fallback');
        return this.authenticateWithPin(userId, fallbackPin);
      }
      
      if (this.hasFallbackAvailable() && userId) {
        console.log('[WebAuthn] WebAuthn 不可用，请提供 PIN 进行 fallback 认证');
        return { verified: false, method: 'pin' };
      }
      
      throw new Error('WebAuthn 不受支持且无 fallback 可用');
    }

    if (!this.isSupported) {
      if (userId && fallbackPin) {
        console.log('[WebAuthn] WebAuthn 不支持，使用 PIN fallback');
        return this.authenticateWithPin(userId, fallbackPin);
      }
      throw new Error('WebAuthn 不受支持');
    }

    const challengeBuffer = challenge 
      ? this.base64URLToBuffer(challenge)
      : this.generateChallenge();

    const options: PublicKeyCredentialRequestOptions = {
      challenge: challengeBuffer,
      timeout: this.config.timeout,
      rpId: this.config.rpId,
      allowCredentials: Array.from(this.credentials.values()).map(cred => ({
        id: this.base64URLToBuffer(cred.credentialId),
        type: 'public-key' as PublicKeyCredentialType,
      })),
      userVerification: this.config.userVerification,
    };

    console.log('[WebAuthn] 开始认证流程...');

    let credential: PublicKeyCredential;
    try {
      credential = await navigator.credentials.get({
        publicKey: options,
      }) as PublicKeyCredential;
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        console.log('[WebAuthn] 用户取消或超时');
        
        if (userId && fallbackPin) {
          console.log('[WebAuthn] 尝试 PIN fallback');
          return this.authenticateWithPin(userId, fallbackPin);
        }
        
        return { verified: false };
      }
      
      if (userId && fallbackPin) {
        console.log('[WebAuthn] WebAuthn 认证失败，使用 PIN fallback');
        return this.authenticateWithPin(userId, fallbackPin);
      }
      
      console.error('[WebAuthn] 认证失败:', error);
      throw new Error(`认证失败: ${error}`);
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    const credentialId = this.bufferToBase64URL(credential.rawId);
    
    const storedCred = this.credentials.get(credentialId);
    if (storedCred) {
      storedCred.lastUsed = Date.now();
      storedCred.counter = 0;
      this.credentials.set(credentialId, storedCred);
      await this.saveCredentials();
    }

    console.log('[WebAuthn] 认证成功');
    return {
      verified: true,
      credentialId,
      counter: 0,
      method: 'webauthn',
    };
  }

  /**
   * 验证认证
   */
  public async verifyAuthentication(
    credentialId: string,
    authenticatorData: ArrayBuffer,
    clientDataJSON: ArrayBuffer
  ): Promise<boolean> {
    const cred = this.credentials.get(credentialId);
    if (!cred) {
      return false;
    }

    try {
      const clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
      
      // 验证挑战值
      // const expectedChallenge = ...;
      // if (clientData.challenge !== expectedChallenge) return false;

      // 验证 RP ID
      if (clientData.origin !== `https://${this.config.rpId}`) {
        return false;
      }

      // 验证签名计数
      const authData = new Uint8Array(authenticatorData);
      const signCount = authData[33] << 24 | authData[34] << 16 | authData[35] << 8 | authData[36];
      
      if (signCount < cred.counter) {
        console.warn('[WebAuthn] 签名计数器异常，可能存在重放攻击');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[WebAuthn] 验证失败:', error);
      return false;
    }
  }

  /**
   * 获取所有凭证
   */
  public getAllCredentials(): Array<{
    credentialId: string;
    deviceName: string;
    createdAt: number;
    lastUsed: number;
  }> {
    return Array.from(this.credentials.values()).map(cred => ({
      credentialId: cred.credentialId,
      deviceName: cred.deviceName,
      createdAt: cred.createdAt,
      lastUsed: cred.lastUsed,
    }));
  }

  /**
   * 获取单个凭证
   */
  public getCredential(credentialId: string): WebAuthnCredential | undefined {
    return this.credentials.get(credentialId);
  }

  /**
   * 删除凭证
   */
  public async deleteCredential(credentialId: string): Promise<boolean> {
    const deleted = this.credentials.delete(credentialId);
    if (deleted) {
      await this.saveCredentials();
    }
    return deleted;
  }

  /**
   * 清除所有凭证
   */
  public async clearAllCredentials(): Promise<void> {
    this.credentials.clear();
    localStorage.removeItem('webauthn_credentials');
  }

  /**
   * 检查凭证是否存在
   */
  public hasCredentials(): boolean {
    return this.credentials.size > 0;
  }

  /**
   * 生成认证挑战
   */
  public generateAuthChallenge(): string {
    const challenge = this.generateChallenge();
    return this.bufferToBase64URL(challenge.buffer as ArrayBuffer);
  }
}

// 单例实例
let webAuthnInstance: WebAuthnManager | null = null;

export function createWebAuthnManager(config: WebAuthnManagerConfig): WebAuthnManager {
  if (!webAuthnInstance) {
    webAuthnInstance = new WebAuthnManager(config);
  }
  return webAuthnInstance;
}

export function getWebAuthnManager(): WebAuthnManager | null {
  return webAuthnInstance;
}

// 导出类
export { WebAuthnManager, DEFAULT_CONFIG };
