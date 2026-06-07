package com.aisuite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public final class Models {
    private Models() {}

    public record ChatMessage(String role, String content) {}

    public record CorrectionItem(
            String original,
            String suggestion,
            String reason,
            @Pattern(regexp = "minor|major") String severity
    ) {}

    public record SpeakingSessionCreate(
            @JsonProperty(defaultValue = "interview") String scenario,
            @JsonProperty(defaultValue = "intermediate") String userLevel
    ) {}

    public record SpeakingSession(
            String sessionId,
            String scenario,
            String userLevel,
            List<ChatMessage> messages,
            String createdAt
    ) {}

    public record SpeakingChatRequest(
            @NotBlank String sessionId,
            @NotBlank String userMessage,
            @JsonProperty(defaultValue = "true") boolean requestCorrection,
            @JsonProperty(defaultValue = "true") boolean useLlm
    ) {}

    public record SpeakingChatResponse(
            String reply,
            List<CorrectionItem> corrections,
            Integer pronunciationScore,
            String pronunciationFeedback,
            String encouragement
    ) {}

    public record SpeakingSummaryRequest(
            @NotBlank String sessionId,
            @JsonProperty(defaultValue = "true") boolean useLlm
    ) {}

    public record RegisterRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            Long userId,
            String username,
            String role,
            boolean guest
    ) {}

    public record SpeakingSummaryResponse(
            int overallScore,
            List<String> strengths,
            List<String> improvements,
            List<String> keyPhrasesLearned,
            String nextSteps,
            Map<String, Object> sessionStats
    ) {}

    public static <T> List<T> listOf(T... items) {
        return List.of(items);
    }

    public static List<CorrectionItem> emptyCorrections() {
        return new ArrayList<>();
    }
}
