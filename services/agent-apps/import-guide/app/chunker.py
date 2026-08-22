import re


def chunk_text(content: str, chunk_size: int, overlap: int) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", content) if part.strip()]
    if not paragraphs:
        return []

    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs:
        if len(paragraph) > chunk_size:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(_split_long_text(paragraph, chunk_size, overlap))
            continue

        candidate = f"{current}\n\n{paragraph}" if current else paragraph
        if len(candidate) <= chunk_size:
            current = candidate
            continue

        chunks.append(current)
        prefix = current[-overlap:] if overlap else ""
        current = f"{prefix}\n\n{paragraph}" if prefix else paragraph

    if current:
        chunks.append(current)
    return chunks


def _split_long_text(content: str, chunk_size: int, overlap: int) -> list[str]:
    step = chunk_size - overlap
    return [content[start : start + chunk_size] for start in range(0, len(content), step)]
