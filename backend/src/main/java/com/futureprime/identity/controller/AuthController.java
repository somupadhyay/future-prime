package com.futureprime.identity.controller;

import com.futureprime.core.dto.ApiResponse;
import com.futureprime.identity.dto.LoginRequestDto;
import com.futureprime.identity.dto.LoginResponseDto;
import com.futureprime.identity.dto.RefreshTokenRequestDto;
import com.futureprime.identity.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
        // call authService.login(request)
        LoginResponseDto loginResponse = authService.login(request);
        // return ResponseEntity.ok(ApiResponse.success(result))
        return ResponseEntity.ok(ApiResponse.success(loginResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDto>> refresh(@Valid @RequestBody RefreshTokenRequestDto request) {
        // call authService.refresh(request)
        LoginResponseDto loginResponse = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success(loginResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody RefreshTokenRequestDto request) {
        // call authService.logout(request.getRefreshToken())
        // return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"))
        authService.logout(request.getRefreshToken());
        return  ResponseEntity.ok(ApiResponse.success(null,"Logged out successfully"));
    }
}
