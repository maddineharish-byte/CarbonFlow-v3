package com.carbonflow.travel;

public enum TripType {
    ONE_WAY("One-Way"),
    ROUND_TRIP("Round Trip (Return)");

    private final String displayName;

    TripType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
