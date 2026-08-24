(function () {
  var toggle = document.getElementById('spideyToggle');
  var panel = document.getElementById('spideyPanel');
  var closeBtn = document.getElementById('spideyClose');
  var muteBtn = document.getElementById('spideyMute');
  var form = document.getElementById('spideyForm');
  var input = document.getElementById('spideyInput');
  var messagesEl = document.getElementById('spideyMessages');
  var typingEl = document.getElementById('spideyTyping');

  if (!toggle || !panel || !form || !input || !messagesEl) return;

  // ── Voice (browser text-to-speech) ─────────────────────────────────
  // Note: this uses the browser's built-in speech synthesis with a
  // deepened pitch for a "hero" feel. It reads Spidey's messages aloud
  // in a generic system voice — it does NOT clone or reproduce any
  // actor's or copyrighted character's actual voice.
  var synth = window.speechSynthesis || null;
  var muted = localStorage.getItem('spideyMuted') === '1';
  var chosenVoice = null;

  function updateMuteButton() {
    if (!muteBtn) return;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', muted ? "Unmute Spidey's voice" : "Mute Spidey's voice");
  }
  updateMuteButton();

  if (muteBtn) {
    muteBtn.addEventListener('click', function () {
      muted = !muted;
      localStorage.setItem('spideyMuted', muted ? '1' : '0');
      updateMuteButton();
      if (muted && synth) synth.cancel();
    });
  }

  function pickVoice() {
    if (!synth) return;
    var voices = synth.getVoices() || [];
    if (!voices.length) return;
    chosenVoice =
      voices.find(function (v) { return /male/i.test(v.name) && /en/i.test(v.lang); }) ||
      voices.find(function (v) { return /en/i.test(v.lang); }) ||
      voices[0];
  }

  if (synth) {
    pickVoice();
    synth.addEventListener('voiceschanged', pickVoice);
  }

  function speak(text, onStarted) {
    if (!synth || muted) return;
    synth.cancel();
    var utter = new SpeechSynthesisUtterance(text.replace(/[🕸️🕷️➤✕]/g, ''));
    if (chosenVoice) utter.voice = chosenVoice;
    utter.pitch = 0.75;  // deeper, heroic tone
    utter.rate = 1.02;
    utter.volume = 1;
    if (onStarted) utter.onstart = onStarted;
    synth.speak(utter);
  }

  // Some mobile browsers block speech that isn't triggered by a real user
  // gesture (a setTimeout-based auto-open doesn't count). If the welcome
  // line never actually starts, retry it the next time the user taps the
  // toggle themselves.
  var welcomeSpoken = false;

  // Conversation sent to the API (kept short + capped server-side too).
  var history = [];
  var opened = false;
  var busy = false;

  var WELCOME =
    "🕸️ Thwip! Welcome — I'm Spidey, Johara's site sidekick. " +
    "Ask me about his projects, skills, or how to get in touch — " +
    "I've got this whole portfolio webbed up.";

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'spidey-msg ' + (role === 'user' ? 'spidey-msg-user' : 'spidey-msg-bot');
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function openPanel() {
    panel.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('has-opened');
    if (!opened) {
      opened = true;
      addMessage('assistant', WELCOME);
    }
    if (!welcomeSpoken) {
      speak(WELCOME, function () { welcomeSpoken = true; });
    }
    input.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    if (panel.classList.contains('open')) {
      closePanel();
    } else {
      openPanel();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    setBusy(true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        var reply = result.ok && result.data && result.data.reply
          ? result.data.reply
          : "My spider-sense is a little fuzzy right now — try again in a sec, or hit the Contact section below!";
        addMessage('assistant', reply);
        history.push({ role: 'assistant', content: reply });
        speak(reply);
      })
      .catch(function () {
        addMessage('assistant', "Looks like my web snapped — connection trouble. Try again in a moment!");
      })
      .finally(function () {
        setBusy(false);
      });
  });

  function setBusy(state) {
    busy = state;
    input.disabled = state;
    if (typingEl) typingEl.hidden = !state;
    if (state) scrollToBottom();
  }

  // Auto-welcome shortly after the page loads.
  window.addEventListener('load', function () {
    setTimeout(openPanel, 1400);
  });
})();
