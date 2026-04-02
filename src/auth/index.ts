/**
 * 认证模块导出
 */

export { 
  WebAuthnManager, 
  createWebAuthnManager, 
  getWebAuthnManager 
} from './WebAuthnManager';
export type {
  AuthenticatorTransport,
  PublicKeyCredentialCreationOptions,
  PublicKeyCredentialRequestOptions,
  WebAuthnCredential,
  WebAuthnManagerConfig,
} from './WebAuthnManager';

export { 
  BiometricWallet, 
  createBiometricWallet, 
  getBiometricWallet 
} from './BiometricWallet';
export type {
  KeyPair,
  WalletAccount,
  MnemonicData,
  WalletAddress,
  BiometricWalletConfig,
} from './BiometricWallet';

export { SoulAnchor } from './SoulAnchor';
export type { SoulAnchorProps } from './SoulAnchor';
