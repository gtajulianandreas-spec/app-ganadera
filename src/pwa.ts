// PWA & Service Worker Registration + Install Prompt Manager

type InstallPromptListener = (canInstall: boolean) => void;

class PwaManager {
  private static instance: PwaManager;
  private deferredPrompt: any = null;
  private listeners: InstallPromptListener[] = [];
  private isInstalled = false;

  private constructor() {
    this.checkIfInstalled();
    this.setupListeners();
  }

  public static getInstance(): PwaManager {
    if (!PwaManager.instance) {
      PwaManager.instance = new PwaManager();
    }
    return PwaManager.instance;
  }

  public registerServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }
  }

  private setupListeners() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notifyListeners(false);
      console.log('[PWA] App successfully installed on device!');
    });
  }

  private checkIfInstalled() {
    // Check standalone mode in iOS Safari & Android Chrome
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    this.isInstalled = isStandalone;
  }

  public subscribe(listener: InstallPromptListener) {
    this.listeners.push(listener);
    listener(Boolean(this.deferredPrompt));
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(canInstall: boolean) {
    this.listeners.forEach(l => l(canInstall));
  }

  public async triggerInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.notifyListeners(false);
    return outcome === 'accepted';
  }

  public getInstalledStatus(): boolean {
    return this.isInstalled;
  }

  public isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  }
}

export const pwaManager = PwaManager.getInstance();
