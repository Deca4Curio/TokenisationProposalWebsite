import type { Questionnaire } from "@/types";

export interface MetricItem {
  icon: string;
  value: string;
  label: string;
}

/**
 * Extract display metrics from the questionnaire for the report hero.
 * Returns up to 4 items.
 */
export function extractMetrics(questionnaire?: Questionnaire): MetricItem[] {
  if (!questionnaire) return [];

  const metrics: MetricItem[] = [];

  if (questionnaire.estimatedValue) {
    metrics.push({
      icon: "dollar",
      value: questionnaire.estimatedValue,
      label: "Estimated Value",
    });
  }

  if (questionnaire.jurisdiction) {
    metrics.push({
      icon: "globe",
      value: questionnaire.jurisdiction,
      label: "Jurisdiction",
    });
  }

  if (questionnaire.industry) {
    metrics.push({
      icon: "building",
      value: questionnaire.industry,
      label: "Industry",
    });
  }

  if (questionnaire.businessObjectives?.length) {
    metrics.push({
      icon: "lightbulb",
      value: questionnaire.businessObjectives.join(", "),
      label: "Objectives",
    });
  } else if (questionnaire.assetTypes?.length) {
    metrics.push({
      icon: "chain",
      value: questionnaire.assetTypes.join(", "),
      label: "Asset Types",
    });
  }

  return metrics.slice(0, 4);
}
