const GROUPME_BOT_ID = "e67edce04193636cbdb4460de8";
const GROUPME_URL = "https://api.groupme.com/v3/bots/post";
const HOLD_TIME = 1000;
let holdTimer;

const popup = document.getElementById("popup");

function showPopup(text, isError = false) {
  popup.textContent = text;
  popup.style.background = isError ? "#c0392b" : "#333";
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 1000);
}

async function sendAlert(message) {
  const payload = { bot_id: GROUPME_BOT_ID, text: message };
  try {
    const response = await fetch(GROUPME_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) showPopup("✅ Message sent successfully!");
    else showPopup("❌ Failed to send message", true);
  } catch (error) {
    showPopup("⚠️ Network error", true);
  }
}

document.querySelectorAll(".alert-button").forEach(button => {
  const progress = button.querySelector(".progress");
  let startTime = 0;

  const startHold = (e) => {
    e.preventDefault();
    startTime = Date.now();
    holdTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / HOLD_TIME) * 100, 100);
      progress.style.width = percent + "%";
      if (elapsed >= HOLD_TIME) {
        clearInterval(holdTimer);
        progress.style.width = "100%";
        sendAlert(button.dataset.message);
      }
    }, 10);
  };

  const cancelHold = () => {
    clearInterval(holdTimer);
    progress.style.width = "0%";
  };

  button.addEventListener("mousedown", startHold);
  button.addEventListener("mouseup", cancelHold);
  button.addEventListener("mouseleave", cancelHold);
  button.addEventListener("touchstart", startHold, { passive: false });
  button.addEventListener("touchend", cancelHold);
  button.addEventListener("touchcancel", cancelHold);
});

// ✅ Register Service Worker (for PWA functionality)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });
}

// ---- Add to Home Screen (A2HS) prompt handling ----
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showPopup('✅ App installed');
  } else {
    showPopup('Install dismissed', true);
  }
  deferredPrompt = null;
  installBtn.style.display = 'none';
});
