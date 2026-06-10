console.log("[PinTrip extension] content script loaded", location.href);

chrome.runtime.sendMessage({
  type: "PINTRIP_IMPORTER_READY",
  payload: {
    url: location.href,
    loadedAt: new Date().toISOString()
  }
});

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== "PINTRIP_XHS_NOTE_CAPTURED") return;

  chrome.runtime.sendMessage({
    type: "PINTRIP_XHS_NOTE_CAPTURED",
    payload: event.data.payload
  });
});
