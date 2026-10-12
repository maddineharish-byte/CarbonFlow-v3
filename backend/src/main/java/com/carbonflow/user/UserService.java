package com.carbonflow.user;

import com.carbonflow.auditlog.AuditLogService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public List<UserDto> getOrganizationMembers(String organizationId) {
        return userRepository.findMembersByOrganization(organizationId);
    }

    public UserDto inviteUser(String organizationId, String email, String fullName, String title, UserRole role) {
        String newUserId = UUID.randomUUID().toString();
        // Temporary secure initial password
        String tempPassword = "ChangeMe123!";
        String encoded = passwordEncoder.encode(tempPassword);

        userRepository.createUser(newUserId, email, encoded, fullName, title, null);
        userRepository.addMember(organizationId, newUserId, role);

        auditLogService.log(organizationId, "CREATE", "USER", newUserId,
                "{\"email\":\"" + email + "\",\"role\":\"" + role.name() + "\"}");

        return userRepository.findMembersByOrganization(organizationId)
                .stream()
                .filter(u -> u.id().equals(newUserId))
                .findFirst()
                .orElse(null);
    }

    public void updateRole(String organizationId, String userId, UserRole role) {
        userRepository.updateMemberRole(organizationId, userId, role);
        auditLogService.log(organizationId, "UPDATE", "ROLE", userId, "{\"newRole\":\"" + role.name() + "\"}");
    }

    public void setStatus(String organizationId, String userId, String status) {
        userRepository.updateMemberStatus(organizationId, userId, status);
        auditLogService.log(organizationId, "STATUS_CHANGE", "USER", userId, "{\"status\":\"" + status + "\"}");
    }
}
