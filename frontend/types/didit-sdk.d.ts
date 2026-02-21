/**
 * Type definitions for @didit-protocol/sdk-web
 */

// Configuration types
export interface DiditSdkConfiguration {
  /**
   * Enable SDK logging for debugging
   * @default false
   */
  loggingEnabled?: boolean;

  /**
   * Custom container element to mount the modal
   * @default document.body
   */
  containerElement?: HTMLElement;

  /**
   * Z-index for the modal overlay
   * @default 9999
   */
  zIndex?: number;

  /**
   * Show close button on modal
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Show exit confirmation dialog when closing
   * @default true
   */
  showExitConfirmation?: boolean;

  /**
   * Automatically close modal when verification completes
   * @default false
   */
  closeModalOnComplete?: boolean;

  /**
   * Render verification inline instead of modal overlay
   * @default false
   */
  embedded?: boolean;

  /**
   * Container element ID for embedded mode
   * Required when embedded is true
   */
  embeddedContainerId?: string;
}

// Verification result types
export type VerificationResult = 
  | {
      type: 'completed';
      session: {
        sessionId: string;
        status: 'Approved' | 'Pending' | 'Declined';
      };
    }
  | {
      type: 'cancelled';
      session: {
        sessionId: string;
        status: 'Pending';
      };
    }
  | {
      type: 'failed';
      error: {
        type: 'sessionExpired' | 'networkError' | 'cameraAccessDenied' | 'unknown';
        message: string;
      };
    };

// State types
export type DiditSdkState = 'idle' | 'loading' | 'ready' | 'error';

// Event types
export interface VerificationEvent {
  type: string;
  data?: {
    sessionId?: string;
    step?: string;
    nextStep?: string;
    previousStep?: string;
    status?: string;
    country?: string;
    documentType?: string;
    mediaType?: string;
    isAuto?: boolean;
    channel?: 'email' | 'sms' | 'whatsapp';
    codeSize?: number;
    error?: {
      type: string;
      message: string;
    };
  };
}

// Start verification options
export interface StartVerificationOptions {
  url: string;
  configuration?: DiditSdkConfiguration;
}

// Callback types
export type OnCompleteCallback = (result: VerificationResult) => void;
export type OnStateChangeCallback = (state: DiditSdkState, errorMsg?: string) => void;
export type OnEventCallback = (event: VerificationEvent) => void;

// DiditSdk instance interface
export interface DiditSdkInstance {
  onComplete: OnCompleteCallback | null;
  onStateChange: OnStateChangeCallback | null;
  onEvent: OnEventCallback | null;
  startVerification: (options: StartVerificationOptions) => void;
}

// DiditSdk class interface
export interface DiditSdkClass {
  shared: DiditSdkInstance;
}
