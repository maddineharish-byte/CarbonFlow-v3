package com.carbonflow.carbon;

import com.carbonflow.auditlog.AuditLogService;
import com.carbonflow.security.SecurityUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CarbonDataService {

    private final CarbonDataRepository carbonDataRepository;
    private final EmissionFactorRepository emissionFactorRepository;
    private final AuditLogService auditLogService;

    public CarbonDataService(CarbonDataRepository carbonDataRepository,
                             EmissionFactorRepository emissionFactorRepository,
                             AuditLogService auditLogService) {
        this.carbonDataRepository = carbonDataRepository;
        this.emissionFactorRepository = emissionFactorRepository;
        this.auditLogService = auditLogService;
    }

    public List<EmissionFactorDto> getEmissionFactors(String organizationId) {
        return emissionFactorRepository.findAllForOrganization(organizationId);
    }

    public List<CarbonDataDto> searchRecords(String organizationId, String period, String scope, String status, String query, int limit, int offset) {
        return carbonDataRepository.searchAndFilter(organizationId, period, scope, status, query, limit, offset);
    }

    public int countRecords(String organizationId, String period, String scope, String status, String query) {
        return carbonDataRepository.count(organizationId, period, scope, status, query);
    }

    public CarbonDataDto getRecord(String id, String organizationId) {
        return carbonDataRepository.findByIdAndOrg(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Carbon data record not found or access denied."));
    }

    public CarbonDataDto createRecord(String organizationId, CarbonDataDto.CreateUpdateRequest req) {
        if (req.activityAmount() < 0) {
            throw new IllegalArgumentException("Activity amount cannot be negative.");
        }
        if (req.emissionFactor() == null || req.emissionFactor() < 0) {
            throw new IllegalArgumentException("Emission factor must be positive.");
        }

        // Authoritative calculation: activity_amount * emission_factor
        double calculated = BigDecimal.valueOf(req.activityAmount())
                .multiply(BigDecimal.valueOf(req.emissionFactor()))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        String id = UUID.randomUUID().toString();
        String currentUserId = SecurityUtils.getCurrentUserId();

        CarbonDataDto dto = new CarbonDataDto(
                id,
                organizationId,
                req.reportingPeriod(),
                req.scope(),
                req.category(),
                req.activityType(),
                req.activityAmount(),
                req.unit(),
                req.emissionFactor(),
                calculated,
                req.source(),
                req.dataOwner(),
                req.status() != null ? req.status() : "DRAFT",
                req.notes(),
                currentUserId != null ? currentUserId : "SYSTEM",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        carbonDataRepository.insert(dto);

        auditLogService.log(organizationId, "CREATE", "CARBON_DATA", id,
                "{\"scope\":\"" + req.scope() + "\",\"calculatedEmissions\":" + calculated + ",\"activityAmount\":" + req.activityAmount() + "}");

        return dto;
    }

    public CarbonDataDto updateRecord(String id, String organizationId, CarbonDataDto.CreateUpdateRequest req) {
        CarbonDataDto existing = getRecord(id, organizationId);

        double calculated = BigDecimal.valueOf(req.activityAmount())
                .multiply(BigDecimal.valueOf(req.emissionFactor()))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();

        CarbonDataDto updated = new CarbonDataDto(
                id,
                organizationId,
                req.reportingPeriod(),
                req.scope(),
                req.category(),
                req.activityType(),
                req.activityAmount(),
                req.unit(),
                req.emissionFactor(),
                calculated,
                req.source(),
                req.dataOwner(),
                req.status(),
                req.notes(),
                existing.createdBy(),
                existing.createdAt(),
                LocalDateTime.now()
        );

        carbonDataRepository.update(updated);

        auditLogService.log(organizationId, "UPDATE", "CARBON_DATA", id,
                "{\"calculatedEmissions\":" + calculated + ",\"status\":\"" + req.status() + "\"}");

        return updated;
    }

    public void deleteRecord(String id, String organizationId) {
        CarbonDataDto existing = getRecord(id, organizationId);
        carbonDataRepository.delete(id, organizationId);
        auditLogService.log(organizationId, "DELETE", "CARBON_DATA", id,
                "{\"category\":\"" + existing.category() + "\",\"scope\":\"" + existing.scope() + "\"}");
    }

    public List<Map<String, Object>> getEmissionsSummary(String organizationId, String period) {
        return carbonDataRepository.aggregateEmissionsByScope(organizationId, period);
    }
}
