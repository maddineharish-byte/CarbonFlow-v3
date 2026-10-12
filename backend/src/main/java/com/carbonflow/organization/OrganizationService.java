package com.carbonflow.organization;

import com.carbonflow.auditlog.AuditLogService;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final AuditLogService auditLogService;

    public OrganizationService(OrganizationRepository organizationRepository, AuditLogService auditLogService) {
        this.organizationRepository = organizationRepository;
        this.auditLogService = auditLogService;
    }

    public Optional<OrganizationDto> getOrganization(String id) {
        return organizationRepository.findById(id);
    }

    public OrganizationDto updateOrganization(OrganizationDto org) {
        organizationRepository.update(org);
        auditLogService.log(org.id(), "UPDATE", "ORGANIZATION", org.id(), "{\"name\":\"" + org.name() + "\",\"reportingPeriod\":\"" + org.reportingPeriod() + "\"}");
        return organizationRepository.findById(org.id()).orElse(org);
    }
}
