import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Flame,
  Zap,
  CheckCircle2,
  HelpCircle,
  X,
  Plus,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  calculateScope1Emissions,
  calculateScope2Emissions,
  FUEL_SPECIFICATIONS,
  ELECTRICITY_GRID_SPECIFICATIONS,
  FuelType,
  ElectricityGridRegion,
  ThermalEnergyType,
  Scope2AccountingMethod,
  EmissionCalculationResult
} from '../../utils/emissionsCalculator';

interface Scope1And2CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCalculation?: (result: EmissionCalculationResult) => void;
}

export function Scope1And2CalculatorModal({
  isOpen,
  onClose,
  onApplyCalculation
}: Scope1And2CalculatorModalProps) {
  const [activeScope, setActiveScope] = useState<'SCOPE_1' | 'SCOPE_2'>('SCOPE_1');

  // Scope 1 State (Fuel Consumption & Fugitives)
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('NATURAL_GAS');
  const [fuelQuantity, setFuelQuantity] = useState<number>(1000);
  const [fuelUnit, setFuelUnit] = useState<string>('therms');
  const [boilerEfficiency, setBoilerEfficiency] = useState<number>(100);
  const [useCustomFuelFactor, setUseCustomFuelFactor] = useState(false);
  const [customFuelFactor, setCustomFuelFactor] = useState<number>(0.005302);

  // Scope 2 State (Electricity & Thermal Energy)
  const [energyType, setEnergyType] = useState<ThermalEnergyType>('ELECTRICITY');
  const [gridRegion, setGridRegion] = useState<ElectricityGridRegion>('US_AVERAGE');
  const [electricityUsage, setElectricityUsage] = useState<number>(50000); // 50,000 kWh
  const [electricityUnit, setElectricityUnit] = useState<'kWh' | 'MWh' | 'GWh'>('kWh');
  const [accountingMethod, setAccountingMethod] = useState<Scope2AccountingMethod>('LOCATION_BASED');
  const [recsMwh, setRecsMwh] = useState<number>(0);
  const [ppaMwh, setPpaMwh] = useState<number>(0);
  const [onsiteSolarMwh, setOnsiteSolarMwh] = useState<number>(0);

  // Update unit when fuel changes
  const handleFuelChange = (newFuel: FuelType) => {
    setSelectedFuel(newFuel);
    const spec = FUEL_SPECIFICATIONS[newFuel];
    if (spec) {
      setFuelUnit(spec.defaultUnit);
      setCustomFuelFactor(spec.factors[spec.defaultUnit] || 0.005);
    }
  };

  // Run calculation via utility function
  const calculationResult: EmissionCalculationResult = useMemo(() => {
    if (activeScope === 'SCOPE_1') {
      return calculateScope1Emissions({
        fuelType: selectedFuel,
        quantity: fuelQuantity,
        unit: fuelUnit,
        customEmissionFactor: useCustomFuelFactor ? customFuelFactor : undefined,
        boilerEfficiencyPct: boilerEfficiency < 100 ? boilerEfficiency : undefined
      });
    } else {
      return calculateScope2Emissions({
        energyType,
        gridRegion,
        usageAmount: electricityUsage,
        unit: electricityUnit,
        accountingMethod,
        renewableEnergyCertificateMwh: recsMwh,
        powerPurchaseAgreementMwh: ppaMwh,
        onsiteSolarGenerationMwh: onsiteSolarMwh
      });
    }
  }, [
    activeScope,
    selectedFuel,
    fuelQuantity,
    fuelUnit,
    boilerEfficiency,
    useCustomFuelFactor,
    customFuelFactor,
    energyType,
    gridRegion,
    electricityUsage,
    electricityUnit,
    accountingMethod,
    recsMwh,
    ppaMwh,
    onsiteSolarMwh
  ]);

  if (!isOpen) return null;

  const currentFuelSpec = FUEL_SPECIFICATIONS[selectedFuel];
  const currentGridSpec = ELECTRICITY_GRID_SPECIFICATIONS[gridRegion];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl text-slate-900 my-8 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Scope 1 & Scope 2 Emissions Calculator
              </h2>
              <p className="text-xs text-slate-500">
                GHG Protocol & EPA 2024 Energy & Fuel Consumption Metrics Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Scope Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveScope('SCOPE_1')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                activeScope === 'SCOPE_1'
                  ? 'bg-white text-amber-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="h-4 w-4 text-amber-600" />
              <span>Scope 1: Fuel & Fugitives Combustion</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveScope('SCOPE_2')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                activeScope === 'SCOPE_2'
                  ? 'bg-white text-blue-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="h-4 w-4 text-blue-600" />
              <span>Scope 2: Purchased Electricity & Energy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: Inputs */}
            <div className="lg:col-span-7 space-y-4">
              {activeScope === 'SCOPE_1' ? (
                /* SCOPE 1 FUEL PARAMETERS */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fuel / Combustion Material
                    </label>
                    <select
                      value={selectedFuel}
                      onChange={e => handleFuelChange(e.target.value as FuelType)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    >
                      {(Object.keys(FUEL_SPECIFICATIONS) as FuelType[]).map(key => (
                        <option key={key} value={key}>
                          {FUEL_SPECIFICATIONS[key].name} ({FUEL_SPECIFICATIONS[key].category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Consumption Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={fuelQuantity}
                        onChange={e => setFuelQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unit of Measure
                      </label>
                      <select
                        value={fuelUnit}
                        onChange={e => setFuelUnit(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600"
                      >
                        {currentFuelSpec.supportedUnits.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Boiler Efficiency Adjustment */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">Combustion Equipment Efficiency:</span>
                      <span className="font-mono text-emerald-800 font-bold">{boilerEfficiency}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="1"
                      value={boilerEfficiency}
                      onChange={e => setBoilerEfficiency(parseInt(e.target.value) || 100)}
                      className="w-full accent-emerald-700 h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-500">
                      Standard gross input (100%) or derated boiler efficiency.
                    </span>
                  </div>

                  {/* Custom Factor Override */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={useCustomFuelFactor}
                        onChange={e => setUseCustomFuelFactor(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-600"
                      />
                      <span>Override with Certified Laboratory Fuel Factor</span>
                    </label>
                    {useCustomFuelFactor && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={customFuelFactor}
                          onChange={e => setCustomFuelFactor(parseFloat(e.target.value) || 0)}
                          className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                        />
                        <span className="text-xs text-slate-500">tCO2e per {fuelUnit}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SCOPE 2 ELECTRICITY & ENERGY PARAMETERS */
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Purchased Energy Type
                      </label>
                      <select
                        value={energyType}
                        onChange={e => setEnergyType(e.target.value as ThermalEnergyType)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600"
                      >
                        <option value="ELECTRICITY">Purchased Grid Electricity</option>
                        <option value="PURCHASED_STEAM">Purchased Steam</option>
                        <option value="DISTRICT_HOT_WATER">District Hot Water</option>
                        <option value="DISTRICT_CHILLED_WATER">District Chilled Water</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Regional Subgrid Emission Factor
                      </label>
                      <select
                        value={gridRegion}
                        onChange={e => setGridRegion(e.target.value as ElectricityGridRegion)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600"
                      >
                        {(Object.keys(ELECTRICITY_GRID_SPECIFICATIONS) as ElectricityGridRegion[]).map(g => (
                          <option key={g} value={g}>
                            {ELECTRICITY_GRID_SPECIFICATIONS[g].name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Metered Usage Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={electricityUsage}
                        onChange={e => setElectricityUsage(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Unit
                      </label>
                      <select
                        value={electricityUnit}
                        onChange={e => setElectricityUnit(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600"
                      >
                        <option value="kWh">Kilowatt-hours (kWh)</option>
                        <option value="MWh">Megawatt-hours (MWh)</option>
                        <option value="GWh">Gigawatt-hours (GWh)</option>
                      </select>
                    </div>
                  </div>

                  {/* GHG Protocol Dual-Reporting Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GHG Protocol Accounting Method
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setAccountingMethod('LOCATION_BASED')}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          accountingMethod === 'LOCATION_BASED'
                            ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div>Location-Based</div>
                        <div className="text-[10px] font-normal text-slate-500">Physical grid average carbon intensity</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountingMethod('MARKET_BASED')}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          accountingMethod === 'MARKET_BASED'
                            ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div>Market-Based</div>
                        <div className="text-[10px] font-normal text-slate-500">Applies RECs, green PPAs, and residual mix</div>
                      </button>
                    </div>
                  </div>

                  {/* Market-Based Renewable Energy Instruments */}
                  {accountingMethod === 'MARKET_BASED' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 space-y-2 text-xs">
                      <span className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        Contractual Green Energy Deductions (MWh):
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] text-slate-600">RECs / GOs (MWh):</label>
                          <input
                            type="number"
                            min="0"
                            value={recsMwh}
                            onChange={e => setRecsMwh(parseFloat(e.target.value) || 0)}
                            className="mt-0.5 w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600">Offsite PPA (MWh):</label>
                          <input
                            type="number"
                            min="0"
                            value={ppaMwh}
                            onChange={e => setPpaMwh(parseFloat(e.target.value) || 0)}
                            className="mt-0.5 w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-600">Onsite Solar (MWh):</label>
                          <input
                            type="number"
                            min="0"
                            value={onsiteSolarMwh}
                            onChange={e => setOnsiteSolarMwh(parseFloat(e.target.value) || 0)}
                            className="mt-0.5 w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right 5 Cols: Live Calculated Results & Audit Trail */}
            <div className="lg:col-span-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                    Verified Emissions Output
                  </span>
                  <span className="rounded bg-emerald-200/80 text-emerald-950 px-2 py-0.5 font-mono text-[10px] font-bold">
                    {calculationResult.scope}
                  </span>
                </div>

                {/* Primary Metric */}
                <div className="mt-3">
                  <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Calculated Emissions</div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold font-mono text-emerald-950 tabular-nums">
                      {calculationResult.calculatedEmissionsTco2e.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                    </span>
                    <span className="text-sm font-bold text-emerald-900">tCO2e</span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-800 font-mono">
                    {calculationResult.calculatedEmissionsKgCo2e.toLocaleString()} kg CO2e ({calculationResult.calculatedEmissionsLbsCo2e.toLocaleString()} lbs)
                  </div>
                </div>

                {/* Scope 2 Dual-Reporting Comparative Strip */}
                {calculationResult.scope2DualReporting && (
                  <div className="mt-3 rounded-lg bg-white p-2.5 border border-emerald-200 text-xs space-y-1">
                    <div className="font-bold text-slate-800 text-[11px]">GHG Protocol Dual-Reporting:</div>
                    <div className="flex justify-between text-slate-600">
                      <span>Location-Based:</span>
                      <strong className="font-mono text-slate-900">{calculationResult.scope2DualReporting.locationBasedTco2e} tCO2e</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Market-Based:</span>
                      <strong className="font-mono text-blue-900">{calculationResult.scope2DualReporting.marketBasedTco2e} tCO2e</strong>
                    </div>
                    {calculationResult.scope2DualReporting.greenDeductionsMwh > 0 && (
                      <div className="text-[10px] text-emerald-800 font-semibold pt-0.5 border-t border-slate-100">
                        ✓ {calculationResult.scope2DualReporting.greenDeductionsMwh} MWh zero-carbon deductions applied
                      </div>
                    )}
                  </div>
                )}

                {/* Gas Breakdown */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] rounded-lg bg-white p-2 border border-emerald-100">
                  <div>
                    <span className="text-slate-400 font-bold block">CO2</span>
                    <span className="font-mono text-slate-900 font-bold">{calculationResult.ghgBreakdown.co2Tons} t</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">CH4 (GWP 28)</span>
                    <span className="font-mono text-slate-900 font-bold">{calculationResult.ghgBreakdown.ch4TonsCo2e} t</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">N2O (GWP 265)</span>
                    <span className="font-mono text-slate-900 font-bold">{calculationResult.ghgBreakdown.n2oTonsCo2e} t</span>
                  </div>
                </div>

                {/* Audit Trail Note */}
                <div className="mt-3 rounded-lg bg-white/80 p-2 text-[10px] font-mono text-slate-600 border border-emerald-100/80 leading-relaxed">
                  <strong>Math Audit Trail:</strong><br />
                  {calculationResult.mathAuditTrail}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {onApplyCalculation && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyCalculation(calculationResult);
                      onClose();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 shadow-xs transition active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" />
                    Apply & Log to Carbon Data Ledger
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
