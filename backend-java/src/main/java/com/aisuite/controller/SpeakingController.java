package com.aisuite.controller;

import com.aisuite.dto.Models.*;
import com.aisuite.service.SpeakingCoachService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/speaking")
public class SpeakingController {
    private final SpeakingCoachService service;

    public SpeakingController(SpeakingCoachService service) { this.service = service; }

    @GetMapping("/scenarios")
    public Map<String, Object> scenarios() {
        return Map.of("scenarios", List.of(
                Map.of("id", "interview", "name", "Job Interview", "name_zh", "面试"),
                Map.of("id", "restaurant", "name", "Restaurant", "name_zh", "点餐"),
                Map.of("id", "meeting", "name", "Meeting", "name_zh", "会议"),
                Map.of("id", "travel", "name", "Travel", "name_zh", "旅行"),
                Map.of("id", "daily", "name", "Daily Chat", "name_zh", "日常对话")
        ));
    }

    @PostMapping("/sessions")
    public SpeakingSession create(@RequestBody SpeakingSessionCreate req) {
        return service.createSession(
                req.scenario() == null ? "interview" : req.scenario(),
                req.userLevel() == null ? "intermediate" : req.userLevel()
        );
    }

    @GetMapping("/sessions/{id}")
    public SpeakingSession get(@PathVariable String id) {
        SpeakingSession s = service.getSession(id);
        if (s == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
        return s;
    }

    @PostMapping("/chat")
    public SpeakingChatResponse chat(@Valid @RequestBody SpeakingChatRequest req) {
        try {
            return service.chat(req.sessionId(), req.userMessage(), req.requestCorrection(), req.useLlm());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/summary")
    public SpeakingSummaryResponse summary(@Valid @RequestBody SpeakingSummaryRequest req) {
        try {
            return service.summarize(req.sessionId(), req.useLlm());
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/tts")
    public Map<String, String> tts(@RequestParam String text) {
        return Map.of("audio_base64", "", "format", "browser", "hint", "Use browser SpeechSynthesis");
    }

    @PostMapping("/transcribe")
    public Map<String, String> transcribe() {
        return Map.of("text", "[Demo STT] 当前仅支持文字输入，请直接在输入框打字");
    }
}
