/**
 * 生物识别加密钱包
 * 使用 WebAuthn 作为认证机制，保护加密操作
 */

import { WebAuthnManager } from './WebAuthnManager';

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface WalletAccount {
  address: string;
  derivationPath: string;
  chainId: string;
  name?: string;
  balance?: number;
}

export interface MnemonicData {
  words: string[];
  path: string;
  createdAt: number;
}

export interface WalletAddress {
  chainId: string;
  address: string;
}

export interface BiometricWalletConfig {
  mnemonicStrength?: 128 | 256;
  chainIds?: string[];
  derivationPath?: string;
  algorithm?: 'ECDSA' | 'RSASSA';
}

const DEFAULT_CONFIG: Required<BiometricWalletConfig> = {
  mnemonicStrength: 256,
  chainIds: ['eth', 'sol', 'matic', 'bsc', 'avax', 'btc'],
  derivationPath: "m/44'/0'/0'/0/0",
  algorithm: 'ECDSA',
};

class BiometricWallet {
  private webAuthnManager: WebAuthnManager;
  private config: Required<BiometricWalletConfig>;
  private keyPairs: Map<string, KeyPair> = new Map();
  private authToken: string | null = null;

  constructor(webAuthnManager: WebAuthnManager, config: Partial<BiometricWalletConfig> = {}) {
    this.webAuthnManager = webAuthnManager;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.webAuthnManager.isWebAuthnSupported()) {
      throw new Error('WebAuthn 不受支持，无法创建生物识别钱包');
    }
  }

  /**
   * 创建新钱包
   */
  public async createWallet(userId: string, userName: string): Promise<{
    addresses: WalletAddress[];
    publicKey: string;
    rootPublicKey: string;
  }> {
    // 使用 WebAuthn 注册
    const credential = await this.webAuthnManager.register(
      userId,
      userName,
      `OMNIS Wallet - ${userName}`,
      `生物识别钱包`
    );

    // 生成根密钥对
    const rootKeyPair = await this.generateKeyPair();
    
    // 为每个链派生密钥对
    const addresses: WalletAddress[] = [];
    
    for (const chainId of this.config.chainIds) {
      const keyPair = await this.deriveKeyPair(rootKeyPair, chainId);
      this.keyPairs.set(chainId, keyPair);
      
      addresses.push({
        chainId,
        address: this.generateAddress(chainId, keyPair.publicKey),
      });
    }

    console.log('[BiometricWallet] 钱包创建成功:', addresses.length, '个地址');
    
    return {
      addresses,
      publicKey: credential.publicKey,
      rootPublicKey: await this.exportPublicKey(rootKeyPair.publicKey),
    };
  }

  /**
   * 解锁钱包
   */
  public async unlockWallet(): Promise<boolean> {
    try {
      const result = await this.webAuthnManager.authenticate();
      
      if (result.verified) {
        this.authToken = this.webAuthnManager.generateAuthChallenge();
        console.log('[BiometricWallet] 钱包已解锁');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[BiometricWallet] 解锁失败:', error);
      return false;
    }
  }

  /**
   * 锁定钱包
   */
  public lockWallet(): void {
    this.authToken = null;
    this.keyPairs.clear();
    console.log('[BiometricWallet] 钱包已锁定');
  }

  /**
   * 检查钱包是否已解锁
   */
  public isUnlocked(): boolean {
    return this.authToken !== null;
  }

  /**
   * 导出助记词
   */
  public async exportMnemonic(authToken: string): Promise<MnemonicData> {
    if (authToken !== this.authToken) {
      throw new Error('未授权');
    }

    const seed = await this.deriveSeedFromAuth();
    const words = this.generateMnemonicFromSeed(seed);
    
    return {
      words,
      path: this.config.derivationPath,
      createdAt: Date.now(),
    };
  }

  /**
   * 签名交易
   */
  public async signTransaction(
    authToken: string,
    chainId: string,
    txData: unknown
  ): Promise<{ signature: string; raw: string }> {
    if (authToken !== this.authToken) {
      throw new Error('未授权');
    }

    const privateKey = this.keyPairs.get(chainId);
    if (!privateKey) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    const txHash = await this.simulateSign(privateKey.privateKey, txData);
    
    return {
      signature: txHash,
      raw: JSON.stringify(txData),
    };
  }

  /**
   * 派生种子
   */
  private async deriveSeedFromAuth(): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.authToken);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
  }

  /**
   * 从种子生成助记词
   */
  private generateMnemonicFromSeed(seed: Uint8Array): string[] {
    const wordList = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
      'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
      'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
    ];
    
    const mnemonic: string[] = [];
    for (let i = 0; i < 24; i++) {
      const index = seed[i % seed.length] % wordList.length;
      mnemonic.push(wordList[index]);
    }
    
    return mnemonic;
  }

  /**
   * 模拟签名
   */
  private async simulateSign(privateKey: CryptoKey, txData: unknown): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(txData));
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.bufferToHex(hash);
  }

  /**
   * ArrayBuffer 转 Hex 字符串
   */
  private bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 生成密钥对
   */
  private async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * 派生密钥对
   */
  private async deriveKeyPair(rootKeyPair: KeyPair, chainId: string): Promise<KeyPair> {
    const encoder = new TextEncoder();
    const data = encoder.encode(chainId);
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    const importedKey = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    );

    return {
      publicKey: rootKeyPair.publicKey,
      privateKey: importedKey,
    };
  }

  /**
   * 导出公钥
   */
  private async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', publicKey);
    return this.bufferToHex(exported);
  }

  /**
   * 生成地址
   */
  private generateAddress(chainId: string, publicKey: CryptoKey): string {
    const patterns: Record<string, () => string> = {
      eth: () => '0x' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(2, 42),
      sol: () => this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(0, 44),
      matic: () => '0x' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(2, 42),
      bsc: () => '0x' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(2, 42),
      avax: () => '0x' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(2, 42),
      btc: () => '1' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(0, 33),
    };

    const generator = patterns[chainId] || (() => chainId + '_' + this.bufferToHex(publicKey as unknown as ArrayBuffer).slice(0, 40));
    return generator();
  }

  /**
   * 获取所有钱包地址
   */
  public getAllAddresses(): WalletAddress[] {
    return this.config.chainIds.map(chainId => ({
      chainId,
      address: this.keyPairs.has(chainId) 
        ? this.generateAddress(chainId, this.keyPairs.get(chainId)!.publicKey)
        : '',
    })).filter(addr => addr.address !== '');
  }

  /**
   * 验证地址格式
   */
  public validateAddress(chainId: string, address: string): boolean {
    const patterns: Record<string, RegExp> = {
      eth: /^0x[a-fA-F0-9]{40}$/,
      matic: /^0x[a-fA-F0-9]{40}$/,
      bsc: /^0x[a-fA-F0-9]{40}$/,
      avax: /^0x[a-fA-F0-9]{40}$/,
      sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
      btc: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
    };

    const pattern = patterns[chainId];
    if (!pattern) return true;

    return pattern.test(address);
  }

  /**
   * 加密数据
   */
  public async encryptData(data: string, chainId: string = 'eth'): Promise<string> {
    const keyPair = this.keyPairs.get(chainId);
    if (!keyPair) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyPair.privateKey,
      encodedData
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * 解密数据
   */
  public async decryptData(encryptedData: string, chainId: string = 'eth'): Promise<string> {
    const keyPair = this.keyPairs.get(chainId);
    if (!keyPair) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyPair.privateKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * 签名消息
   */
  public async signMessage(message: string, chainId: string = 'eth'): Promise<string> {
    const keyPair = this.keyPairs.get(chainId);
    if (!keyPair) {
      throw new Error(`不支持的链: ${chainId}`);
    }

    const encoder = new TextEncoder();
    const messageHash = await crypto.subtle.digest('SHA-256', encoder.encode(message));

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      keyPair.privateKey,
      messageHash
    );

    return this.bufferToHex(signature);
  }

  /**
   * 验证签名
   */
  public async verifySignature(
    message: string,
    signature: string,
    publicKey: CryptoKey
  ): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const messageHash = await crypto.subtle.digest('SHA-256', encoder.encode(message));
      const signatureBuffer = this.hexToBuffer(signature);

      return await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        signatureBuffer,
        messageHash
      );
    } catch (error) {
      console.warn('[BiometricWallet] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Hex 字符串转 ArrayBuffer
   */
  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }
}

// 单例实例
let walletInstance: BiometricWallet | null = null;

export function createBiometricWallet(
  webAuthnManager: WebAuthnManager,
  chainIds: string[] = DEFAULT_CONFIG.chainIds
): BiometricWallet {
  if (!walletInstance) {
    walletInstance = new BiometricWallet(webAuthnManager, { chainIds });
  }
  return walletInstance;
}

export function getBiometricWallet(): BiometricWallet | null {
  return walletInstance;
}

// 导出类
export { BiometricWallet, DEFAULT_CONFIG as walletConfig };
