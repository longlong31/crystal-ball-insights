import { DistributionType } from "./distributions";

export interface SimulationScenario {
  id: string;
  name: string;
  createdAt: number;
  distributionType: DistributionType;
  params: Record<string, number>;
  iterations: number;
  results?: number[];
  stats?: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    percentile5: number;
    percentile25: number;
    percentile50: number;
    percentile75: number;
    percentile95: number;
  };
}

const STORAGE_KEY = "crystal-ball-scenarios";

export const saveScenario = (scenario: SimulationScenario): void => {
  const scenarios = loadAllScenarios();
  const existingIndex = scenarios.findIndex((s) => s.id === scenario.id);
  
  if (existingIndex >= 0) {
    scenarios[existingIndex] = scenario;
  } else {
    scenarios.push(scenario);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};

export const loadAllScenarios = (): SimulationScenario[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteScenario = (id: string): void => {
  const scenarios = loadAllScenarios().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};

export const generateScenarioId = (): string => {
  return `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
