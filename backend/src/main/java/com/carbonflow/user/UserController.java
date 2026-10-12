package com.carbonflow.user;

import com.carbonflow.common.ApiResponse;
import com.carbonflow.security.SecurityUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    public record InviteUserRequest(String email, String fullName, String title, UserRole role) {}
    public record UpdateRoleRequest(UserRole role) {}
    public record UpdateStatusRequest(String status) {}

    @GetMapping
    public ApiResponse<List<UserDto>> getMembers() {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        return ApiResponse.ok(userService.getOrganizationMembers(orgId));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<UserDto> inviteUser(@RequestBody InviteUserRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        UserDto created = userService.inviteUser(orgId, req.email(), req.fullName(), req.title(), req.role());
        return ApiResponse.ok("User invited successfully", created);
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<Void> updateRole(@PathVariable String userId, @RequestBody UpdateRoleRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        userService.updateRole(orgId, userId, req.role());
        return ApiResponse.ok("User role updated successfully", null);
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ApiResponse<Void> updateStatus(@PathVariable String userId, @RequestBody UpdateStatusRequest req) {
        String orgId = SecurityUtils.getCurrentOrganizationId();
        userService.setStatus(orgId, userId, req.status());
        return ApiResponse.ok("User status updated successfully", null);
    }
}
