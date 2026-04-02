/**
 * =============================================================================
 * 第三方库类型声明文件
 * Third-party Library Type Declarations
 * =============================================================================
 * 
 * 包含以下库的类型声明：
 * 1. @mediapipe/face_mesh - 人脸网格检测库
 * 2. @mediapipe/tasks-vision - MediaPipe 视觉任务库
 * 3. eventemitter3 - 事件发射器
 * 4. WebRTC 扩展类型
 * 5. Web Speech API 扩展
 * 6. WebAuthn 扩展类型
 * 7. WebTorrent 类型
 * 8. 其他浏览器 API 扩展
 */

// =============================================================================
// 1. @mediapipe/face_mesh - 人脸网格检测库
// =============================================================================

declare module '@mediapipe/face_mesh' {
  export interface FaceMeshOptions {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    selfieMode?: boolean;
  }

  export interface FaceMeshLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
    presence?: number;
  }

  export interface FaceMeshResults {
    multiFaceLandmarks?: FaceMeshLandmark[][];
    multiFaceGeometry?: FaceMeshGeometry[];
    image: HTMLCanvasElement | HTMLVideoElement | ImageBitmap;
  }

  export interface FaceMeshGeometry {
    getPoseTransformMatrix(): number[];
    getMesh(): Float32Array;
  }

  export interface FaceMeshConfig {
    locateFile?: (file: string, scriptUrl?: string) => string;
    onResults?: (results: FaceMeshResults) => void;
  }

  export class FaceMesh {
    constructor(config?: FaceMeshConfig);
    setOptions(options: FaceMeshOptions): Promise<void>;
    onResults(callback: (results: FaceMeshResults) => void): void;
    send(input: { image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap }): Promise<void>;
    close(): void;
    initialize(): Promise<void>;
  }

  export const FACEMESH_TESSELATION: [number, number][];
  export const FACEMESH_FACE_OVAL: [number, number][];
  export const FACEMESH_LIPS: [number, number][];
  export const FACEMESH_LEFT_EYE: [number, number][];
  export const FACEMESH_RIGHT_EYE: [number, number][];
  export const FACEMESH_LEFT_IRIS: [number, number][];
  export const FACEMESH_RIGHT_IRIS: [number, number][];
  export const FACEMESH_LEFT_EYEBROW: [number, number][];
  export const FACEMESH_RIGHT_EYEBROW: [number, number][];
  export const FACEMESH_NOSE: [number, number][];
  export const FACEMESH_CONTOURS: [number, number][];
}

// =============================================================================
// 2. @mediapipe/tasks-vision - MediaPipe 视觉任务库
// =============================================================================

declare module '@mediapipe/tasks-vision' {
  export interface FaceLandmarkerOptions {
    baseOptions: {
      modelAssetPath: string;
      delegate?: 'GPU' | 'CPU';
    };
    runningMode?: 'IMAGE' | 'VIDEO' | 'LIVE_STREAM';
    numFaces?: number;
    minFaceDetectionConfidence?: number;
    minFacePresenceConfidence?: number;
    minTrackingConfidence?: number;
    outputFaceBlendshapes?: boolean;
    outputFacialTransformationMatrixes?: boolean;
  }

  export interface FaceLandmarkerResult {
    faceLandmarks: NormalizedLandmark[][];
    faceBlendshapes?: FaceBlendshapes[];
    facialTransformationMatrixes?: number[][];
  }

  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
    presence?: number;
  }

  export interface FaceBlendshapes {
    categories: Category[];
  }

  export interface Category {
    index: number;
    score: number;
    categoryName: string;
    displayName: string;
  }

  export class FaceLandmarker {
    static createFromOptions(
      vision: Vision,
      options: FaceLandmarkerOptions
    ): Promise<FaceLandmarker>;
    detect(image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): FaceLandmarkerResult;
    detectForVideo(image: HTMLVideoElement, timestamp: number): FaceLandmarkerResult;
    detectForVideo(
      image: HTMLVideoElement,
      timestamp: number,
      callback: (result: FaceLandmarkerResult) => void
    ): void;
    close(): void;
  }

  export class Vision {
    static createFromOptions(options: unknown): Promise<Vision>;
  }

  export const FilesetResolver: {
    forVisionTasks(path: string): Promise<Vision>;
  };
}

// =============================================================================
// 3. eventemitter3 - 事件发射器
// =============================================================================

declare module 'eventemitter3' {
  export type EventHandler = (...args: unknown[]) => void;

  export interface EventEmitterStatic {
    new <T extends Record<string, EventHandler>>(): EventEmitter<T>;
  }

  export class EventEmitter<T = Record<string, EventHandler>> {
    static readonly EventEmitter: EventEmitterStatic;

    on<K extends keyof T>(
      event: K,
      fn: T[K],
      context?: unknown
    ): this;

    once<K extends keyof T>(
      event: K,
      fn: T[K],
      context?: unknown
    ): this;

    off<K extends keyof T>(
      event: K,
      fn?: T[K],
      context?: unknown,
      once?: boolean
    ): this;

    emit<K extends keyof T>(
      event: K,
      ...args: Parameters<T[K]>
    ): boolean;

    listeners<K extends keyof T>(event: K): T[K][];

    listenerCount<K extends keyof T>(event: K): number;

    removeAllListeners<K extends keyof T>(event?: K): this;

    eventNames(): (keyof T)[];

    hasListeners<K extends keyof T>(event: K): boolean;
  }

  export default EventEmitter;
}

// =============================================================================
// 4. WebRTC 扩展类型
// =============================================================================

declare global {
  interface RTCDataChannel {
    binaryType: 'arraybuffer' | 'blob';
    bufferedAmount: number;
    bufferedAmountLowThreshold: number;
    id: number | null;
    label: string;
    maxPacketLifeTime: number | null;
    maxRetransmits: number | null;
    negotiated: boolean;
    ordered: boolean;
    protocol: string;
    readyState: RTCDataChannelState;
    
    onbufferedamountlow: ((this: RTCDataChannel, ev: Event) => void) | null;
    onclose: ((this: RTCDataChannel, ev: Event) => void) | null;
    onerror: ((this: RTCDataChannel, ev: Event) => void) | null;
    onmessage: ((this: RTCDataChannel, ev: MessageEvent) => void) | null;
    onopen: ((this: RTCDataChannel, ev: Event) => void) | null;
    
    close(): void;
    send(data: string | Blob | ArrayBuffer | ArrayBufferView): void;
  }

  interface RTCDataChannelInit {
    ordered?: boolean;
    maxPacketLifeTime?: number;
    maxRetransmits?: number;
    protocol?: string;
    negotiated?: boolean;
    id?: number;
    priority?: RTCPriorityType;
    binaryType?: 'arraybuffer' | 'blob';
  }

  type RTCDataChannelState = 'connecting' | 'open' | 'closing' | 'closed';
  type RTCPriorityType = 'very-low' | 'low' | 'medium' | 'high';

  interface RTCPeerConnection {
    canTrickleIceCandidates: boolean | null;
    connectionState: RTCPeerConnectionState;
    currentLocalDescription: RTCSessionDescription | null;
    currentRemoteDescription: RTCSessionDescription | null;
    iceConnectionState: RTCIceConnectionState;
    iceGatheringState: RTCIceGatheringState;
    localDescription: RTCSessionDescription | null;
    pendingLocalDescription: RTCSessionDescription | null;
    pendingRemoteDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    sctp: RTCSctpTransport | null;
    
    onconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null;
    ondatachannel: ((this: RTCPeerConnection, ev: RTCDataChannelEvent) => void) | null;
    onicecandidate: ((this: RTCPeerConnection, ev: RTCPeerConnectionIceEvent) => void) | null;
    onicecandidateerror: ((this: RTCPeerConnection, ev: Event) => void) | null;
    oniceconnectionstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null;
    onicegatheringstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null;
    onnegotiationneeded: ((this: RTCPeerConnection, ev: Event) => void) | null;
    onsignalingstatechange: ((this: RTCPeerConnection, ev: Event) => void) | null;
    ontrack: ((this: RTCPeerConnection, ev: RTCTrackEvent) => void) | null;
    
    addIceCandidate(candidate: RTCIceCandidateInit | RTCIceCandidate): Promise<void>;
    addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
    addTransceiver(trackOrKind: MediaStreamTrack | string, init?: RTCRtpTransceiverInit): RTCRtpTransceiver;
    close(): void;
    createAnswer(): Promise<RTCSessionDescriptionInit>;
    createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    getConfiguration(): RTCConfiguration;
    getReceivers(): RTCRtpReceiver[];
    getSenders(): RTCRtpSender[];
    getStats(): Promise<RTCStatsReport>;
    getTransceivers(): RTCRtpTransceiver[];
    removeTrack(sender: RTCRtpSender): void;
    restartIce(): void;
    setConfiguration(configuration: RTCConfiguration): void;
    setLocalDescription(description: RTCSessionDescriptionInit): Promise<void>;
    setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void>;
  }

  interface RTCPeerConnectionIceEvent extends Event {
    candidate: RTCIceCandidate | null;
  }

  interface RTCDataChannelEvent extends Event {
    channel: RTCDataChannel;
  }

  interface RTCTrackEvent extends Event {
    receiver: RTCRtpReceiver;
    streams: MediaStream[];
    track: MediaStreamTrack;
    transceiver: RTCRtpTransceiver;
  }

  type RTCPeerConnectionState = 
    | 'closed' 
    | 'connected' 
    | 'connecting' 
    | 'disconnected' 
    | 'failed' 
    | 'new';

  type RTCIceConnectionState = 
    | 'checking' 
    | 'closed' 
    | 'completed' 
    | 'connected' 
    | 'disconnected' 
    | 'failed' 
    | 'new';

  type RTCIceGatheringState = 'complete' | 'gathering' | 'new';

  interface RTCIceCandidate {
    candidate: string;
    component: RTCIceComponent | null;
    foundation: string | null;
    ip: string | null;
    port: number | null;
    priority: number | null;
    protocol: RTCIceProtocol | null;
    relatedAddress: string | null;
    relatedPort: number | null;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
    tcpType: RTCIceTcpCandidateType | null;
    type: RTCIceCandidateType | null;
    usernameFragment: string | null;
    toJSON(): RTCIceCandidateInit;
  }

  interface RTCIceCandidateInit {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    usernameFragment?: string | null;
  }

  type RTCIceComponent = 'rtp' | 'rtcp';
  type RTCIceProtocol = 'tcp' | 'udp';
  type RTCIceTcpCandidateType = 'active' | 'passive' | 'so';
  type RTCIceCandidateType = 'host' | 'prflx' | 'relay' | 'srflx';

  interface RTCSessionDescription {
    sdp: string;
    type: RTCSdpType;
    toJSON(): RTCSessionDescriptionInit;
  }

  interface RTCSessionDescriptionInit {
    sdp?: string;
    type: RTCSdpType;
  }

  type RTCSdpType = 'answer' | 'offer' | 'pranswer' | 'rollback';

  interface RTCOfferOptions {
    iceRestart?: boolean;
    offerToReceiveAudio?: boolean;
    offerToReceiveVideo?: boolean;
    voiceActivityDetection?: boolean;
  }

  interface RTCConfiguration {
    bundlePolicy?: RTCBundlePolicy;
    certificates?: RTCCertificate[];
    iceCandidatePoolSize?: number;
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    peerIdentity?: string;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  }

  interface RTCIceServer {
    credential?: string;
    urls: string | string[];
    username?: string;
  }

  type RTCBundlePolicy = 'balanced' | 'max-bundle' | 'max-compat';
  type RTCIceTransportPolicy = 'all' | 'relay';
  type RTCRtcpMuxPolicy = 'negotiate' | 'require';

  interface RTCSctpTransport {
    maxChannels: number | null;
    maxMessageSize: number;
    state: RTCSctpTransportState;
    transport: RTCDtlsTransport;
  }

  type RTCSctpTransportState = 'closed' | 'connected' | 'connecting';

  interface RTCDtlsTransport {
    iceTransport: RTCIceTransport;
    state: RTCDtlsTransportState;
    getLocalParameters(): RTCDtlsParameters;
    getRemoteParameters(): RTCDtlsParameters | null;
  }

  type RTCDtlsTransportState = 'closed' | 'connected' | 'connecting' | 'failed' | 'new';

  interface RTCIceTransport {
    component: RTCIceComponent;
    state: RTCIceTransportState;
  }

  type RTCIceTransportState = 
    | 'checking' 
    | 'closed' 
    | 'completed' 
    | 'connected' 
    | 'disconnected' 
    | 'failed' 
    | 'new';

  interface RTCDtlsParameters {
    role: RTCDtlsRole;
    fingerprints: RTCDtlsFingerprint[];
  }

  type RTCDtlsRole = 'auto' | 'client' | 'server';
  
  interface RTCDtlsFingerprint {
    algorithm: string;
    value: string;
  }

  interface RTCRtpSender {
    dtmf: RTCDTMFSender | null;
    track: MediaStreamTrack | null;
    transport: RTCDtlsTransport | null;
    getParameters(): RTCRtpSendParameters;
    setParameters(parameters: RTCRtpSendParameters): Promise<void>;
    replaceTrack(withTrack: MediaStreamTrack | null): Promise<void>;
    getStats(): Promise<RTCStatsReport>;
  }

  interface RTCRtpReceiver {
    track: MediaStreamTrack;
    transport: RTCDtlsTransport | null;
    getParameters(): RTCRtpReceiveParameters;
    getStats(): Promise<RTCStatsReport>;
  }

  interface RTCRtpTransceiver {
    currentDirection: RTCRtpTransceiverDirection | null;
    direction: RTCRtpTransceiverDirection;
    mid: string | null;
    receiver: RTCRtpReceiver;
    sender: RTCRtpSender;
    stopped: boolean;
    stop(): void;
    setCodecPreferences(codecs: RTCRtpCodecCapability[]): void;
  }

  type RTCRtpTransceiverDirection = 'inactive' | 'recvonly' | 'sendonly' | 'sendrecv';

  interface RTCRtpTransceiverInit {
    direction?: RTCRtpTransceiverDirection;
    sendEncodings?: RTCRtpEncodingParameters[];
    streams?: MediaStream[];
  }

  interface RTCRtpSendParameters extends RTCRtpParameters {
    transactionId: string;
    encodings: RTCRtpEncodingParameters[];
  }

  interface RTCRtpReceiveParameters extends RTCRtpParameters {
    encodings: RTCRtpDecodingParameters[];
  }

  interface RTCRtpParameters {
    codecs: RTCRtpCodecParameters[];
    headerExtensions: RTCHeaderExtensionParameters[];
    rtcp: RTCRtcpParameters;
  }

  interface RTCRtpCodecParameters {
    channels?: number;
    clockRate: number;
    mimeType: string;
    payloadType: number;
    sdpFmtpLine?: string;
    scaleResolutionDownBy?: number;
  }

  interface RTCRtpCodecCapability {
    channels?: number;
    clockRate?: number;
    mimeType: string;
    sdpFmtpLine?: string;
  }

  interface RTCHeaderExtensionParameters {
    encrypted?: boolean;
    id: number;
    uri: string;
  }

  interface RTCRtcpParameters {
    cname?: string;
    reducedSize?: boolean;
  }

  interface RTCRtpEncodingParameters {
    active?: boolean;
    codecPayloadType?: number;
    dtx?: RTCDtxStatus;
    maxBitrate?: number;
    maxFramerate?: number;
    priority?: RTCPriorityType;
    rid?: string;
    scaleResolutionDownBy?: number;
  }

  interface RTCRtpDecodingParameters {
    rid?: string;
  }

  type RTCDtxStatus = 'disabled' | 'enabled';

  interface RTCStatsReport extends Map<string, RTCStats> {}

  interface RTCStats {
    id: string;
    timestamp: number;
    type: RTCStatsType;
  }

  type RTCStatsType = 
    | 'candidate-pair'
    | 'certificate'
    | 'codec'
    | 'data-channel'
    | 'inbound-rtp'
    | 'local-candidate'
    | 'media-source'
    | 'outbound-rtp'
    | 'peer-connection'
    | 'remote-candidate'
    | 'remote-inbound-rtp'
    | 'remote-outbound-rtp'
    | 'transport';

  interface RTCDTMFSender {
    canInsertDTMF: boolean;
    insertDTMF(tones: string, duration?: number, interToneGap?: number): void;
    ontonechange: ((this: RTCDTMFSender, ev: RTCDTMFToneChangeEvent) => void) | null;
  }

  interface RTCDTMFToneChangeEvent extends Event {
    tone: string;
  }

  interface RTCCertificate {
    expires: number;
    getFingerprints(): RTCDtlsFingerprint[];
  }
}

// =============================================================================
// 5. Web Speech API 扩展
// =============================================================================

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }

  interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    grammars: ISpeechGrammarList | null;
    
    onaudioend: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onaudiostart: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
    onnomatch: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
    onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
    onsoundend: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onsoundstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onspeechend: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onspeechstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
    onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
    
    abort(): void;
    start(): void;
    stop(): void;
  }

  interface ISpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: ISpeechRecognitionResultList;
  }

  interface ISpeechRecognitionResultList {
    length: number;
    item(index: number): ISpeechRecognitionResult;
    [index: number]: ISpeechRecognitionResult;
  }

  interface ISpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): ISpeechRecognitionAlternative;
    [index: number]: ISpeechRecognitionAlternative;
  }

  interface ISpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface ISpeechRecognitionErrorEvent extends Event {
    error: SpeechRecognitionErrorCode;
    message: string;
  }

  type SpeechRecognitionErrorCode = 
    | 'aborted'
    | 'audio-capture'
    | 'bad-grammar'
    | 'language-not-supported'
    | 'network'
    | 'no-speech'
    | 'not-allowed'
    | 'service-not-allowed';

  interface ISpeechGrammarList {
    length: number;
    item(index: number): ISpeechGrammar;
    [index: number]: ISpeechGrammar;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
  }

  interface ISpeechGrammar {
    src: string;
    weight: number;
  }

  interface SpeechSynthesisVoice {
    default: boolean;
    lang: string;
    localService: boolean;
    name: string;
    voiceURI: string;
  }

  interface SpeechSynthesis extends EventTarget {
    paused: boolean;
    pending: boolean;
    speaking: boolean;
    onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => void) | null;
    cancel(): void;
    getVoices(): SpeechSynthesisVoice[];
    pause(): void;
    resume(): void;
    speak(utterance: SpeechSynthesisUtterance): void;
  }

  interface SpeechSynthesisUtterance extends EventTarget {
    lang: string;
    pitch: number;
    rate: number;
    text: string;
    voice: SpeechSynthesisVoice | null;
    volume: number;
    
    onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
    onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
    onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => void) | null;
    onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
    onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
    onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
    onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => void) | null;
  }

  interface SpeechSynthesisEvent extends Event {
    charIndex: number;
    elapsedTime: number;
    name: string;
    utterance: SpeechSynthesisUtterance;
  }

  interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
    error: SpeechSynthesisErrorCode;
  }

  type SpeechSynthesisErrorCode = 
    | 'audio-busy'
    | 'audio-hardware'
    | 'canceled'
    | 'interrupted'
    | 'language-unavailable'
    | 'network'
    | 'not-allowed'
    | 'synthesis-failed'
    | 'synthesis-unavailable'
    | 'text-too-long'
    | 'voice-unavailable';

  interface Window {
    speechSynthesis: SpeechSynthesis;
  }
}

// =============================================================================
// 6. WebAuthn 扩展类型
// =============================================================================

declare global {
  interface PublicKeyCredential extends Credential {
    readonly authenticatorAttachment: AuthenticatorAttachment;
    readonly id: string;
    readonly rawId: ArrayBuffer;
    readonly response: AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
    readonly type: 'public-key';
    getClientExtensionResults(): AuthenticationExtensionsClientOutputs;
  }

  interface AuthenticatorAttestationResponse {
    readonly attestationObject: ArrayBuffer;
    readonly clientDataJSON: ArrayBuffer;
    getTransports(): AuthenticatorTransport[];
    getAuthenticatorData?(): ArrayBuffer;
    getPublicKey?(): ArrayBuffer | null;
    getPublicKeyAlgorithm?(): number;
  }

  interface AuthenticatorAssertionResponse {
    readonly authenticatorData: ArrayBuffer;
    readonly clientDataJSON: ArrayBuffer;
    readonly signature: ArrayBuffer;
    readonly userHandle: ArrayBuffer | null;
    getPublicKey?(): ArrayBuffer | null;
  }

  type AuthenticatorTransport = 'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb' | 'smart-card';
  type AuthenticatorAttachment = 'cross-platform' | 'platform';
  type ResidentKeyRequirement = 'discouraged' | 'preferred' | 'required';
  type UserVerificationRequirement = 'discouraged' | 'preferred' | 'required';
  type AttestationConveyancePreference = 'direct' | 'enterprise' | 'indirect' | 'none';

  interface PublicKeyCredentialCreationOptionsJSON {
    challenge: string;
    rp: PublicKeyCredentialRpEntity;
    user: PublicKeyCredentialUserEntityJSON;
    pubKeyCredParams: PubKeyCredParam[];
    timeout?: number;
    excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    attestation?: AttestationConveyancePreference;
    extensions?: AuthenticationExtensionsClientInputs;
  }

  interface PublicKeyCredentialRpEntity {
    id: string;
    name: string;
    icon?: string;
  }

  interface PublicKeyCredentialUserEntityJSON {
    id: string;
    name: string;
    displayName: string;
    icon?: string;
  }

  interface PubKeyCredParam {
    type: 'public-key';
    alg: number;
  }

  interface PublicKeyCredentialDescriptorJSON {
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }

  interface AuthenticatorSelectionCriteria {
    authenticatorAttachment?: AuthenticatorAttachment;
    residentKey?: ResidentKeyRequirement;
    requireResidentKey?: boolean;
    userVerification?: UserVerificationRequirement;
  }

  interface AuthenticationExtensionsClientInputs {
    appid?: string;
    appidExclude?: string;
    credProps?: boolean;
    hmacCreateSecret?: boolean;
    largeBlob?: LargeBlobSupportInput;
    payment?: PaymentOptions;
  }

  interface LargeBlobSupportInput {
    support?: 'preferred' | 'required';
    read?: boolean;
    write?: string;
  }

  interface PaymentOptions {
    isPayment: boolean;
  }

  interface AuthenticationExtensionsClientOutputs {
    appid?: boolean;
    appidExclude?: boolean;
    credProps?: CredentialPropertiesOutput;
    hmacCreateSecret?: boolean;
    largeBlob?: LargeBlobSupportOutput;
    payment?: PaymentOptions;
  }

  interface CredentialPropertiesOutput {
    rk?: boolean;
  }

  interface LargeBlobSupportOutput {
    supported?: boolean;
    written?: boolean;
    blob?: string;
  }

  interface PublicKeyCredentialRequestOptionsJSON {
    challenge: string;
    timeout?: number;
    rpId?: string;
    allowCredentials?: PublicKeyCredentialDescriptorJSON[];
    userVerification?: UserVerificationRequirement;
    extensions?: AuthenticationExtensionsClientInputs;
  }

  interface CredentialsContainer {
    create(options: CredentialCreationOptions): Promise<Credential | null>;
    get(options: CredentialRequestOptions): Promise<Credential | null>;
    preventSilentAccess(): Promise<void>;
  }

  interface CredentialCreationOptions {
    publicKey?: PublicKeyCredentialCreationOptions;
    signal?: AbortSignal;
  }

  interface CredentialRequestOptions {
    publicKey?: PublicKeyCredentialRequestOptions;
    signal?: AbortSignal;
    mediation?: CredentialMediationRequirement;
  }

  type CredentialMediationRequirement = 'conditional' | 'optional' | 'required' | 'silent';

  interface PublicKeyCredentialCreationOptions {
    challenge: BufferSource;
    rp: PublicKeyCredentialRpEntity;
    user: PublicKeyCredentialUserEntity;
    pubKeyCredParams: PubKeyCredParam[];
    timeout?: number;
    excludeCredentials?: PublicKeyCredentialDescriptor[];
    authenticatorSelection?: AuthenticatorSelectionCriteria;
    attestation?: AttestationConveyancePreference;
    extensions?: AuthenticationExtensionsClientInputs;
  }

  interface PublicKeyCredentialUserEntity extends PublicKeyCredentialUserEntityJSON {
    id: BufferSource;
  }

  interface PublicKeyCredentialDescriptor {
    id: BufferSource;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }

  interface PublicKeyCredentialRequestOptions {
    challenge: BufferSource;
    timeout?: number;
    rpId?: string;
    allowCredentials?: PublicKeyCredentialDescriptor[];
    userVerification?: UserVerificationRequirement;
    extensions?: AuthenticationExtensionsClientInputs;
  }
}

// =============================================================================
// 7. WebTorrent 类型
// =============================================================================

declare module 'webtorrent' {
  export interface WebTorrentOptions {
    announce?: string[];
    dht?: boolean | DHTOptions;
    tracker?: boolean | TrackerOptions;
    webSeeds?: string[];
    maxConns?: number;
    path?: string;
    store?: (chunkLength: number, storeOpts: unknown) => unknown;
  }

  export interface DHTOptions {
    bootstrap?: string[];
    host?: string;
    port?: number;
  }

  export interface TrackerOptions {
    announce?: string[];
    getAnnounceOpts?: () => Record<string, unknown>;
  }

  export interface TorrentOptions {
    announce?: string[];
    announceList?: string[][];
    urlList?: string[];
    getAnnounceOpts?: () => Record<string, unknown>;
    strategy?: 'sequential' | 'rarest';
    maxWebConns?: number;
    path?: string;
    store?: (chunkLength: number, storeOpts: unknown) => unknown;
    private?: boolean;
    name?: string;
    createdBy?: string;
    creationDate?: number;
    comment?: string;
  }

  export interface TorrentFile {
    name: string;
    path: string;
    length: number;
    offset: number;
    done: boolean;
    progress: number;
    downloaded: number;
    
    getBlob(callback?: (err: Error | null, blob: Blob) => void): void;
    getBlobURL(callback?: (err: Error | null, url: string) => void): void;
    getStream(opts?: { start?: number; end?: number }): Promise<ReadableStream>;
    getBuffer(callback?: (err: Error | null, buffer: Buffer) => void): void;
    emit(event: string, ...args: unknown[]): boolean;
    on(event: string, listener: (...args: unknown[]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
  }

  export interface Torrent {
    infoHash: string;
    name: string;
    files: TorrentFile[];
    pieces: number;
    downloaded: number;
    uploaded: number;
    downloadSpeed: number;
    uploadSpeed: number;
    progress: number;
    ratio: number;
    length: number;
    pieceLength: number;
    lastPieceLength: number;
    timeRemaining: number;
    received: number;
    created: number;
    createdBy: string | null;
    comment: string | null;
    ready: boolean;
    paused: boolean;
    done: boolean;
    path: string;
    maxWebConns: number;
    
    wires: Wire[];
    
    addPeer(peer: string | { host: string; port: number }): boolean;
    removePeer(peer: string | Wire): boolean;
    select(start: number, end: number, priority?: number, notify?: () => void): void;
    deselect(start: number, end: number, priority: number): void;
    critical(start: number, end: number): void;
    pause(): void;
    resume(): void;
    destroy(callback?: (err: Error | null) => void): void;
    
    emit(event: string, ...args: unknown[]): boolean;
    on(event: 'ready' | 'done' | 'error' | 'warning' | 'download' | 'upload' | 'wire' | 'noPeers' | 'peer', listener: (...args: unknown[]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
  }

  export interface Wire {
    peerId: string;
    peerIdBuffer: Buffer;
    type: string;
    addr: string;
    uploaded: number;
    downloaded: number;
    uploadSpeed: number;
    downloadSpeed: number;
    isSeeder: boolean;
    amChoking: boolean;
    amInterested: boolean;
    peerChoking: boolean;
    peerInterested: boolean;
    requests: unknown[];
    peerRequests: unknown[];
    extendedHandshake: Record<string, unknown>;
    extendedMapping: Record<string, unknown>;
    
    destroy(): void;
    setKeepAlive(enable: boolean): void;
    setTimeout(ms: number, unref?: boolean): void;
    use(Extension: new (wire: Wire) => unknown): void;
  }

  export default class WebTorrent {
    readonly torrentId: number;
    readonly torrents: Torrent[];
    readonly downloadSpeed: number;
    readonly uploadSpeed: number;
    readonly progress: number;
    readonly ratio: number;
    readonly destroyed: boolean;
    
    constructor(options?: WebTorrentOptions);
    
    add(
      torrentId: string | Buffer | ArrayBuffer,
      options?: TorrentOptions,
      callback?: (torrent: Torrent) => void
    ): Torrent;
    
    seed(
      input: string | string[] | File | File[] | Blob | Blob[] | Buffer | Buffer[],
      options?: TorrentOptions,
      callback?: (torrent: Torrent) => void
    ): Torrent;
    
    remove(torrentId: string | Torrent, callback?: (err: Error | null) => void): void;
    destroy(callback?: (err: Error | null) => void): void;
    get(torrentId: string): Torrent | null;
    
    emit(event: string, ...args: unknown[]): boolean;
    on(event: 'torrent' | 'error' | 'warning', listener: (...args: unknown[]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    off(event: string, listener: (...args: unknown[]) => void): this;
  }
}

// =============================================================================
// 8. 其他浏览器 API 扩展
// =============================================================================

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    permissions?: Permissions;
    clipboard?: Clipboard;
    credentials?: CredentialsContainer;
    storage: StorageManager;
    getBattery?: () => Promise<BatteryManager>;
    getGamepads?: () => (Gamepad | null)[];
    requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MIDIAccess>;
    serial?: Serial;
    usb?: USB;
    bluetooth?: Bluetooth;
    wakeLock?: WakeLock;
    gpu?: GPU;
    deviceMemory?: number;
  }

  interface NetworkInformation extends EventTarget {
    readonly downlink: number;
    readonly downlinkMax: number;
    readonly effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    readonly rtt: number;
    readonly saveData: boolean;
    readonly type: 'bluetooth' | 'cellular' | 'ethernet' | 'mixed' | 'none' | 'other' | 'unknown' | 'wifi' | 'wimax';
    onchange: ((this: NetworkInformation, ev: Event) => void) | null;
  }

  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
  }

  interface PermissionDescriptor {
    name: PermissionName;
    userVisibleOnly?: boolean;
    sysex?: boolean;
  }

  type PermissionName = 
    | 'accelerometer'
    | 'accessibility-events'
    | 'ambient-light-sensor'
    | 'background-sync'
    | 'camera'
    | 'clipboard-read'
    | 'clipboard-write'
    | 'geolocation'
    | 'gyroscope'
    | 'magnetometer'
    | 'microphone'
    | 'midi'
    | 'notifications'
    | 'payment-handler'
    | 'persistent-storage'
    | 'push'
    | 'screen-wake-lock'
    | 'storage-access'
    | 'top-level-storage-access'
    | 'window-management';

  interface PermissionStatus extends EventTarget {
    readonly state: PermissionState;
    onchange: ((this: PermissionStatus, ev: Event) => void) | null;
  }

  type PermissionState = 'denied' | 'granted' | 'prompt';

  interface Clipboard extends EventTarget {
    read(): Promise<ClipboardItems>;
    readText(): Promise<string>;
    write(data: ClipboardItems): Promise<void>;
    writeText(data: string): Promise<void>;
  }

  type ClipboardItems = ClipboardItem[];

  interface ClipboardItem {
    readonly types: string[];
    getType(type: string): Promise<Blob>;
  }

  interface ClipboardItemConstructor {
    new (data: Record<string, Blob | Promise<Blob>>, options?: { presentationStyle?: 'inline' | 'attachment' }): ClipboardItem;
  }

  interface BatteryManager extends EventTarget {
    readonly charging: boolean;
    readonly chargingTime: number;
    readonly dischargingTime: number;
    readonly level: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => void) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => void) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => void) | null;
  }

  interface Gamepad {
    readonly axes: number[];
    readonly buttons: GamepadButton[];
    readonly connected: boolean;
    readonly hapticActuators: GamepadHapticActuator[];
    readonly id: string;
    readonly index: number;
    readonly mapping: 'standard' | '';
    readonly timestamp: DOMHighResTimeStamp;
    readonly vibrationActuator: GamepadHapticActuator | null;
  }

  interface GamepadButton {
    readonly pressed: boolean;
    readonly touched: boolean;
    readonly value: number;
  }

  interface GamepadHapticActuator {
    readonly type: 'dual-rumble' | 'vibration';
    pulse(value: number, duration: number): Promise<boolean>;
    playEffect(type: string, params: GamepadEffectParameters): Promise<boolean>;
    reset(): Promise<boolean>;
  }

  interface GamepadEffectParameters {
    duration?: number;
    startDelay?: number;
    strongMagnitude?: number;
    weakMagnitude?: number;
  }

  interface GamepadEvent extends Event {
    readonly gamepad: Gamepad;
  }

  interface MIDIAccess extends EventTarget {
    readonly inputs: MIDIInputMap;
    readonly outputs: MIDIOutputMap;
    readonly sysexEnabled: boolean;
    onstatechange: ((this: MIDIAccess, ev: MIDIConnectionEvent) => void) | null;
  }

  interface MIDIInputMap extends Map<string, MIDIInput> {}
  interface MIDIOutputMap extends Map<string, MIDIOutput> {}

  interface MIDIPort extends EventTarget {
    readonly connection: 'closed' | 'open' | 'pending';
    readonly id: string;
    readonly manufacturer: string | null;
    readonly name: string | null;
    readonly state: 'connected' | 'disconnected';
    readonly type: 'input' | 'output';
    readonly version: string | null;
    onstatechange: ((this: MIDIPort, ev: MIDIConnectionEvent) => void) | null;
    open(): Promise<MIDIPort>;
    close(): Promise<MIDIPort>;
  }

  interface MIDIInput extends MIDIPort {
    onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => void) | null;
  }

  interface MIDIOutput extends MIDIPort {
    send(data: number[] | Uint8Array, timestamp?: DOMHighResTimeStamp): void;
    clear(): void;
  }

  interface MIDIConnectionEvent extends Event {
    readonly port: MIDIPort;
  }

  interface MIDIMessageEvent extends Event {
    readonly data: Uint8Array;
  }

  interface Serial extends EventTarget {
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
    onconnect: ((this: Serial, ev: Event) => void) | null;
    ondisconnect: ((this: Serial, ev: Event) => void) | null;
  }

  interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
  }

  interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialPort extends EventTarget {
    readonly readable: ReadableStream<Uint8Array> | null;
    readonly writable: WritableStream<Uint8Array> | null;
    open(options?: SerialOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
    setSignals(signals: SerialOutputSignals): Promise<void>;
    getSignals(): Promise<SerialInputSignals>;
    onconnect: ((this: SerialPort, ev: Event) => void) | null;
    ondisconnect: ((this: SerialPort, ev: Event) => void) | null;
  }

  interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: 'none' | 'even' | 'odd';
    bufferSize?: number;
    flowControl?: 'none' | 'hardware';
  }

  interface SerialPortInfo {
    usbVendorId?: number;
    usbProductId?: number;
  }

  interface SerialOutputSignals {
    dataTerminalReady?: boolean;
    requestToSend?: boolean;
    break?: boolean;
  }

  interface SerialInputSignals {
    dataCarrierDetect: boolean;
    clearToSend: boolean;
    ringIndicator: boolean;
    dataSetReady: boolean;
  }

  interface USB extends EventTarget {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
    onconnect: ((this: USB, ev: USBConnectionEvent) => void) | null;
    ondisconnect: ((this: USB, ev: USBConnectionEvent) => void) | null;
  }

  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
  }

  interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
    serialNumber?: string;
  }

  interface USBDevice {
    readonly configuration: USBConfiguration | null;
    readonly configurations: USBConfiguration[];
    readonly deviceClass: number;
    readonly deviceProtocol: number;
    readonly deviceSubclass: number;
    readonly deviceVersionMajor: number;
    readonly deviceVersionMinor: number;
    readonly deviceVersionSubminor: number;
    readonly manufacturerName: string | null;
    readonly productId: number;
    readonly productName: string | null;
    readonly serialNumber: string | null;
    readonly usbVersionMajor: number;
    readonly usbVersionMinor: number;
    readonly usbVersionSubminor: number;
    readonly vendorId: number;
    readonly opened: boolean;
    
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
    controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
    controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>;
    clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>;
    transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
    isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult>;
    isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult>;
    reset(): Promise<void>;
  }

  interface USBConfiguration {
    readonly configurationValue: number;
    readonly configurationName: string | null;
    readonly interfaces: USBInterface[];
  }

  interface USBInterface {
    readonly interfaceNumber: number;
    readonly alternate: USBAlternateInterface;
    readonly alternates: USBAlternateInterface[];
    readonly claimed: boolean;
  }

  interface USBAlternateInterface {
    readonly alternateSetting: number;
    readonly interfaceClass: number;
    readonly interfaceSubclass: number;
    readonly interfaceProtocol: number;
    readonly interfaceName: string | null;
    readonly endpoints: USBEndpoint[];
  }

  interface USBEndpoint {
    readonly endpointNumber: number;
    readonly direction: USBDirection;
    readonly type: USBEndpointType;
    readonly packetSize: number;
  }

  type USBDirection = 'in' | 'out';
  type USBEndpointType = 'bulk' | 'interrupt' | 'isochronous';

  interface USBControlTransferParameters {
    requestType: USBRequestType;
    recipient: USBRecipient;
    request: number;
    value: number;
    index: number;
  }

  type USBRequestType = 'standard' | 'class' | 'vendor';
  type USBRecipient = 'device' | 'interface' | 'endpoint' | 'other';

  interface USBInTransferResult {
    readonly data: DataView | null;
    readonly status: USBTransferStatus;
  }

  interface USBOutTransferResult {
    readonly bytesWritten: number;
    readonly status: USBTransferStatus;
  }

  interface USBIsochronousInTransferResult {
    readonly data: DataView | null;
    readonly packets: USBIsochronousInTransferPacket[];
  }

  interface USBIsochronousInTransferPacket {
    readonly bytesWritten: number;
    readonly data: DataView | null;
    readonly status: USBTransferStatus;
  }

  interface USBIsochronousOutTransferResult {
    readonly packets: USBIsochronousOutTransferPacket[];
  }

  interface USBIsochronousOutTransferPacket {
    readonly bytesWritten: number;
    readonly status: USBTransferStatus;
  }

  type USBTransferStatus = 'ok' | 'stall' | 'babble';

  interface USBConnectionEvent extends Event {
    readonly device: USBDevice;
  }

  interface Bluetooth extends EventTarget {
    getAvailability(): Promise<boolean>;
    requestDevice(options: RequestOptions): Promise<BluetoothDevice>;
    onavailabilitychanged: ((this: Bluetooth, ev: Event) => void) | null;
    readonly referringDevice: BluetoothDevice | null;
  }

  interface RequestOptions {
    acceptAllDevices?: boolean;
    filters?: BluetoothLEScanFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: BluetoothManufacturerDataFilter[];
    serviceData?: BluetoothServiceDataFilter[];
  }

  interface BluetoothManufacturerDataFilter {
    companyIdentifier: number;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
  }

  interface BluetoothServiceDataFilter {
    service: BluetoothServiceUUID;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
  }

  type BluetoothServiceUUID = string | number;

  interface BluetoothDevice extends EventTarget {
    readonly id: string;
    readonly name: string | null;
    readonly gatt: BluetoothRemoteGATTServer | null;
    readonly watchingAdvertisements: boolean;
    onadvertisementreceived: ((this: BluetoothDevice, ev: BluetoothAdvertisingEvent) => void) | null;
    ongattserverdisconnected: ((this: BluetoothDevice, ev: Event) => void) | null;
    watchAdvertisements(options?: WatchAdvertisementsOptions): Promise<void>;
    unwatchAdvertisements(): void;
  }

  interface WatchAdvertisementsOptions {
    signal?: AbortSignal;
  }

  interface BluetoothAdvertisingEvent extends Event {
    readonly device: BluetoothDevice;
    readonly name: string | null;
    readonly appearance: number | null;
    readonly rssi: number | null;
    readonly txPower: number | null;
    readonly manufacturerData: BluetoothManufacturerDataMap;
    readonly serviceData: BluetoothServiceDataMap;
    readonly uuids: BluetoothServiceUUID[];
  }

  interface BluetoothManufacturerDataMap {
    get(key: number): DataView;
    has(key: number): boolean;
  }

  interface BluetoothServiceDataMap {
    get(key: BluetoothServiceUUID): DataView;
    has(key: BluetoothServiceUUID): boolean;
  }

  interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    readonly device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService {
    readonly device: BluetoothDevice;
    readonly isPrimary: boolean;
    readonly uuid: string;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
  }

  type BluetoothCharacteristicUUID = string | number;

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    readonly service: BluetoothRemoteGATTService;
    readonly uuid: string;
    readonly properties: BluetoothCharacteristicProperties;
    readonly value: DataView | null;
    oncharacteristicvaluechanged: ((this: BluetoothRemoteGATTCharacteristic, ev: Event) => void) | null;
    getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
    getDescriptors(descriptor?: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  type BluetoothDescriptorUUID = string | number;

  interface BluetoothCharacteristicProperties {
    readonly broadcast: boolean;
    readonly read: boolean;
    readonly writeWithoutResponse: boolean;
    readonly write: boolean;
    readonly notify: boolean;
    readonly indicate: boolean;
    readonly authenticatedSignedWrites: boolean;
    readonly reliableWrite: boolean;
    readonly writableAuxiliaries: boolean;
  }

  interface BluetoothRemoteGATTDescriptor {
    readonly characteristic: BluetoothRemoteGATTCharacteristic;
    readonly uuid: string;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
  }

  interface WakeLock {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  }

  interface WakeLockSentinel extends EventTarget {
    readonly released: boolean;
    readonly type: 'screen';
    onrelease: ((this: WakeLockSentinel, ev: Event) => void) | null;
    release(): Promise<void>;
  }

  interface StorageManager {
    estimate(): Promise<StorageEstimate>;
    persist(): Promise<boolean>;
    persisted(): Promise<boolean>;
    getDirectory?: () => Promise<FileSystemDirectoryHandle>;
  }

  interface StorageEstimate {
    quota: number;
    usage: number;
    usageDetails?: Record<string, number>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
    resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
    keys(): AsyncIterableIterator<string>;
    values(): AsyncIterableIterator<FileSystemHandle>;
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
    [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string | { type: string; data?: BufferSource | Blob | string; position?: number; size?: number }): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface Performance {
    memory?: MemoryInfo;
    measureMemory?: () => Promise<MemoryMeasurement>;
  }

  interface MemoryInfo {
    readonly jsHeapSizeLimit: number;
    readonly totalJSHeapSize: number;
    readonly usedJSHeapSize: number;
  }

  interface MemoryMeasurement {
    bytes: number;
    breakdown?: MemoryBreakdownEntry[];
  }

  interface MemoryBreakdownEntry {
    bytes: number;
    attribution: string[];
    types: string[];
  }

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  }

  interface GPURequestAdapterOptions {
    powerPreference?: 'low-power' | 'high-performance';
    forceFallbackAdapter?: boolean;
  }

  interface GPUAdapter {
    readonly features: GPUSupportedFeatures;
    readonly limits: GPUSupportedLimits;
    readonly isFallbackAdapter: boolean;
    requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
    requestAdapterInfo(): Promise<GPUAdapterInfo>;
  }

  interface GPUAdapterInfo {
    readonly vendor: string;
    readonly architecture: string;
    readonly device: string;
    readonly description: string;
  }

  interface GPUSupportedFeatures {
    has(name: string): boolean;
    readonly size: number;
    keys(): IterableIterator<string>;
  }

  interface GPUSupportedLimits {
    maxTextureDimension1D: number;
    maxTextureDimension2D: number;
    maxTextureDimension3D: number;
    maxTextureArrayLayers: number;
    maxBindGroups: number;
    maxBindingsPerBindGroup: number;
    maxBufferSize: number;
    maxVertexBuffers: number;
    maxVertexAttributes: number;
  }

  interface GPUDeviceDescriptor {
    label?: string;
    requiredFeatures?: Iterable<string>;
    requiredLimits?: Record<string, number>;
    defaultQueue?: GPUQueueDescriptor;
  }

  interface GPUQueueDescriptor {
    label?: string;
  }

  type GPUTextureFormat = 'bgra8unorm' | 'rgba8unorm' | 'rgba16float' | 'r8unorm' | 'r16float' | 'rg8unorm' | 'rg16float' | 'rgba32float';

  interface GPUBindGroupEntry {
    binding: number;
    resource: GPUBindingResource;
  }

  type GPUBindingResource = GPUBufferBinding | GPUSampler | GPUTextureBinding | GPUExternalTexture;

  interface GPUBufferBinding {
    buffer: GPUBuffer;
    offset?: number;
    size?: number;
  }

  interface GPUSampler {
    label: string;
  }

  interface GPUTextureBinding {
    texture: GPUTexture;
  }

  interface GPUExternalTexture {
    label: string;
  }

  interface GPUBuffer {
    label: string;
    readonly size: number;
    readonly usage: GPUBufferUsageFlags;
    readonly mapState: GPUBufferMapState;
    mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<void>;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    unmap(): void;
    destroy(): void;
  }

  type GPUBufferMapState = 'mapped' | 'pending' | 'unmapped';

  interface GPUBufferUsage {
    MAP_READ: number;
    MAP_WRITE: number;
    COPY_SRC: number;
    COPY_DST: number;
    INDEX: number;
    VERTEX: number;
    UNIFORM: number;
    STORAGE: number;
    INDIRECT: number;
    QUERY_RESOLVE: number;
  }

  type GPUBufferUsageFlags = number;

  type GPUMapModeFlags = number;

  interface GPUMapMode {
    READ: number;
    WRITE: number;
  }

  interface GPUDevice {
    label: string;
    readonly features: GPUSupportedFeatures;
    readonly limits: GPUSupportedLimits;
    readonly queue: GPUQueue;
    readonly lost: Promise<GPUDeviceLostInfo>;
    destroy(): void;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
    createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
    createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
    createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>;
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
    createRenderPipelineAsync(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline>;
    createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
    createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;
    createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
    pushErrorScope(filter: GPUErrorFilter): void;
    popErrorScope(): Promise<GPUError | null>;
  }

  interface GPUBufferDescriptor {
    label?: string;
    size: number;
    usage: GPUBufferUsageFlags;
    mappedAtCreation?: boolean;
  }

  interface GPUTextureDescriptor {
    label?: string;
    size: GPUExtent3D;
    mipLevelCount?: number;
    sampleCount?: number;
    dimension?: GPUTextureDimension;
    format: GPUTextureFormat;
    usage: GPUTextureUsageFlags;
    viewFormats?: Iterable<GPUTextureFormat>;
  }

  type GPUTextureDimension = '1d' | '2d' | '3d';

  interface GPUExtent3D {
    width: number;
    height?: number;
    depthOrArrayLayers?: number;
  }

  type GPUTextureUsageFlags = number;

  interface GPUSamplerDescriptor {
    label?: string;
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUMipmapFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    compare?: GPUCompareFunction;
    maxAnisotropy?: number;
  }

  type GPUAddressMode = 'clamp-to-edge' | 'mirror-repeat' | 'repeat';
  type GPUFilterMode = 'linear' | 'nearest';
  type GPUMipmapFilterMode = 'linear' | 'nearest';
  type GPUCompareFunction = 'always' | 'equal' | 'greater' | 'greater-equal' | 'less' | 'less-equal' | 'never' | 'not-equal';

  interface GPUBindGroupLayoutDescriptor {
    label?: string;
    entries: Iterable<GPUBindGroupLayoutEntry>;
  }

  interface GPUBindGroupLayoutEntry {
    binding: number;
    visibility: GPUShaderStageFlags;
    buffer?: GPUBufferBindingLayout;
    sampler?: GPUSamplerBindingLayout;
    texture?: GPUTextureBindingLayout;
    storageTexture?: GPUStorageTextureBindingLayout;
    externalTexture?: GPUExternalTextureBindingLayout;
  }

  type GPUShaderStageFlags = number;

  interface GPUBufferBindingLayout {
    type?: GPUBufferBindingType;
    hasDynamicOffset?: boolean;
    minBindingSize?: number;
  }

  type GPUBufferBindingType = 'uniform' | 'storage' | 'read-only-storage';

  interface GPUSamplerBindingLayout {
    type?: GPUSamplerBindingType;
  }

  type GPUSamplerBindingType = 'comparison' | 'filtering' | 'non-filtering';

  interface GPUTextureBindingLayout {
    sampleType?: GPUTextureSampleType;
    viewDimension?: GPUTextureViewDimension;
    multisampled?: boolean;
  }

  type GPUTextureSampleType = 'depth' | 'float' | 'sint' | 'uint' | 'unfilterable-float';
  type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | '3d' | 'cube' | 'cube-array';

  interface GPUStorageTextureBindingLayout {
    access?: GPUStorageTextureAccess;
    format: GPUTextureFormat;
    viewDimension?: GPUTextureViewDimension;
  }

  type GPUStorageTextureAccess = 'read-only' | 'write-only';

  interface GPUExternalTextureBindingLayout {}

  interface GPUBindGroupDescriptor {
    label?: string;
    layout: GPUBindGroupLayout;
    entries: Iterable<GPUBindGroupEntry>;
  }

  interface GPUBindGroupLayout {
    label: string;
  }

  interface GPUBindGroup {
    label: string;
  }

  interface GPUPipelineLayoutDescriptor {
    label?: string;
    bindGroupLayouts: Iterable<GPUBindGroupLayout>;
  }

  interface GPUPipelineLayout {
    label: string;
  }

  interface GPUShaderModuleDescriptor {
    label?: string;
    code: string;
    sourceMap?: unknown;
  }

  interface GPUShaderModule {
    label: string;
    getCompilationInfo(): Promise<GPUCompilationInfo>;
  }

  interface GPUCompilationInfo {
    messages: GPUCompilationMessage[];
  }

  interface GPUCompilationMessage {
    message: string;
    type: GPUCompilationMessageType;
    lineNum: number;
    linePos: number;
    offset: number;
    length: number;
  }

  type GPUCompilationMessageType = 'error' | 'info' | 'warning';

  interface GPUComputePipelineDescriptor {
    label?: string;
    layout?: GPUPipelineLayout | 'auto';
    compute: GPUProgrammableStage;
  }

  interface GPUProgrammableStage {
    module: GPUShaderModule;
    entryPoint: string;
    constants?: Record<string, number>;
  }

  interface GPUComputePipeline {
    label: string;
    readonly layout: GPUPipelineLayout;
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }

  interface GPURenderPipelineDescriptor {
    label?: string;
    layout?: GPUPipelineLayout | 'auto';
    vertex: GPUVertexState;
    primitive?: GPUPrimitiveState;
    depthStencil?: GPUDepthStencilState;
    multisample?: GPUMultisampleState;
    fragment?: GPUFragmentState;
  }

  interface GPUVertexState {
    module: GPUShaderModule;
    entryPoint: string;
    constants?: Record<string, number>;
    buffers?: Iterable<GPUVertexBufferLayout>;
  }

  interface GPUVertexBufferLayout {
    arrayStride: number;
    stepMode?: GPUVertexStepMode;
    attributes: Iterable<GPUVertexAttribute>;
  }

  type GPUVertexStepMode = 'instance' | 'vertex';

  interface GPUVertexAttribute {
    format: GPUVertexFormat;
    offset: number;
    shaderLocation: number;
  }

  type GPUVertexFormat = 'float32' | 'float32x2' | 'float32x3' | 'float32x4' | 'sint32' | 'sint32x2' | 'sint32x3' | 'sint32x4' | 'uint32' | 'uint32x2' | 'uint32x3' | 'uint32x4';

  interface GPUPrimitiveState {
    topology?: GPUPrimitiveTopology;
    stripIndexFormat?: GPUIndexFormat;
    frontFace?: GPUFrontFace;
    cullMode?: GPUCullMode;
    unclippedDepth?: boolean;
  }

  type GPUPrimitiveTopology = 'line-list' | 'line-strip' | 'point-list' | 'triangle-list' | 'triangle-strip';
  type GPUIndexFormat = 'uint16' | 'uint32';
  type GPUFrontFace = 'ccw' | 'cw';
  type GPUCullMode = 'back' | 'front' | 'none';

  interface GPUDepthStencilState {
    format: GPUTextureFormat;
    depthWriteEnabled?: boolean;
    depthCompare?: GPUCompareFunction;
    stencilFront?: GPUStencilFaceState;
    stencilBack?: GPUStencilFaceState;
    stencilReadMask?: number;
    stencilWriteMask?: number;
    depthBias?: number;
    depthBiasSlopeScale?: number;
    depthBiasClamp?: number;
  }

  interface GPUStencilFaceState {
    compare?: GPUCompareFunction;
    failOp?: GPUStencilOperation;
    depthFailOp?: GPUStencilOperation;
    passOp?: GPUStencilOperation;
  }

  type GPUStencilOperation = 'decrement-clamp' | 'decrement-wrap' | 'increment-clamp' | 'increment-wrap' | 'invert' | 'keep' | 'replace' | 'zero';

  interface GPUMultisampleState {
    count?: number;
    mask?: number;
    alphaToCoverageEnabled?: boolean;
  }

  interface GPUFragmentState {
    module: GPUShaderModule;
    entryPoint: string;
    constants?: Record<string, number>;
    targets: Iterable<GPUColorTargetState>;
  }

  interface GPUColorTargetState {
    format: GPUTextureFormat;
    blend?: GPUBlendState;
    writeMask?: GPUColorWriteFlags;
  }

  interface GPUBlendState {
    color: GPUBlendComponent;
    alpha: GPUBlendComponent;
  }

  interface GPUBlendComponent {
    operation?: GPUBlendOperation;
    srcFactor?: GPUBlendFactor;
    dstFactor?: GPUBlendFactor;
  }

  type GPUBlendOperation = 'add' | 'max' | 'min' | 'reverse-subtract' | 'subtract';
  type GPUBlendFactor = 'constant' | 'dst' | 'dst-alpha' | 'one' | 'one-minus-constant' | 'one-minus-dst' | 'one-minus-dst-alpha' | 'one-minus-src' | 'one-minus-src-alpha' | 'src' | 'src-alpha' | 'src-alpha-saturated' | 'zero';
  type GPUColorWriteFlags = number;

  interface GPURenderPipeline {
    label: string;
    readonly layout: GPUPipelineLayout;
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }

  interface GPUCommandEncoderDescriptor {
    label?: string;
  }

  interface GPUCommandEncoder {
    label: string;
    beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
    copyBufferToTexture(source: GPUImageCopyBuffer, destination: GPUImageCopyTexture, copySize: GPUExtent3D): void;
    copyTextureToBuffer(source: GPUImageCopyTexture, destination: GPUImageCopyBuffer, copySize: GPUExtent3D): void;
    copyTextureToTexture(source: GPUImageCopyTexture, destination: GPUImageCopyTexture, copySize: GPUExtent3D): void;
    clearBuffer(buffer: GPUBuffer, offset?: number, size?: number): void;
    resolveQuerySet(querySet: GPUQuerySet, firstQuery: number, queryCount: number, destination: GPUBuffer, destinationOffset: number): void;
    finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
  }

  interface GPUComputePassDescriptor {
    label?: string;
  }

  interface GPUComputePassEncoder {
    label: string;
    setPipeline(pipeline: GPUComputePipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: Iterable<number>): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsetsData: Uint32Array, dynamicOffsetsDataStart: number, dynamicOffsetsDataLength: number): void;
    dispatchWorkgroups(x: number, y?: number, z?: number): void;
    dispatch(x: number, y?: number, z?: number): void;
    dispatchIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    end(): void;
    endPass(): void;
    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
  }

  interface GPURenderBundleEncoderDescriptor {
    label?: string;
    colorFormats: Iterable<GPUTextureFormat>;
    depthStencilFormat?: GPUTextureFormat;
    sampleCount?: number;
    depthReadOnly?: boolean;
    stencilReadOnly?: boolean;
  }

  interface GPURenderBundleEncoder {
    label: string;
    finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
  }

  interface GPURenderBundleDescriptor {
    label?: string;
  }

  interface GPURenderBundle {
    label: string;
  }

  interface GPUQuerySetDescriptor {
    label?: string;
    type: GPUQueryType;
    count: number;
  }

  type GPUQueryType = 'occlusion' | 'timestamp';

  interface GPUQuerySet {
    label: string;
    readonly type: GPUQueryType;
    readonly count: number;
    destroy(): void;
  }

  type GPUErrorFilter = 'internal' | 'out-of-memory' | 'validation';

  interface GPUError {
    message: string;
  }

  interface GPUDeviceLostInfo {
    message: string;
    reason?: GPUDeviceLostReason;
  }

  type GPUDeviceLostReason = 'destroyed';

  interface GPUCommandBufferDescriptor {
    label?: string;
  }

  interface GPUCommandBuffer {
    label: string;
  }

  interface GPUQueue {
    label: string;
    submit(commandBuffers: Iterable<GPUCommandBuffer>): void;
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: BufferSource, dataOffset?: number, size?: number): void;
    writeTexture(destination: GPUImageCopyTexture, data: BufferSource, dataLayout: GPUImageDataLayout, size: GPUExtent3D): void;
    copyExternalImageToTexture(source: GPUImageCopyExternalImageSource, destination: GPUImageCopyExternalImageDestination, copySize: GPUExtent3D): void;
    onSubmittedWorkDone(): Promise<void>;
  }

  interface GPUImageCopyBuffer {
    buffer: GPUBuffer;
    offset?: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
  }

  interface GPUImageCopyTexture {
    texture: GPUTexture;
    mipLevel?: number;
    origin?: GPUOrigin3D;
    aspect?: GPUTextureAspect;
  }

  type GPUTextureAspect = 'all' | 'depth-only' | 'stencil-only';

  interface GPUOrigin3D {
    x?: number;
    y?: number;
    z?: number;
  }

  interface GPUImageDataLayout {
    offset?: number;
    bytesPerRow?: number;
    rowsPerImage?: number;
  }

  interface GPUImageCopyExternalImageSource {
    source: ImageBitmap | HTMLCanvasElement | OffscreenCanvas;
    origin?: GPUOrigin2D;
    flipY?: boolean;
  }

  interface GPUImageCopyExternalImageDestination {
    texture: GPUTexture;
    mipLevel?: number;
    origin?: GPUOrigin3D;
    aspect?: GPUTextureAspect;
    colorSpace?: PredefinedColorSpace;
    premultipliedAlpha?: boolean;
  }

  interface GPUOrigin2D {
    x?: number;
    y?: number;
  }

  type PredefinedColorSpace = 'display-p3' | 'srgb';

  interface GPUTexture {
    label: string;
    readonly width: number;
    readonly height: number;
    readonly depthOrArrayLayers: number;
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    readonly dimension: GPUTextureDimension;
    readonly format: GPUTextureFormat;
    readonly usage: GPUTextureUsageFlags;
    createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
    destroy(): void;
  }

  interface GPUTextureViewDescriptor {
    label?: string;
    format?: GPUTextureFormat;
    dimension?: GPUTextureViewDimension;
    aspect?: GPUTextureAspect;
    baseMipLevel?: number;
    mipLevelCount?: number;
    baseArrayLayer?: number;
    arrayLayerCount?: number;
  }

  interface GPUTextureView {
    label: string;
  }

  interface GPURenderPassDescriptor {
    label?: string;
    colorAttachments: Iterable<GPURenderPassColorAttachment>;
    depthStencilAttachment?: GPURenderPassDepthStencilAttachment;
    occlusionQuerySet?: GPUQuerySet;
    maxDrawCount?: number;
  }

  interface GPURenderPassColorAttachment {
    view: GPUTextureView;
    resolveTarget?: GPUTextureView;
    clearValue?: GPUColor;
    loadOp: GPULoadOp;
    storeOp: GPUStoreOp;
  }

  type GPUColor = [number, number, number, number] | { r: number; g: number; b: number; a: number };

  type GPULoadOp = 'clear' | 'load';
  type GPUStoreOp = 'discard' | 'store';

  interface GPURenderPassDepthStencilAttachment {
    view: GPUTextureView;
    depthClearValue?: number;
    depthLoadOp?: GPULoadOp;
    depthStoreOp?: GPUStoreOp;
    depthReadOnly?: boolean;
    stencilClearValue?: number;
    stencilLoadOp?: GPULoadOp;
    stencilStoreOp?: GPUStoreOp;
    stencilReadOnly?: boolean;
  }

  interface GPURenderPassEncoder {
    label: string;
    setPipeline(pipeline: GPURenderPipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: Iterable<number>): void;
    setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number, size?: number): void;
    setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: number, size?: number): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
    drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
    executeBundles(bundles: Iterable<GPURenderBundle>): void;
    end(): void;
    endPass(): void;
    setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
    setScissorRect(x: number, y: number, width: number, height: number): void;
    setBlendConstant(color: GPUColor): void;
    setStencilReference(reference: number): void;
    beginOcclusionQuery(queryIndex: number): void;
    endOcclusionQuery(): void;
    pushDebugGroup(groupLabel: string): void;
    popDebugGroup(): void;
    insertDebugMarker(markerLabel: string): void;
  }

  interface AbortSignal extends EventTarget {
    readonly aborted: boolean;
    readonly reason: unknown;
    onabort: ((this: AbortSignal, ev: Event) => void) | null;
    throwIfAborted(): void;
    static abort(reason?: unknown): AbortSignal;
    static timeout(ms: number): AbortSignal;
    static any(signals: AbortSignal[]): AbortSignal;
  }

  interface AbortController {
    readonly signal: AbortSignal;
    abort(reason?: unknown): void;
  }

  interface EventSource extends EventTarget {
    readonly url: string;
    readonly readyState: number;
    readonly withCredentials: boolean;
    onopen: ((this: EventSource, ev: Event) => void) | null;
    onmessage: ((this: EventSource, ev: MessageEvent) => void) | null;
    onerror: ((this: EventSource, ev: Event) => void) | null;
    close(): void;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSED: 2;
  }

  interface Notification extends EventTarget {
    readonly title: string;
    readonly dir: NotificationDirection;
    readonly lang: string;
    readonly body: string;
    readonly tag: string;
    readonly image: string;
    readonly icon: string;
    readonly badge: string;
    readonly vibrate: number[];
    readonly timestamp: number;
    readonly renotify: boolean;
    readonly silent: boolean;
    readonly requireInteraction: boolean;
    readonly data: unknown;
    readonly actions: NotificationAction[];
    onclick: ((this: Notification, ev: Event) => void) | null;
    onclose: ((this: Notification, ev: Event) => void) | null;
    onerror: ((this: Notification, ev: Event) => void) | null;
    onshow: ((this: Notification, ev: Event) => void) | null;
    close(): void;
    static readonly permission: NotificationPermission;
    static requestPermission(): Promise<NotificationPermission>;
    static maxActions: number;
  }

  type NotificationPermission = 'default' | 'denied' | 'granted';
  type NotificationDirection = 'auto' | 'ltr' | 'rtl';

  interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
  }

  interface NotificationOptions {
    dir?: NotificationDirection;
    lang?: string;
    body?: string;
    tag?: string;
    image?: string;
    icon?: string;
    badge?: string;
    vibrate?: number | number[];
    timestamp?: number;
    renotify?: boolean;
    silent?: boolean;
    requireInteraction?: boolean;
    data?: unknown;
    actions?: NotificationAction[];
  }

  interface ServiceWorkerRegistration extends EventTarget {
    readonly active: ServiceWorker | null;
    readonly installing: ServiceWorker | null;
    readonly waiting: ServiceWorker | null;
    readonly navigationPreload: NavigationPreloadManager;
    readonly pushManager: PushManager;
    readonly scope: string;
    readonly sync: SyncManager | null;
    readonly periodicSync?: PeriodicSyncManager | null;
    onupdatefound: ((this: ServiceWorkerRegistration, ev: Event) => void) | null;
    getNotifications(filter?: GetNotificationOptions): Promise<Notification[]>;
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
    update(): Promise<void>;
    unregister(): Promise<boolean>;
  }

  interface GetNotificationOptions {
    tag?: string;
  }

  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }

  interface PeriodicSyncManager {
    register(tag: string, options?: { minInterval?: number }): Promise<void>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
  }

  interface NavigationPreloadManager {
    enable(): Promise<void>;
    disable(): Promise<void>;
    setHeaderValue(value: string): Promise<void>;
    getState(): Promise<NavigationPreloadState>;
  }

  interface NavigationPreloadState {
    enabled: boolean;
    headerValue?: string;
  }

  interface PushManager {
    readonly supportedContentEncodings: string[];
    getSubscription(): Promise<PushSubscription | null>;
    permissionState(options?: PushSubscriptionOptionsInit): Promise<PushPermissionState>;
    subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
  }

  type PushPermissionState = 'denied' | 'granted' | 'prompt';

  interface PushSubscriptionOptionsInit {
    applicationServerKey?: BufferSource;
    userVisibleOnly?: boolean;
  }

  interface PushSubscription {
    readonly endpoint: string;
    readonly expirationTime: number | null;
    readonly options: PushSubscriptionOptions;
    getKey(name: PushEncryptionKeyName): ArrayBuffer | null;
    toJSON(): PushSubscriptionJSON;
    unsubscribe(): Promise<boolean>;
  }

  interface PushSubscriptionOptions {
    readonly applicationServerKey: ArrayBuffer | null;
    readonly userVisibleOnly: boolean;
  }

  type PushEncryptionKeyName = 'auth' | 'p256dh';

  interface PushSubscriptionJSON {
    endpoint: string;
    expirationTime: number | null;
    keys: Record<string, string>;
  }

  interface ServiceWorker extends EventTarget {
    readonly scriptURL: string;
    readonly state: ServiceWorkerState;
    onerror: ((this: ServiceWorker, ev: ErrorEvent) => void) | null;
    onstatechange: ((this: ServiceWorker, ev: Event) => void) | null;
    postMessage(message: unknown, transfer?: Transferable[]): void;
  }

  type ServiceWorkerState = 'activated' | 'activating' | 'installed' | 'installing' | 'parsed' | 'redundant';

  interface Navigator {
    deviceMemory?: number;
    ml?: ML;
  }

  interface ML {
    createContext(options?: { deviceType?: string; powerPreference?: string }): Promise<MLContext>;
    createModel(modelType: string): Promise<MLModel>;
  }

  interface MLContext {
    destroy(): void;
  }

  interface MLModel {
    compile(options?: unknown): Promise<void>;
    predict(input: unknown): Promise<unknown>;
  }

  interface GamepadHapticActuator {
    playEffect(type: string, params: GamepadEffectParameters): Promise<GamepadHapticResult>;
    pulse(value: number, duration: number): Promise<boolean>;
    reset(): Promise<boolean>;
  }

  interface GamepadHapticResult {
    successful: boolean;
  }

  interface Gamepad {
    vibrationActuator: GamepadHapticActuator | null;
  }

  interface GPUComputePassEncoder {
    dispatchWorkgroups(x: number, y?: number, z?: number): void;
    end(): void;
  }

  interface FileReaderSync {
    readAsArrayBuffer(blob: Blob): ArrayBuffer;
    readAsText(blob: Blob): string;
    readAsDataURL(blob: Blob): string;
  }

  interface Window {
    FileReaderSync: {
      prototype: FileReaderSync;
      new(): FileReaderSync;
    };
    webkitAudioContext: typeof AudioContext;
  }

  interface GlobalThis {
    gc?: () => void;
  }
}

declare module '@/governance/DAOSystem' {
  interface Bill {
    expiresAt?: number;
  }
}

export {};
