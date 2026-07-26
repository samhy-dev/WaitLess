// Shared voice-announcement helpers used by the Voice Settings page (staff
// configures) and the JoinQueue page (customers hear the result).

export const DEFAULT_VOICE_MESSAGE =
  "Hi! Ticket number {number}, it's your turn now. Thank you for waiting!";

export const DEFAULT_VOICE_PREFS = {
  voice_uri: "", // empty = the device's default voice
  voice_rate: 0.95,
  voice_pitch: 1,
  voice_message: "", // empty = use DEFAULT_VOICE_MESSAGE
};

// Pull the staff's saved voice preferences off a Store record, falling back to
// sensible defaults.
export function prefsFromStore(store) {
  return {
    voice_uri: store?.voice_uri || DEFAULT_VOICE_PREFS.voice_uri,
    voice_rate:
      typeof store?.voice_rate === "number"
        ? store.voice_rate
        : DEFAULT_VOICE_PREFS.voice_rate,
    voice_pitch:
      typeof store?.voice_pitch === "number"
        ? store.voice_pitch
        : DEFAULT_VOICE_PREFS.voice_pitch,
    voice_message: store?.voice_message || DEFAULT_VOICE_PREFS.voice_message,
  };
}

// The list of speech-synthesis voices available on THIS device. (The device
// that actually plays the announcement decides which voices exist.)
export function getAvailableVoices() {
  try {
    return window.speechSynthesis?.getVoices() || [];
  } catch {
    return [];
  }
}

// The wording for a given ticket number. Uses the store's custom template
// (with {number} as a placeholder) if one is set, otherwise the default.
export function buildAnnouncement(ticketNumber, customTemplate) {
  const template =
    customTemplate && customTemplate.trim()
      ? customTemplate
      : DEFAULT_VOICE_MESSAGE;
  return template.replace(/\{number\}/g, ticketNumber);
}

// Speak `text` using the given preferences. Silently no-ops if speech isn't
// available — the chime + visual alert still play.
export function speakWithPrefs(text, prefs) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = prefs?.voice_rate ?? DEFAULT_VOICE_PREFS.voice_rate;
    u.pitch = prefs?.voice_pitch ?? DEFAULT_VOICE_PREFS.voice_pitch;
    const uri = prefs?.voice_uri;
    if (uri) {
      const v = getAvailableVoices().find((v) => v.voiceURI === uri);
      if (v) u.voice = v;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    // Speech not available — the chime + visual alert still show.
  }
}