package com.carbonflow.travel;

public enum TravelMode {
    DRIVE("Driving / Passenger Car", "DRIVE"),
    TRANSIT("Public Transit (Train / Bus)", "TRANSIT"),
    BICYCLE("Cycling / Bicycle", "BICYCLE"),
    WALK("Walking", "WALK");

    private final String displayName;
    private final String googleApiMode;

    TravelMode(String displayName, String googleApiMode) {
        this.displayName = displayName;
        this.googleApiMode = googleApiMode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getGoogleApiMode() {
        return googleApiMode;
    }
}
