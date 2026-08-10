const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const sessionUrlInput = document.getElementById("sessionUrl");
const apiUrlInput = document.getElementById("apiUrl");
const apiKeyInput = document.getElementById("apiKey");
const toggleBtn = document.getElementById("toggleBtn");

// Valeurs par défaut pour l'environnement local
const DEFAULTS = {
  sessionUrl: "",
  apiUrl: "http://localhost:3000/api/receive-message",
  apiKey: "ai-session-live-2026-secret"
};

function extractSessionId(url) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/session\/([a-f0-9-]+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function setStatus(active) {
  if (active) {
    statusDot.classList.add("active");
    statusText.textContent = "Actif — capture en cours";
    toggleBtn.textContent = "Arrêter la capture";
    toggleBtn.className = "btn btn-stop";
  } else {
    statusDot.classList.remove("active");
    statusText.textContent = "Inactif";
    toggleBtn.textContent = "Démarrer la capture";
    toggleBtn.className = "btn btn-start";
  }
}

// Sauvegarde automatique pendant la saisie
function setupAutoSave() {
  const inputs = [sessionUrlInput, apiUrlInput, apiKeyInput];
  
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      chrome.storage.local.set({
        sessionUrl: sessionUrlInput.value,
        apiUrl: apiUrlInput.value,
        apiKey: apiKeyInput.value
      });
    });
  });
}

async function loadSettings() {
  const data = await chrome.storage.local.get([
    "sessionUrl",
    "apiUrl",
    "apiKey",
    "active",
    "sessionId",
    "userId",
  ]);

  // Utiliser les valeurs sauvegardées ou les défauts
  sessionUrlInput.value = data.sessionUrl || DEFAULTS.sessionUrl;
  apiUrlInput.value = data.apiUrl || DEFAULTS.apiUrl;
  apiKeyInput.value = data.apiKey || DEFAULTS.apiKey;
  
  setStatus(!!data.active);
  
  // Afficher l'info de session actuelle
  const sessionInfoDiv = document.getElementById("currentSessionInfo");
  const sessionIdDiv = document.getElementById("currentSessionId");
  
  if (data.sessionId) {
    sessionInfoDiv.style.display = "block";
    sessionIdDiv.textContent = data.sessionId;
  } else {
    sessionInfoDiv.style.display = "none";
  }
}

toggleBtn.addEventListener("click", async () => {
  const data = await chrome.storage.local.get(["active"]);

  if (data.active) {
    await chrome.storage.local.set({ active: false });
    setStatus(false);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "STOP_CAPTURE" }).catch(() => {});
    }
    return;
  }

  const sessionUrl = sessionUrlInput.value.trim();
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!sessionUrl || !apiUrl || !apiKey) {
    alert("Remplissez tous les champs avant de démarrer.");
    return;
  }

  const sessionId = extractSessionId(sessionUrl);
  if (!sessionId) {
    alert("URL de session invalide. Format attendu : http://localhost:3000/session/abc123");
    return;
  }

  // Générer ou récupérer un userId unique
  let userId = data.userId;
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
  }

  await chrome.storage.local.set({
    sessionUrl,
    apiUrl,
    apiKey,
    sessionId,
    userId,
    active: true,
  });

  setStatus(true);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" }).catch(() => {
      alert("Rechargez la page ChatGPT/Claude.ai puis réessayez.");
    });
  }
});

// Bouton de test d'injection
document.getElementById("testBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TEST_INJECTION" }).catch(() => {
      alert("Erreur: l'onglet actuel ne supporte pas l'injection. Allez sur ChatGPT d'abord.");
    });
  } else {
    alert("Aucun onglet actif trouvé.");
  }
});

// Bouton de test du bouton d'envoi
document.getElementById("testButtonBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TEST_BUTTON" }).catch(() => {
      alert("Erreur: l'onglet actuel ne supporte pas le test. Allez sur ChatGPT d'abord.");
    });
  } else {
    alert("Aucun onglet actif trouvé.");
  }
});

// Bouton pour effacer la session
document.getElementById("clearSessionBtn").addEventListener("click", async () => {
  if (confirm("Voulez-vous vraiment effacer la configuration de session ?")) {
    await chrome.storage.local.set({
      sessionUrl: "",
      sessionId: "",
      active: false
    });
    
    sessionUrlInput.value = "";
    setStatus(false);
    
    const sessionInfoDiv = document.getElementById("currentSessionInfo");
    sessionInfoDiv.style.display = "none";
    
    // Arrêter la capture sur tous les onglets
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: "STOP_CAPTURE" }).catch(() => {});
      }
    });
    
    alert("Session effacée. Configurez une nouvelle session.");
  }
});

loadSettings();
setupAutoSave();
