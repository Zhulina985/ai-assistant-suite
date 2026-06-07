package com.aisuite.service;

import com.aisuite.dto.Models.AuthResponse;
import com.aisuite.dto.Models.LoginRequest;
import com.aisuite.dto.Models.RegisterRequest;
import com.aisuite.entity.User;
import com.aisuite.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest req, HttpServletRequest request) {
        String username = normalizeUsername(req.username());
        String password = req.password() == null ? "" : req.password().trim();

        if (username.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户名至少 3 个字符");
        }
        if (password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "密码至少 6 个字符");
        }
        if (users.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole("USER");
        users.save(user);

        loginUser(user, request);
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest req, HttpServletRequest request) {
        String username = normalizeUsername(req.username());
        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }

        loginUser(user, request);
        return toResponse(user);
    }

    public AuthResponse guestLogin(HttpServletRequest request) {
        String guestName = "游客" + UUID.randomUUID().toString().substring(0, 6);
        loginGuest(guestName, request);
        return new AuthResponse(null, guestName, "GUEST", true);
    }

    public AuthResponse currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
        }

        String username = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("USER");

        if ("GUEST".equals(role)) {
            return new AuthResponse(null, username, role, true);
        }

        User user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录"));
        return toResponse(user);
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private void loginUser(User user, HttpServletRequest request) {
        var authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
        saveToSession(request, authentication);
    }

    private void loginGuest(String guestName, HttpServletRequest request) {
        var authentication = new UsernamePasswordAuthenticationToken(
                guestName,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_GUEST"))
        );
        saveToSession(request, authentication);
    }

    private void saveToSession(HttpServletRequest request, UsernamePasswordAuthenticationToken authentication) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(user.getId(), user.getUsername(), user.getRole(), false);
    }

    private String normalizeUsername(String username) {
        if (username == null) return "";
        return username.trim().toLowerCase();
    }
}
