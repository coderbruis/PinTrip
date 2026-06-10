const callbackUrl = "http://127.0.0.1:8080/api/plugin/xhs/import-callback";
const readyUrl = "http://127.0.0.1:8080/api/plugin/xhs/importer-ready";

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PINTRIP_IMPORTER_READY") {
    fetch(readyUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message.payload)
    }).catch(console.warn);
    return;
  }

  if (message.type !== "PINTRIP_XHS_NOTE_CAPTURED") return;

  fetch(callbackUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "xiaohongshu",
      importer: "pintrip-extension",
      pageUrl: message.payload?.url || "",
      capturedAt: message.payload?.capturedAt || new Date().toISOString(),
      note: message.payload?.noteCard || null,
      raw: message.payload?.response || null
    })
  }).catch(console.warn);
});
