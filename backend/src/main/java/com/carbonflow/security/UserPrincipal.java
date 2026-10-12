package com.carbonflow.security;

import com.carbonflow.user.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {
    private final String userId;
    private final String email;
    private final String passwordHash;
    private final String fullName;
    private final String organizationId;
    private final UserRole role;
    private final boolean active;

    public UserPrincipal(String userId, String email, String passwordHash, String fullName, String organizationId, UserRole role, boolean active) {
        this.userId = userId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.organizationId = organizationId;
        this.role = role;
        this.active = active;
    }

    public String getUserId() { return userId; }
    public String getId() { return userId; }
    public String getFullName() { return fullName; }
    public String getOrganizationId() { return organizationId; }
    public UserRole getRole() { return role; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null) return Collections.emptyList();
        return Collections.singletonList(new SimpleGrantedAuthority(role.getAuthority()));
    }

    @Override
    public String getPassword() { return passwordHash; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return active; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return active; }
}
