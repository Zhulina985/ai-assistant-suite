package com.aisuite.service;

import com.aisuite.config.AiSuiteProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LlmClient {
    private static final Logger log = LoggerFactory.getLogger(LlmClient.class);
    private static final Set<String> PLACEHOLDER_KEYS = Set.of("", "sk-your-key-here", "your-api-key", "sk-xxx");

    private final AiSuiteProperties props;
    private final ObjectMapper mapper;
    private final HttpClient http;
    private final boolean apiAvailable;
    private String lastError;

    public LlmClient(AiSuiteProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
        String key = props.getOpenaiApiKey() == null ? "" : props.getOpenaiApiKey().trim();
        this.apiAvailable = !key.isEmpty() && !PLACEHOLDER_KEYS.contains(key);
    }

    public boolean isAvailable() { return apiAvailable; }
    public String getLastError() { return lastError; }

    public String chat(List<Map<String, String>> messages, double temperature, boolean jsonMode, boolean useModel) {
        if (!useModel || !apiAvailable) return fallback(messages);
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", props.getOpenaiModel());
            body.put("messages", messages);
            body.put("temperature", temperature);
            if (jsonMode) body.put("response_format", Map.of("type", "json_object"));

            String payload = mapper.writeValueAsString(body);
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(props.getOpenaiBaseUrl().replaceAll("/$", "") + "/chat/completions"))
                    .timeout(Duration.ofSeconds(90))
                    .header("Authorization", "Bearer " + props.getOpenaiApiKey())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 400) {
                lastError = res.body();
                log.warn("LLM API failed: {}", lastError);
                return fallback(messages);
            }
            JsonNode root = mapper.readTree(res.body());
            return root.path("choices").path(0).path("message").path("content").asText("");
        } catch (Exception e) {
            lastError = e.getMessage();
            log.warn("LLM API failed, using fallback: {}", e.getMessage());
            return fallback(messages);
        }
    }

    private String fallback(List<Map<String, String>> messages) {
        String userText = "";
        for (int i = messages.size() - 1; i >= 0; i--) {
            if ("user".equals(messages.get(i).get("role"))) {
                userText = extractUserText(messages.get(i).get("content"));
                break;
            }
        }
        String systemText = messages.stream()
                .filter(m -> "system".equals(m.get("role")))
                .map(m -> m.get("content"))
                .findFirst().orElse("");

        try {
            if (systemText.toLowerCase().contains("json") || systemText.contains("JSON")) {
                if (isSpeakingPrompt(systemText)) {
                    var corrections = demoGrammarCorrections(userText);
                    Map<String, Object> out = new LinkedHashMap<>();
                    if (!corrections.isEmpty()) {
                        out.put("reply", "Good effort! I noticed a few grammar points — check the corrections below. Could you try saying that again?");
                        out.put("encouragement", "Nice try! Applying corrections will make you sound more natural.");
                        out.put("pronunciation_score", 72);
                    } else {
                        out.put("reply", "That's a great point! Could you tell me more about your experience?");
                        out.put("encouragement", "Keep going — your fluency is improving!");
                        out.put("pronunciation_score", 78);
                    }
                    out.put("corrections", corrections);
                    out.put("pronunciation_feedback", "Clear articulation. Try stressing key verbs more.");
                    return mapper.writeValueAsString(out);
                }
                if (systemText.toLowerCase().contains("english coach")) {
                    return mapper.writeValueAsString(Map.of(
                            "overall_score", 75,
                            "strengths", List.of("词汇量不错", "语速自然"),
                            "improvements", List.of("多使用连接词", "注意动词时态"),
                            "key_phrases_learned", List.of("in my opinion", "as a result"),
                            "next_steps", "建议在同一场景下练习更难的追问。"
                    ));
                }
            }
        } catch (Exception e) {
            return "{\"reply\":\"That's interesting! Could you tell me more?\"}";
        }
        return "That's interesting! Could you tell me more about that?";
    }

    private boolean isSpeakingPrompt(String systemText) {
        String s = systemText.toLowerCase();
        return s.contains("interviewer") || s.contains("waiter") || s.contains("project manager")
                || s.contains("conversation") || s.contains("respond in json");
    }

    private String extractUserText(String content) {
        String[] lines = content.split("\n");
        for (int i = lines.length - 1; i >= 0; i--) {
            if (lines[i].toLowerCase().startsWith("user:")) {
                return lines[i].substring(lines[i].indexOf(':') + 1).trim();
            }
        }
        return content.trim();
    }

    private List<Map<String, String>> demoGrammarCorrections(String text) {
        record Rule(String pattern, String replacement, String reason, String severity) {}
        List<Rule> rules = List.of(
                new Rule("\\bI am work\\b", "I work", "Use simple present: I work / I am working", "major"),
                new Rule("\\bfor (\\w+) year\\b", "for $1 years", "Countable noun 'year' needs plural", "minor"),
                new Rule("\\bHe don't\\b", "He doesn't", "Third-person singular uses doesn't", "major"),
                new Rule("\\bit are\\b", "it is", "Subject-verb agreement: it is", "major"),
                new Rule("\\bI have went\\b", "I went", "Use past simple for finished past actions", "major"),
                new Rule("\\bdont\\b", "don't", "Missing apostrophe in contraction", "minor"),
                new Rule("\\bcoffe\\b", "coffee", "Spelling: coffee", "minor"),
                new Rule("\\brecieved\\b", "received", "Spelling: received", "minor"),
                new Rule("\\bmessege\\b", "message", "Spelling: message", "minor"),
                new Rule("\\breponse\\b", "response", "Spelling: response", "minor"),
                new Rule("\\bto learning\\b", "to learn", "After 'to' use base verb: learn", "major"),
                new Rule("\\bdiscuss about\\b", "discuss", "Discuss is transitive; omit 'about'", "minor"),
                new Rule("\\bmore better\\b", "better", "Better already means 'more good'", "minor")
        );
        List<Map<String, String>> corrections = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Rule rule : rules) {
            Pattern p = Pattern.compile(rule.pattern(), Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(text);
            if (!m.find()) continue;
            String original = m.group();
            if (seen.contains(original.toLowerCase())) continue;
            seen.add(original.toLowerCase());
            Matcher single = p.matcher(original);
            String suggestion = single.replaceFirst(rule.replacement());
            corrections.add(Map.of(
                    "original", original,
                    "suggestion", suggestion,
                    "reason", rule.reason(),
                    "severity", rule.severity()
            ));
        }
        return corrections;
    }

    public JsonNode parseJson(String raw) {
        try {
            return mapper.readTree(raw);
        } catch (Exception e) {
            int start = raw.indexOf('{');
            int end = raw.lastIndexOf('}');
            if (start >= 0 && end > start) {
                try { return mapper.readTree(raw.substring(start, end + 1)); } catch (Exception ignored) {}
            }
            return mapper.createObjectNode().put("reply", raw);
        }
    }
}
