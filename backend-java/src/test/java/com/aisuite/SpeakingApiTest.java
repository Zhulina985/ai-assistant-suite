package com.aisuite;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "aisuite.openai-api-key=")
class SpeakingApiTest {
    @Autowired MockMvc mvc;

    @Test
    void healthWorks() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.backend").value("java"));
    }

    @Test
    void speakingDemoGrammar() throws Exception {
        String session = mvc.perform(post("/api/speaking/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scenario\":\"interview\",\"user_level\":\"intermediate\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String sessionId = session.replaceAll("(?s).*\"sessionId\"\\s*:\\s*\"([^\"]+)\".*", "$1");

        mvc.perform(post("/api/speaking/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"session_id\":\"" + sessionId + "\",\"user_message\":\"I am work for five year.\",\"use_llm\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.corrections").isArray());
    }
}
