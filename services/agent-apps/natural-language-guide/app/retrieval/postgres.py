import threading

import psycopg
from pgvector import Vector
from pgvector.psycopg import register_vector
from psycopg.types.json import Jsonb

from .models import GuideChunk, GuideChunkMatch, GuideSearchQuery, IndexedGuide
from .ports import EmbeddingProvider


class PostgresGuideStore:
    """PostgreSQL + pgvector adapter for indexing, search, and hydration."""

    def __init__(
        self,
        database_url: str,
        embeddings: EmbeddingProvider,
        embedding_dimensions: int,
    ):
        if not database_url:
            raise ValueError("database_url must not be empty")
        if embedding_dimensions < 1:
            raise ValueError("embedding_dimensions must be at least 1")
        self._database_url = database_url
        self._embeddings = embeddings
        self._embedding_dimensions = embedding_dimensions
        self._schema_ready = False
        self._schema_lock = threading.Lock()

    def replace_guide(self, guide: IndexedGuide) -> int:
        self._ensure_schema()
        vectors = self._embeddings.embed_documents(
            [chunk.content for chunk in guide.chunks]
        )
        if len(vectors) != len(guide.chunks):
            raise ValueError("embedding provider returned an unexpected vector count")
        self._validate_vectors(vectors)

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO pintrip_user_guides (
                    user_id, guide_id, revision, destination, payload, is_active
                ) VALUES (%s, %s, %s, %s, %s, TRUE)
                ON CONFLICT (user_id, guide_id) DO UPDATE SET
                    revision = EXCLUDED.revision,
                    destination = EXCLUDED.destination,
                    payload = EXCLUDED.payload,
                    is_active = TRUE,
                    updated_at = NOW()
                """,
                (
                    guide.user_id,
                    guide.guide_id,
                    guide.revision,
                    guide.destination,
                    Jsonb(guide.payload),
                ),
            )
            connection.execute(
                "DELETE FROM pintrip_guide_chunks WHERE user_id = %s AND guide_id = %s",
                (guide.user_id, guide.guide_id),
            )
            rows = [
                (
                    chunk.chunk_id,
                    guide.user_id,
                    guide.guide_id,
                    guide.revision,
                    chunk.chunk_type,
                    chunk.destination,
                    chunk.place,
                    chunk.content,
                    Vector(vector),
                )
                for chunk, vector in zip(guide.chunks, vectors, strict=True)
            ]
            if rows:
                with connection.cursor() as cursor:
                    cursor.executemany(
                        """
                        INSERT INTO pintrip_guide_chunks (
                            chunk_id, user_id, guide_id, revision, chunk_type,
                            destination, place, content, embedding
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        rows,
                    )
        return len(rows)

    def search(self, query: GuideSearchQuery) -> list[GuideChunkMatch]:
        self._ensure_schema()
        vector = self._embeddings.embed_query(query.text)
        self._validate_vectors([vector])
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT chunks.chunk_id,
                       1 - (chunks.embedding <=> %s) AS score
                FROM pintrip_guide_chunks AS chunks
                JOIN pintrip_user_guides AS guides
                  ON guides.user_id = chunks.user_id
                 AND guides.guide_id = chunks.guide_id
                WHERE chunks.user_id = %s
                  AND guides.is_active = TRUE
                  AND chunks.destination = %s
                ORDER BY chunks.embedding <=> %s
                LIMIT %s
                """,
                (
                    Vector(vector),
                    query.user_id,
                    query.destination,
                    Vector(vector),
                    query.limit,
                ),
            ).fetchall()
        return [
            GuideChunkMatch(chunk_id=str(row[0]), score=float(row[1])) for row in rows
        ]

    def find_accessible_chunks(
        self, user_id: str, chunk_ids: list[str]
    ) -> list[GuideChunk]:
        if not chunk_ids:
            return []
        self._ensure_schema()
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT chunks.chunk_id, chunks.guide_id, chunks.chunk_type,
                       chunks.content, chunks.destination, chunks.place
                FROM pintrip_guide_chunks AS chunks
                JOIN pintrip_user_guides AS guides
                  ON guides.user_id = chunks.user_id
                 AND guides.guide_id = chunks.guide_id
                WHERE chunks.user_id = %s
                  AND chunks.chunk_id = ANY(%s::uuid[])
                  AND guides.is_active = TRUE
                """,
                (user_id, chunk_ids),
            ).fetchall()
        return [
            GuideChunk(
                chunk_id=str(row[0]),
                guide_id=row[1],
                chunk_type=row[2],
                content=row[3],
                destination=row[4],
                place=row[5],
            )
            for row in rows
        ]

    def _ensure_schema(self) -> None:
        if self._schema_ready:
            return
        with self._schema_lock:
            if self._schema_ready:
                return
            with psycopg.connect(self._database_url) as connection:
                connection.execute("CREATE EXTENSION IF NOT EXISTS vector")
                register_vector(connection)
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS pintrip_user_guides (
                        user_id TEXT NOT NULL,
                        guide_id TEXT NOT NULL,
                        revision INTEGER NOT NULL CHECK (revision > 0),
                        destination TEXT NOT NULL,
                        payload JSONB NOT NULL,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        PRIMARY KEY (user_id, guide_id)
                    )
                    """
                )
                connection.execute(
                    f"""
                    CREATE TABLE IF NOT EXISTS pintrip_guide_chunks (
                        chunk_id UUID PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        guide_id TEXT NOT NULL,
                        revision INTEGER NOT NULL,
                        chunk_type TEXT NOT NULL,
                        destination TEXT NOT NULL,
                        place TEXT,
                        content TEXT NOT NULL,
                        embedding vector({self._embedding_dimensions}) NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        FOREIGN KEY (user_id, guide_id)
                            REFERENCES pintrip_user_guides (user_id, guide_id)
                            ON DELETE CASCADE
                    )
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS pintrip_guide_chunks_scope_idx
                    ON pintrip_guide_chunks (user_id, destination)
                    """
                )
                connection.execute(
                    """
                    CREATE INDEX IF NOT EXISTS pintrip_guide_chunks_embedding_idx
                    ON pintrip_guide_chunks
                    USING hnsw (embedding vector_cosine_ops)
                    """
                )
            self._schema_ready = True

    def _connect(self) -> psycopg.Connection:
        connection = psycopg.connect(self._database_url)
        register_vector(connection)
        return connection

    def _validate_vectors(self, vectors: list[list[float]]) -> None:
        invalid = next(
            (
                len(vector)
                for vector in vectors
                if len(vector) != self._embedding_dimensions
            ),
            None,
        )
        if invalid is not None:
            raise ValueError(
                "embedding dimension mismatch: "
                f"expected {self._embedding_dimensions}, received {invalid}"
            )
