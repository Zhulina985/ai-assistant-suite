package com.aisuite;

import com.aisuite.config.AiSuiteProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AiSuiteProperties.class)
public class AiSuiteApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiSuiteApplication.class, args);
    }
}
