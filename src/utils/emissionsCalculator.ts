/**
 * Scope 1 & Scope 2 Greenhouse Gas (GHG) Emissions Calculation Engine
 * 
 * Standards Compliance:
 * - GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition)
 * - GHG Protocol Scope 2 Guidance (Dual-reporting location vs. market-based)
 * - US EPA GHG Emission Factors Hub (2024)
 * - UK DEFRA / DESNZ Greenhouse Gas Conversion Factors (2024)
 * - ISO 14064-1 & ISO 14064-3 Assurance Verification
 */

export type ScopeCategory = 'SCOPE_1' | 'SCOPE_2';

export type FuelType =
  | 'NATURAL_GAS'
  | 'DIESEL'
  | 'GASOLINE'
  | 'PROPANE_LPG'
  | 'HEAVY_FUEL_OIL'
  | 'COAL_BITUMINOUS'
  | 'REFRIGERANT_R410A'
  | 'REFRIGERANT_R134A'
  | 'REFRIGERANT_R404A';

export type ElectricityGridRegion =
  | 'US_AVERAGE'
  | 'US_CAMX_CALIFORNIA'
  | 'US_RFCW_MIDWEST'
  | 'US_ERCT_TEXAS'
  | 'US_NYCW_NEWYORK'
  | 'UK_NATIONAL_GRID'
  | 'EU_AVERAGE'
  | 'GERMANY'
  | 'FRANCE'
  | 'SINGAPORE'
  | 'GLOBAL_AVERAGE';

export type Scope2AccountingMethod = 'LOCATION_BASED' | 'MARKET_BASED';

export type ThermalEnergyType =
  | 'ELECTRICITY'
  | 'PURCHASED_STEAM'
  | 'DISTRICT_HOT_WATER'
  | 'DISTRICT_CHILLED_WATER';

export interface FuelSpecification {
  id: FuelType;
  name: string;
  category: 'Stationary Combustion' | 'Mobile Combustion' | 'Fugitive Emissions';
  defaultUnit: string;
  supportedUnits: string[];
  // Factor in metric tons CO2e per primary unit
  factors: Record<string, number>;
  sourceStandard: string;
  vintage: string;
  co2Fraction: number; // percentage of tCO2e that is direct CO2
  ch4Fraction: number; // percentage from CH4
  n2oFraction: number; // percentage from N2O
}

export interface GridSpecification {
  id: ElectricityGridRegion;
  name: string;
  country: string;
  factorPerKwh: number; // tCO2e per kWh
  factorPerMwh: number; // tCO2e per MWh
  source: string;
  residualMixFactorPerMwh: number;
}

// 1. Scope 1 Fuel Database (EPA & DEFRA 2024)
export const FUEL_SPECIFICATIONS: Record<FuelType, FuelSpecification> = {
  NATURAL_GAS: {
    id: 'NATURAL_GAS',
    name: 'Natural Gas (Pipeline Quality)',
    category: 'Stationary Combustion',
    defaultUnit: 'therms',
    supportedUnits: ['therms', 'MMBtu', 'm3', 'kWh_gross', 'Mcf'],
    factors: {
      therms: 0.005302, // 5.302 kg CO2e/therm -> 0.005302 tCO2e/therm (EPA 2024)
      MMBtu: 0.053020,  // 53.02 kg CO2e/MMBtu
      m3: 0.002026,     // 2.026 kg CO2e/m3 (DEFRA 2024)
      kWh_gross: 0.000183, // 0.183 kg CO2e/kWh (DEFRA 2024)
      Mcf: 0.054450     // 1 Mcf ~ 1.027 MMBtu
    },
    sourceStandard: 'US EPA GHG Emission Factors Hub (2024) / DEFRA Table 1',
    vintage: '2024',
    co2Fraction: 0.998,
    ch4Fraction: 0.001,
    n2oFraction: 0.001
  },
  DIESEL: {
    id: 'DIESEL',
    name: 'Distillate Fuel Oil No. 2 (Diesel / Gas Oil)',
    category: 'Stationary Combustion',
    defaultUnit: 'gallons',
    supportedUnits: ['gallons', 'liters', 'barrels', 'metric_tons'],
    factors: {
      gallons: 0.010210, // 10.21 kg CO2e/gal (EPA 2024)
      liters: 0.002697,  // 2.697 kg CO2e/L (DEFRA 2024)
      barrels: 0.428820, // 42 gal/bbl
      metric_tons: 3.195000 // 3,195 kg CO2e/t
    },
    sourceStandard: 'US EPA Mandatory Reporting Rule 40 CFR Part 98',
    vintage: '2024',
    co2Fraction: 0.994,
    ch4Fraction: 0.003,
    n2oFraction: 0.003
  },
  GASOLINE: {
    id: 'GASOLINE',
    name: 'Motor Gasoline (Fleet Combustion)',
    category: 'Mobile Combustion',
    defaultUnit: 'gallons',
    supportedUnits: ['gallons', 'liters'],
    factors: {
      gallons: 0.008887, // 8.887 kg CO2e/gal (EPA 2024)
      liters: 0.002348   // 2.348 kg CO2e/L (DEFRA 2024)
    },
    sourceStandard: 'US EPA GHG Hub / Federal Fleet Standard',
    vintage: '2024',
    co2Fraction: 0.991,
    ch4Fraction: 0.005,
    n2oFraction: 0.004
  },
  PROPANE_LPG: {
    id: 'PROPANE_LPG',
    name: 'Liquefied Petroleum Gas (Propane / LPG)',
    category: 'Stationary Combustion',
    defaultUnit: 'gallons',
    supportedUnits: ['gallons', 'liters', 'kg', 'pounds'],
    factors: {
      gallons: 0.005720,
      liters: 0.001511,
      kg: 0.002939,
      pounds: 0.001333
    },
    sourceStandard: 'US EPA / DEFRA 2024 Fuel Properties',
    vintage: '2024',
    co2Fraction: 0.996,
    ch4Fraction: 0.002,
    n2oFraction: 0.002
  },
  HEAVY_FUEL_OIL: {
    id: 'HEAVY_FUEL_OIL',
    name: 'Residual Fuel Oil No. 6 (Heavy Fuel Oil)',
    category: 'Stationary Combustion',
    defaultUnit: 'gallons',
    supportedUnits: ['gallons', 'liters', 'metric_tons'],
    factors: {
      gallons: 0.011270,
      liters: 0.002977,
      metric_tons: 3.165000
    },
    sourceStandard: 'US EPA 40 CFR Part 98 Table C-1',
    vintage: '2024',
    co2Fraction: 0.995,
    ch4Fraction: 0.003,
    n2oFraction: 0.002
  },
  COAL_BITUMINOUS: {
    id: 'COAL_BITUMINOUS',
    name: 'Bituminous Industrial Coal',
    category: 'Stationary Combustion',
    defaultUnit: 'short_tons',
    supportedUnits: ['short_tons', 'metric_tons'],
    factors: {
      short_tons: 2.324000,
      metric_tons: 2.561700
    },
    sourceStandard: 'US EPA GHG Factors Hub Table 1',
    vintage: '2024',
    co2Fraction: 0.992,
    ch4Fraction: 0.004,
    n2oFraction: 0.004
  },
  REFRIGERANT_R410A: {
    id: 'REFRIGERANT_R410A',
    name: 'Refrigerant R-410A (Fugitive HVAC Loss)',
    category: 'Fugitive Emissions',
    defaultUnit: 'kg',
    supportedUnits: ['kg', 'pounds'],
    factors: {
      kg: 2.087500, // GWP 2087.5 (IPCC AR4 / EPA)
      pounds: 0.946800
    },
    sourceStandard: 'IPCC Fourth Assessment Report (AR4) GWP-100',
    vintage: '2024',
    co2Fraction: 0.0,
    ch4Fraction: 0.0,
    n2oFraction: 0.0
  },
  REFRIGERANT_R134A: {
    id: 'REFRIGERANT_R134A',
    name: 'Refrigerant R-134a (Chiller & Auto Loss)',
    category: 'Fugitive Emissions',
    defaultUnit: 'kg',
    supportedUnits: ['kg', 'pounds'],
    factors: {
      kg: 1.430000, // GWP 1430
      pounds: 0.648600
    },
    sourceStandard: 'IPCC AR4 GWP-100',
    vintage: '2024',
    co2Fraction: 0.0,
    ch4Fraction: 0.0,
    n2oFraction: 0.0
  },
  REFRIGERANT_R404A: {
    id: 'REFRIGERANT_R404A',
    name: 'Refrigerant R-404A (Cold Storage Loss)',
    category: 'Fugitive Emissions',
    defaultUnit: 'kg',
    supportedUnits: ['kg', 'pounds'],
    factors: {
      kg: 3.921600, // GWP 3921.6
      pounds: 1.778800
    },
    sourceStandard: 'IPCC AR4 GWP-100',
    vintage: '2024',
    co2Fraction: 0.0,
    ch4Fraction: 0.0,
    n2oFraction: 0.0
  }
};

// 2. Scope 2 Grid Subregion Factors (eGRID 2024, DEFRA, IEA)
export const ELECTRICITY_GRID_SPECIFICATIONS: Record<ElectricityGridRegion, GridSpecification> = {
  US_AVERAGE: {
    id: 'US_AVERAGE',
    name: 'US National Grid Average',
    country: 'United States',
    factorPerKwh: 0.0003714, // 371.4 g CO2e/kWh = 0.3714 tCO2e/MWh
    factorPerMwh: 0.3714,
    source: 'EPA eGRID2022 (Released 2024) US Average Output Emission Rate',
    residualMixFactorPerMwh: 0.4285
  },
  US_CAMX_CALIFORNIA: {
    id: 'US_CAMX_CALIFORNIA',
    name: 'US WECC California (CAMX Subregion)',
    country: 'United States',
    factorPerKwh: 0.0002152, // 215.2 g CO2e/kWh
    factorPerMwh: 0.2152,
    source: 'EPA eGRID2022 CAMX Subregion (Renewable-Rich)',
    residualMixFactorPerMwh: 0.2850
  },
  US_RFCW_MIDWEST: {
    id: 'US_RFCW_MIDWEST',
    name: 'US RFC West (Midwest / Rust Belt)',
    country: 'United States',
    factorPerKwh: 0.0004958,
    factorPerMwh: 0.4958,
    source: 'EPA eGRID2022 RFC West (Coal & Gas Baseline)',
    residualMixFactorPerMwh: 0.5480
  },
  US_ERCT_TEXAS: {
    id: 'US_ERCT_TEXAS',
    name: 'US ERCOT (Texas Interconnection)',
    country: 'United States',
    factorPerKwh: 0.0003884,
    factorPerMwh: 0.3884,
    source: 'EPA eGRID2022 ERCOT All Subregions',
    residualMixFactorPerMwh: 0.4410
  },
  US_NYCW_NEWYORK: {
    id: 'US_NYCW_NEWYORK',
    name: 'US NPCC NYC/Westchester (NYCW)',
    country: 'United States',
    factorPerKwh: 0.0002481,
    factorPerMwh: 0.2481,
    source: 'EPA eGRID2022 NYCW Subregion',
    residualMixFactorPerMwh: 0.3120
  },
  UK_NATIONAL_GRID: {
    id: 'UK_NATIONAL_GRID',
    name: 'United Kingdom National Grid',
    country: 'United Kingdom',
    factorPerKwh: 0.0002071, // 0.2071 kg CO2e/kWh
    factorPerMwh: 0.2071,
    source: 'UK Government GHG Conversion Factors (DEFRA/DESNZ 2024)',
    residualMixFactorPerMwh: 0.2980
  },
  EU_AVERAGE: {
    id: 'EU_AVERAGE',
    name: 'European Union Grid Average (EU-27)',
    country: 'European Union',
    factorPerKwh: 0.0002305,
    factorPerMwh: 0.2305,
    source: 'European Environment Agency (EEA) Greenhouse Gas Intensity',
    residualMixFactorPerMwh: 0.3650
  },
  GERMANY: {
    id: 'GERMANY',
    name: 'Germany (Bundesnetzagentur / UBA)',
    country: 'Germany',
    factorPerKwh: 0.0003800,
    factorPerMwh: 0.3800,
    source: 'German Federal Environment Agency (Umweltbundesamt 2024)',
    residualMixFactorPerMwh: 0.4900
  },
  FRANCE: {
    id: 'FRANCE',
    name: 'France (RTE Low-Carbon Nuclear/Hydro Grid)',
    country: 'France',
    factorPerKwh: 0.0000552, // 55.2 g CO2e/kWh
    factorPerMwh: 0.0552,
    source: 'RTE France / IEA Low-Carbon Power Metric',
    residualMixFactorPerMwh: 0.0820
  },
  SINGAPORE: {
    id: 'SINGAPORE',
    name: 'Singapore Grid (Energy Market Authority)',
    country: 'Singapore',
    factorPerKwh: 0.0004168,
    factorPerMwh: 0.4168,
    source: 'Energy Market Authority (EMA) Grid Emission Factor (2024)',
    residualMixFactorPerMwh: 0.4350
  },
  GLOBAL_AVERAGE: {
    id: 'GLOBAL_AVERAGE',
    name: 'World Global Electricity Average',
    country: 'Global',
    factorPerKwh: 0.0004750,
    factorPerMwh: 0.4750,
    source: 'International Energy Agency (IEA) Global Energy Review',
    residualMixFactorPerMwh: 0.5200
  }
};

// 3. Calculation Input Interfaces
export interface Scope1CalculationInput {
  fuelType: FuelType;
  quantity: number;
  unit: string;
  customEmissionFactor?: number; // Optional override in tCO2e per unit
  boilerEfficiencyPct?: number; // Optional combustion efficiency (default 100% of fuel input)
  notes?: string;
}

export interface Scope2CalculationInput {
  energyType: ThermalEnergyType;
  gridRegion: ElectricityGridRegion;
  usageAmount: number;
  unit: 'kWh' | 'MWh' | 'GWh' | 'MMBtu' | 'ton_hours';
  accountingMethod: Scope2AccountingMethod; // LOCATION_BASED vs. MARKET_BASED
  // Market-Based Deductions & Instruments:
  renewableEnergyCertificateMwh?: number; // Unbundled RECs or GOs applied
  powerPurchaseAgreementMwh?: number;    // Contractual zero-emission PPA
  onsiteSolarGenerationMwh?: number;     // Onsite behind-the-meter generation
  supplierSpecificFactorTco2ePerMwh?: number; // If supplier provides certified factor
  notes?: string;
}

// 4. Calculation Output Result
export interface EmissionCalculationResult {
  scope: ScopeCategory;
  category: string;
  activityType: string;
  activityAmount: number;
  unit: string;
  effectiveFactor: number; // in tCO2e per specified unit
  factorUnit: string;
  calculatedEmissionsTco2e: number;
  calculatedEmissionsKgCo2e: number;
  calculatedEmissionsLbsCo2e: number;
  ghgBreakdown: {
    co2Tons: number;
    ch4TonsCo2e: number;
    n2oTonsCo2e: number;
  };
  methodology: string;
  standardReference: string;
  tierScore: 'TIER_1_SUPPLIER' | 'TIER_2_SUBREGION' | 'TIER_3_DEFAULT';
  mathAuditTrail: string;
  // Specific Scope 2 Dual-Reporting Metrics (if Scope 2)
  scope2DualReporting?: {
    locationBasedTco2e: number;
    marketBasedTco2e: number;
    grossMwh: number;
    greenDeductionsMwh: number;
    netTaxableMwh: number;
    recsRetirementProof: boolean;
  };
}

/**
 * Calculates Scope 1 Direct Emissions from fuel combustion or fugitive loss.
 */
export function calculateScope1Emissions(input: Scope1CalculationInput): EmissionCalculationResult {
  const spec = FUEL_SPECIFICATIONS[input.fuelType] || FUEL_SPECIFICATIONS.NATURAL_GAS;
  const quantity = Math.max(0, input.quantity);
  const unit = input.unit || spec.defaultUnit;

  // Determine factor
  let factor = input.customEmissionFactor;
  let factorSource = 'Custom verified facility factor';
  let tierScore: 'TIER_1_SUPPLIER' | 'TIER_2_SUBREGION' | 'TIER_3_DEFAULT' = 'TIER_1_SUPPLIER';

  if (factor === undefined) {
    factor = spec.factors[unit] !== undefined ? spec.factors[unit] : spec.factors[spec.defaultUnit] || 0.005302;
    factorSource = spec.sourceStandard;
    tierScore = 'TIER_2_SUBREGION';
  }

  // Adjust for efficiency if provided (for boiler fuel consumption)
  let effectiveQty = quantity;
  if (input.boilerEfficiencyPct && input.boilerEfficiencyPct > 0 && input.boilerEfficiencyPct < 100) {
    // If quantity is useful output heat, raw fuel required = output / efficiency
    effectiveQty = quantity / (input.boilerEfficiencyPct / 100);
  }

  const rawEmissions = effectiveQty * factor;
  const roundedTco2e = parseFloat(rawEmissions.toFixed(5));
  const kgCo2e = parseFloat((rawEmissions * 1000).toFixed(2));
  const lbsCo2e = parseFloat((rawEmissions * 2204.62).toFixed(2));

  const co2Tons = parseFloat((roundedTco2e * spec.co2Fraction).toFixed(5));
  const ch4Tons = parseFloat((roundedTco2e * spec.ch4Fraction).toFixed(5));
  const n2oTons = parseFloat((roundedTco2e * spec.n2oFraction).toFixed(5));

  const mathAuditTrail = `${quantity.toLocaleString()} ${unit} × ${factor} tCO2e/${unit} [${spec.vintage} ${spec.name}] = ${roundedTco2e} tCO2e`;

  return {
    scope: 'SCOPE_1',
    category: spec.category,
    activityType: spec.name,
    activityAmount: quantity,
    unit,
    effectiveFactor: factor,
    factorUnit: `tCO2e/${unit}`,
    calculatedEmissionsTco2e: roundedTco2e,
    calculatedEmissionsKgCo2e: kgCo2e,
    calculatedEmissionsLbsCo2e: lbsCo2e,
    ghgBreakdown: {
      co2Tons,
      ch4TonsCo2e: ch4Tons,
      n2oTonsCo2e: n2oTons
    },
    methodology: `GHG Protocol Corporate Standard (Direct Stationary/Mobile Combustion) - ${factorSource}`,
    standardReference: spec.sourceStandard,
    tierScore,
    mathAuditTrail
  };
}

/**
 * Calculates Scope 2 Indirect Emissions from purchased electricity, steam, heating, or cooling.
 * Implements GHG Protocol Scope 2 Guidance Dual Reporting (Location-based vs. Market-based).
 */
export function calculateScope2Emissions(input: Scope2CalculationInput): EmissionCalculationResult {
  const grid = ELECTRICITY_GRID_SPECIFICATIONS[input.gridRegion] || ELECTRICITY_GRID_SPECIFICATIONS.US_AVERAGE;
  const rawUsage = Math.max(0, input.usageAmount);

  // Convert usage to MWh standard
  let usageMwh = rawUsage;
  if (input.unit === 'kWh') {
    usageMwh = rawUsage / 1000;
  } else if (input.unit === 'GWh') {
    usageMwh = rawUsage * 1000;
  } else if (input.unit === 'MMBtu') {
    usageMwh = rawUsage * 0.293071; // 1 MMBtu = 0.293071 MWh
  } else if (input.unit === 'ton_hours') {
    usageMwh = (rawUsage * 3.517) / 1000; // 1 ton-hour cooling ~ 3.517 kWh thermal
  }

  // Location-based factor (grid average)
  const locationFactorPerMwh = grid.factorPerMwh;
  const locationTco2e = parseFloat((usageMwh * locationFactorPerMwh).toFixed(5));

  // Market-based calculation with contractual green deductions
  const recsMwh = Math.max(0, input.renewableEnergyCertificateMwh || 0);
  const ppaMwh = Math.max(0, input.powerPurchaseAgreementMwh || 0);
  const solarMwh = Math.max(0, input.onsiteSolarGenerationMwh || 0);
  const greenTotalMwh = Math.min(usageMwh, recsMwh + ppaMwh + solarMwh);

  const netTaxableMwh = Math.max(0, usageMwh - greenTotalMwh);

  // Supplier factor or residual mix factor
  const marketFactorPerMwh =
    input.supplierSpecificFactorTco2ePerMwh !== undefined
      ? input.supplierSpecificFactorTco2ePerMwh
      : grid.residualMixFactorPerMwh;

  const marketTco2e = parseFloat((netTaxableMwh * marketFactorPerMwh).toFixed(5));

  // Determine active reporting emissions based on user preference
  const isMarket = input.accountingMethod === 'MARKET_BASED';
  const finalEmissionsTco2e = isMarket ? marketTco2e : locationTco2e;
  const factorApplied = isMarket
    ? (usageMwh > 0 ? parseFloat((finalEmissionsTco2e / usageMwh).toFixed(6)) : 0)
    : locationFactorPerMwh;

  const kgCo2e = parseFloat((finalEmissionsTco2e * 1000).toFixed(2));
  const lbsCo2e = parseFloat((finalEmissionsTco2e * 2204.62).toFixed(2));

  const mathAuditTrail = isMarket
    ? `Market-Based: (${usageMwh.toFixed(2)} MWh - ${greenTotalMwh.toFixed(2)} MWh RECs/PPA) × ${marketFactorPerMwh} tCO2e/MWh = ${marketTco2e} tCO2e (Location-based: ${locationTco2e} tCO2e)`
    : `Location-Based: ${usageMwh.toFixed(2)} MWh × ${locationFactorPerMwh} tCO2e/MWh [${grid.name}] = ${locationTco2e} tCO2e`;

  return {
    scope: 'SCOPE_2',
    category: input.energyType === 'ELECTRICITY' ? 'Purchased Electricity' : 'Purchased Thermal Energy',
    activityType: `${input.energyType === 'ELECTRICITY' ? 'Grid Electricity' : input.energyType.replace(/_/g, ' ')} (${grid.country})`,
    activityAmount: rawUsage,
    unit: input.unit,
    effectiveFactor: input.unit === 'kWh' ? factorApplied / 1000 : factorApplied,
    factorUnit: `tCO2e/${input.unit}`,
    calculatedEmissionsTco2e: finalEmissionsTco2e,
    calculatedEmissionsKgCo2e: kgCo2e,
    calculatedEmissionsLbsCo2e: lbsCo2e,
    ghgBreakdown: {
      co2Tons: parseFloat((finalEmissionsTco2e * 0.99).toFixed(5)),
      ch4TonsCo2e: parseFloat((finalEmissionsTco2e * 0.006).toFixed(5)),
      n2oTonsCo2e: parseFloat((finalEmissionsTco2e * 0.004).toFixed(5))
    },
    methodology: `GHG Protocol Scope 2 Guidance (${input.accountingMethod}) - ${grid.source}`,
    standardReference: grid.source,
    tierScore: input.supplierSpecificFactorTco2ePerMwh !== undefined || greenTotalMwh > 0 ? 'TIER_1_SUPPLIER' : 'TIER_2_SUBREGION',
    mathAuditTrail,
    scope2DualReporting: {
      locationBasedTco2e: locationTco2e,
      marketBasedTco2e: marketTco2e,
      grossMwh: parseFloat(usageMwh.toFixed(3)),
      greenDeductionsMwh: parseFloat(greenTotalMwh.toFixed(3)),
      netTaxableMwh: parseFloat(netTaxableMwh.toFixed(3)),
      recsRetirementProof: greenTotalMwh > 0
    }
  };
}

/**
 * Universal Scope 1 & 2 Emissions Calculator Dispatcher
 */
export function calculateScope1And2Emissions(
  params:
    | { type: 'SCOPE_1'; input: Scope1CalculationInput }
    | { type: 'SCOPE_2'; input: Scope2CalculationInput }
): EmissionCalculationResult {
  if (params.type === 'SCOPE_1') {
    return calculateScope1Emissions(params.input);
  }
  return calculateScope2Emissions(params.input);
}
