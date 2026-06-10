(() => {
  const seenNoteIds = new Set<string>();

  const shouldInspectUrl = (url: string) => url.includes("/api/sns/");
  const extractNoteCard = (response: any) =>
    response?.data?.items?.[0]?.note_card || response?.data?.note_card || response?.data?.note || null;

  const emit = (url: string, response: unknown, noteCard: any) => {
    const noteId = noteCard?.note_id || noteCard?.id;
    if (noteId && seenNoteIds.has(noteId)) return;
    if (noteId) seenNoteIds.add(noteId);

    window.postMessage(
      {
        type: "PINTRIP_XHS_NOTE_CAPTURED",
        payload: {
          url,
          response,
          noteCard,
          capturedAt: new Date().toISOString()
        }
      },
      "*"
    );
  };

  const inspect = async (url: string, response: Response) => {
    if (!shouldInspectUrl(url)) return;
    const json = await response.clone().json();
    const noteCard = extractNoteCard(json);
    if (noteCard) emit(url, json, noteCard);
  };

  const rawFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await rawFetch(...args);
    try {
      await inspect(String((args[0] as Request)?.url || args[0] || ""), response);
    } catch {}
    return response;
  };
})();
