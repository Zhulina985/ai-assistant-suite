package com.aisuite.controller;

import com.aisuite.service.LlmClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class HealthController {
    private final LlmClient llm;

    public HealthController(LlmClient llm) { this.llm = llm; }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "llm_configured", llm.isAvailable(),
                "llm_last_error", llm.getLastError() == null ? "" : llm.getLastError(),
                "backend", "java",
                "services", List.of("speaking")
        );
    }
}
