import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  requirementFeatureCatalog,
  requirementSourceInventory,
  requirementUniverseGroups,
} from '@/runtime/requirements';

function readRootFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

describe('requirement registry and README alignment', () => {
  it('covers every derived clause from the source inventory', () => {
    const coveredClauses = new Set(
      requirementFeatureCatalog.flatMap((feature) => feature.coveredClauses),
    );

    const uncoveredClauses = requirementSourceInventory.filter(
      (entry) => !coveredClauses.has(entry.clause),
    );

    expect(uncoveredClauses).toEqual([]);
  });

  it('keeps unique ids and complete required fields', () => {
    const ids = new Set<string>();

    for (const feature of requirementFeatureCatalog) {
      expect(isNonEmptyString(feature.id)).toBe(true);
      expect(isNonEmptyString(feature.titleEN)).toBe(true);
      expect(isNonEmptyString(feature.universeGroup)).toBe(true);
      expect(isNonEmptyString(feature.status)).toBe(true);
      expect(isNonEmptyString(feature.runtimePath)).toBe(true);
      expect(isNonEmptyString(feature.sourceDoc)).toBe(true);
      expect(isNonEmptyString(feature.sourceClause)).toBe(true);
      expect(isNonEmptyString(feature.experienceEntryEN)).toBe(true);
      expect(isNonEmptyString(feature.runtimeSubsystem)).toBe(true);
      expect(isNonEmptyString(feature.readmeSummaryEN)).toBe(true);
      expect(Array.isArray(feature.modulePaths) && feature.modulePaths.length > 0).toBe(true);
      expect(Array.isArray(feature.coveredClauses) && feature.coveredClauses.length > 0).toBe(true);
      expect(Array.isArray(feature.capabilityDependencies)).toBe(true);

      expect(ids.has(feature.id)).toBe(false);
      ids.add(feature.id);
    }

    expect(ids.size).toBe(requirementFeatureCatalog.length);
  });

  it('mentions every public universe layer and feature cluster in the README', () => {
    const readme = readRootFile('README.md');

    for (const group of requirementUniverseGroups) {
      expect(readme).toContain(group.titleEN);
    }

    for (const feature of requirementFeatureCatalog) {
      expect(readme).toContain(feature.titleEN);
    }
  });

  it('does not reference private requirement or internal docs folders from the README', () => {
    const readme = readRootFile('README.md');

    expect(readme).not.toContain('docs/');
    expect(readme).not.toContain('需求/');
  });
});
