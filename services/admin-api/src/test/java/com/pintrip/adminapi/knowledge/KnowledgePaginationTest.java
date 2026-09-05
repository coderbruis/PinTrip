package com.pintrip.adminapi.knowledge;

import com.pintrip.adminapi.knowledge.model.KnowledgeList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class KnowledgePaginationTest {
    private final KnowledgeRepository repository = mock(KnowledgeRepository.class);
    private final KnowledgeService service = new KnowledgeService(null, repository, null, null);

    @Test
    void forwardsCombinedFiltersAndPagination() {
        KnowledgeList result = new KnowledgeList(List.of(), 41, 3, 20);
        when(repository.search(3, 20, "成都", "offline", "operator")).thenReturn(result);
        assertSame(result, service.list(3, 20, " 成都 ", "offline", "operator"));
    }

    @Test
    void rejectsInvalidPaginationAndFiltersBeforeQuerying() {
        assertThrows(ResponseStatusException.class, () -> service.list(0, 8, "", "", ""));
        assertThrows(ResponseStatusException.class, () -> service.list(1, 0, "", "", ""));
        assertThrows(ResponseStatusException.class, () -> service.list(1, 101, "", "", ""));
        assertThrows(ResponseStatusException.class, () -> service.list(1, 8, "", "unknown", ""));
        assertThrows(ResponseStatusException.class, () -> service.list(1, 8, "", "", "unknown"));
        assertThrows(ResponseStatusException.class, () -> service.list(1, 8, "x".repeat(201), "", ""));
        verifyNoInteractions(repository);
    }
}
