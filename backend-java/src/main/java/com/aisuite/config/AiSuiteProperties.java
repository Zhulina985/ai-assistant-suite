package com.aisuite.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "aisuite")
public class AiSuiteProperties {
    private String openaiApiKey = "";
    private String openaiBaseUrl = "https://openrouter.ai/api/v1";
    private String openaiModel = "nvidia/nemotron-3-ultra-550b-a55b:free";
    private String corsOrigins = "http://localhost:5173";

    public String getOpenaiApiKey() { return openaiApiKey; }
    public void setOpenaiApiKey(String openaiApiKey) { this.openaiApiKey = openaiApiKey; }
    public String getOpenaiBaseUrl() { return openaiBaseUrl; }
    public void setOpenaiBaseUrl(String openaiBaseUrl) { this.openaiBaseUrl = openaiBaseUrl; }
    public String getOpenaiModel() { return openaiModel; }
    public void setOpenaiModel(String openaiModel) { this.openaiModel = openaiModel; }
    public String getCorsOrigins() { return corsOrigins; }
    public void setCorsOrigins(String corsOrigins) { this.corsOrigins = corsOrigins; }
}
