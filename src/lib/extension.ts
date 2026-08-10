/**
 * Utilitaires pour communiquer avec l'extension Chrome
 */

export function isExtensionInstalled(): boolean {
  return typeof window !== "undefined" && 
         !!(window as any).chrome?.runtime?.id;
}

export function configureExtension(sessionId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isExtensionInstalled()) {
      resolve(false);
      return;
    }

    const sessionUrl = `${window.location.origin}/session/${sessionId}`;
    const apiUrl = `${window.location.origin}/api/receive-message`;
    const apiKey = "ai-session-live-2026-secret";

    (window as any).chrome.runtime.sendMessage({
      type: "AUTO_CONFIGURE",
      payload: {
        sessionUrl,
        apiUrl,
        apiKey,
        sessionId,
      },
    }, (response: { success: boolean }) => {
      resolve(response?.success || false);
    });
  });
}

export function openChatGPTWithCapture(sessionId: string): void {
  configureExtension(sessionId).then((success) => {
    if (success) {
      window.open("https://chatgpt.com", "_blank");
    } else {
      // Fallback: rediriger vers le Chrome Web Store
      window.open("https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID", "_blank");
    }
  });
}