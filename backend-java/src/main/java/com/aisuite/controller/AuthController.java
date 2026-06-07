package com.aisuite.controller;

import com.aisuite.dto.Models.*;
import com.aisuite.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        return authService.register(req, request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        return authService.login(req, request);
    }

    @PostMapping("/guest")
    public AuthResponse guest(HttpServletRequest request) {
        return authService.guestLogin(request);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return authService.currentUser();
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        authService.logout(request);
    }
}
