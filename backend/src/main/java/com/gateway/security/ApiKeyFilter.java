package com.gateway.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {

    @Value("${api.key}")
    private String validApiKey;

    @Value("${api.secret}")
    private String validApiSecret;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // ✅ Allow preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Allow actuator
        if (request.getRequestURI().startsWith("/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String apiKey = request.getHeader("X-Api-Key");
        String apiSecret = request.getHeader("X-Api-Secret");

        if (apiKey == null || apiSecret == null ||
                !validApiKey.equals(apiKey) ||
                !validApiSecret.equals(apiSecret)) {

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":{\"code\":\"AUTHENTICATION_ERROR\",\"description\":\"Invalid API credentials\"}}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }
}
