package com.aisuite.service;

import com.aisuite.dto.Models;
import com.aisuite.dto.Models.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SpeakingCoachService {
    private static final Map<String, String> SCENARIO_PROMPTS = Map.of(
            "interview", "You are a friendly HR interviewer conducting a job interview in English.",
            "restaurant", "You are a waiter at a casual restaurant.",
            "meeting", "You are a project manager running a team meeting.",
            "travel", "You are a helpful local at a tourist destination.",
            "daily", "You are a conversation partner for everyday English small talk."
    );

    private static final Map<String, String> OPENERS = Map.of(
            "interview", "Hello! Thanks for coming in today. Could you start by telling me a little about yourself?",
            "restaurant", "Good evening! Welcome to our restaurant. Are you ready to order?",
            "meeting", "Good morning, everyone. Let's get started. Any updates from your side?",
            "travel", "Hi there! Can I help you find something?",
            "daily", "Hey! Nice weather today, isn't it? What have you been up to lately?"
    );

    private final LlmClient llm;
    private final Map<String, SpeakingSession> sessions = new ConcurrentHashMap<>();

    public SpeakingCoachService(LlmClient llm) { this.llm = llm; }

    public SpeakingSession createSession(String scenario, String userLevel) {
        String id = UUID.randomUUID().toString();
        var session = new SpeakingSession(
                id, scenario, userLevel,
                List.of(new ChatMessage("assistant", OPENERS.getOrDefault(scenario, OPENERS.get("daily")))),
                Instant.now().toString()
        );
        sessions.put(id, session);
        return session;
    }

    public SpeakingSession getSession(String id) { return sessions.get(id); }

    public SpeakingChatResponse chat(String sessionId, String userMessage, boolean requestCorrection, boolean useLlm) {
        SpeakingSession session = sessions.get(sessionId);
        if (session == null) throw new NoSuchElementException("Session not found");

        List<ChatMessage> msgs = new ArrayList<>(session.messages());
        msgs.add(new ChatMessage("user", userMessage));
        String history = buildHistory(msgs);

        String system = SCENARIO_PROMPTS.getOrDefault(session.scenario(), SCENARIO_PROMPTS.get("daily"))
                + "\nStudent level: " + session.userLevel() + ".\n"
                + "Respond in JSON with keys: reply, corrections (array of {original, suggestion, reason, severity}), "
                + "pronunciation_score (0-100), pronunciation_feedback, encouragement.\n"
                + "Keep reply conversational and under 80 words.";
        if (!requestCorrection) system += "\nReturn empty corrections array.";

        String raw = llm.chat(List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", history)
        ), 0.8, true, useLlm);

        JsonNode data = llm.parseJson(raw);
        List<CorrectionItem> corrections = parseCorrections(data);
        String reply = data.path("reply").asText(raw);

        msgs.add(new ChatMessage("assistant", reply));
        sessions.put(sessionId, new SpeakingSession(session.sessionId(), session.scenario(), session.userLevel(), msgs, session.createdAt()));

        return new SpeakingChatResponse(
                reply, corrections,
                data.path("pronunciation_score").isMissingNode() ? null : data.path("pronunciation_score").asInt(),
                data.path("pronunciation_feedback").asText(null),
                data.path("encouragement").asText(null)
        );
    }

    public SpeakingSummaryResponse summarize(String sessionId, boolean useLlm) {
        SpeakingSession session = sessions.get(sessionId);
        if (session == null) throw new NoSuchElementException("Session not found");

        String history = buildHistory(session.messages());
        String system = "You are an English coach. Analyze the session. Return JSON: overall_score, strengths, improvements, key_phrases_learned, next_steps.";
        String raw = llm.chat(List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", history)
        ), 0.3, true, useLlm);

        JsonNode data = llm.parseJson(raw);
        long userTurns = session.messages().stream().filter(m -> "user".equals(m.role())).count();

        return new SpeakingSummaryResponse(
                data.path("overall_score").asInt(70),
                toStringList(data.path("strengths")),
                toStringList(data.path("improvements")),
                toStringList(data.path("key_phrases_learned")),
                data.path("next_steps").asText("Continue practicing."),
                Map.of("scenario", session.scenario(), "user_level", session.userLevel(),
                        "turn_count", userTurns, "total_messages", session.messages().size())
        );
    }

    private String buildHistory(List<ChatMessage> messages) {
        StringBuilder sb = new StringBuilder();
        int start = Math.max(0, messages.size() - 8);
        for (int i = start; i < messages.size(); i++) {
            ChatMessage m = messages.get(i);
            sb.append(m.role()).append(": ").append(m.content()).append("\n");
        }
        return sb.toString();
    }

    private List<CorrectionItem> parseCorrections(JsonNode data) {
        List<CorrectionItem> list = new ArrayList<>();
        if (!data.path("corrections").isArray()) return list;
        for (JsonNode c : data.path("corrections")) {
            String severity = c.path("severity").asText("minor").toLowerCase();
            if (!severity.equals("minor") && !severity.equals("major")) {
                severity = severity.equals("high") || severity.equals("critical") ? "major" : "minor";
            }
            try {
                list.add(new CorrectionItem(
                        c.path("original").asText(),
                        c.path("suggestion").asText(),
                        c.path("reason").asText(),
                        severity
                ));
            } catch (Exception ignored) {}
        }
        return list;
    }

    private List<String> toStringList(JsonNode arr) {
        if (!arr.isArray()) return List.of();
        List<String> out = new ArrayList<>();
        arr.forEach(n -> out.add(n.asText()));
        return out;
    }
}
