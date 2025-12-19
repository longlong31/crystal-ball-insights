import { ProjectParams } from "./projectModel";

export interface ProjectScenario {
  id: string;
  name: string;
  createdAt: number;
  params: ProjectParams;
}

const STORAGE_KEY = "crystal-ball-project-scenarios";

export const saveProjectScenario = (scenario: ProjectScenario): void => {
  const scenarios = loadAllProjectScenarios();
  const existingIndex = scenarios.findIndex((s) => s.id === scenario.id);
  
  if (existingIndex >= 0) {
    scenarios[existingIndex] = scenario;
  } else {
    scenarios.push(scenario);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};

export const loadAllProjectScenarios = (): ProjectScenario[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const deleteProjectScenario = (id: string): void => {
  const scenarios = loadAllProjectScenarios().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
};

export const generateProjectScenarioId = (): string => {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
