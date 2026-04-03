import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  requirementFeatureCatalog,
  requirementSourceInventory,
  requirementUniverseGroups,
} from '@/runtime/requirements';
import { buildReadmeMarkdown } from '../../../scripts/render-readme.mjs';

function readRootFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildForbiddenPath(parts: number[]): string {
  return String.fromCharCode(...parts);
}

const forbiddenPaths = [
  buildForbiddenPath([100, 111, 99, 115, 47]),
  buildForbiddenPath([0x9700, 0x6C42, 47]),
];

const mirroredSections = [
  '项目简介 / Project Overview',
  '功能宇宙 / Feature Universe',
  '核心体验主线 / Experience Flow',
  '需求闭环地图 / Requirement Closure Map',
  '浏览器能力编排 / Browser Capability Orchestration',
  '为什么值得看 / Why This Implementation Is Worth Reading',
  '快速开始 / Quick Start',
  '部署与发布 / Deployment and Release',
  '仓库边界 / Repository Boundary',
  '许可 / License',
];

function clauseRefKey(entry: { docId: string; clause: string }): string {
  return `${entry.docId}:${entry.clause}`;
}

describe('requirement registry and README alignment', () => {
  it('covers every source clause by doc-qualified clause refs', () => {
    const coveredClauseRefs = new Set(
      requirementFeatureCatalog.flatMap((feature) => feature.coveredClauseRefs.map(clauseRefKey)),
    );

    const uncoveredClauses = requirementSourceInventory.filter(
      (entry) => !coveredClauseRefs.has(clauseRefKey(entry)),
    );

    expect(uncoveredClauses).toEqual([]);
  });

  it('keeps every coveredClauseRef resolvable against the public source inventory', () => {
    const sourceKeys = new Set(requirementSourceInventory.map(clauseRefKey));

    for (const feature of requirementFeatureCatalog) {
      for (const clauseRef of feature.coveredClauseRefs) {
        expect(sourceKeys.has(clauseRefKey(clauseRef))).toBe(true);
      }
    }
  });

  it('requires explicit doc-qualified refs for cross-document features', () => {
    const sourceDocByClause = new Map(
      requirementSourceInventory.map((entry) => [entry.clause, entry.docId]),
    );

    const crossDocFeatures = requirementFeatureCatalog.filter((feature) =>
      feature.coveredClauses.some((clause) => sourceDocByClause.get(clause) !== feature.sourceDoc),
    );

    expect(crossDocFeatures.length).toBeGreaterThan(0);

    for (const feature of crossDocFeatures) {
      expect(feature.coveredClauseRefs.length).toBe(feature.coveredClauses.length);
      expect(feature.coveredClauseRefs.some((clauseRef) => clauseRef.docId !== feature.sourceDoc)).toBe(
        true,
      );
    }
  });

  it('keeps unique ids, public statuses, complete entry metadata, and clean public Chinese fields', () => {
    const ids = new Set<string>();

    for (const feature of requirementFeatureCatalog) {
      expect(isNonEmptyString(feature.id)).toBe(true);
      expect(isNonEmptyString(feature.titleEN)).toBe(true);
      expect(isNonEmptyString(feature.title)).toBe(true);
      expect(isNonEmptyString(feature.universeGroup)).toBe(true);
      expect(['mainline-native', 'mainline-fallback']).toContain(feature.status);
      expect(['native', 'fallback']).toContain(feature.runtimePath);
      expect(isNonEmptyString(feature.sourceDoc)).toBe(true);
      expect(isNonEmptyString(feature.sourceClause)).toBe(true);
      expect(isNonEmptyString(feature.experienceEntry)).toBe(true);
      expect(isNonEmptyString(feature.experienceEntryEN)).toBe(true);
      expect(isNonEmptyString(feature.runtimeSubsystem)).toBe(true);
      expect(isNonEmptyString(feature.readmeSummary)).toBe(true);
      expect(isNonEmptyString(feature.readmeSummaryEN)).toBe(true);
      expect(isNonEmptyString(feature.entrySurfaceCN)).toBe(true);
      expect(isNonEmptyString(feature.entrySurfaceEN)).toBe(true);
      expect(isNonEmptyString(feature.entryActionCN)).toBe(true);
      expect(isNonEmptyString(feature.entryActionEN)).toBe(true);
      expect(isNonEmptyString(feature.implementationTier)).toBe(true);
      expect(isNonEmptyString(feature.verificationId)).toBe(true);
      expect(Array.isArray(feature.modulePaths) && feature.modulePaths.length > 0).toBe(true);
      expect(Array.isArray(feature.coveredClauses) && feature.coveredClauses.length > 0).toBe(true);
      expect(Array.isArray(feature.coveredClauseRefs) && feature.coveredClauseRefs.length > 0).toBe(
        true,
      );
      expect(feature.coveredClauseRefs.length).toBe(feature.coveredClauses.length);
      expect(Array.isArray(feature.capabilityDependencies)).toBe(true);
      expect(feature.implementationTier).toBe(
        feature.status === 'mainline-native' ? 'native' : 'fallback',
      );

      for (const field of [
        feature.title,
        feature.experienceEntry,
        feature.dataSource,
        feature.fallbackMode,
        feature.validationScenario,
        feature.readmeSummary,
        feature.entrySurfaceCN,
        feature.entryActionCN,
      ]) {
        expect(field).not.toContain('??');
      }

      expect(ids.has(feature.id)).toBe(false);
      ids.add(feature.id);
    }

    expect(ids.size).toBe(requirementFeatureCatalog.length);
  });

  it('keeps the generated README mirrored, public-only, and in the expected section order', () => {
    const readme = readRootFile('README.md');
    const generated = buildReadmeMarkdown();

    expect(generated).toBe(readme);

    const sectionPositions = mirroredSections.map((section) => {
      const position = readme.indexOf(section);
      expect(position).toBeGreaterThan(-1);
      return position;
    });

    for (let index = 1; index < sectionPositions.length; index += 1) {
      expect(sectionPositions[index]).toBeGreaterThan(sectionPositions[index - 1]);
    }

    for (const group of requirementUniverseGroups) {
      expect(readme).toContain(group.titleEN);
      expect(readme).toContain(group.title);
    }

    for (const feature of requirementFeatureCatalog) {
      expect(readme).toContain(feature.titleEN);
      expect(readme).toContain(feature.title);
      expect(readme).toContain(feature.entrySurfaceEN);
      expect(readme).toContain(feature.entrySurfaceCN);
      expect(readme).toContain(feature.entryActionEN);
      expect(readme).toContain(feature.entryActionCN);
      expect(readme).toContain(clauseRefKey(feature.coveredClauseRefs[0]));
      expect(readme).not.toContain('mainline-simulated-with-explicit-label');
    }

    expect(readme).toContain('`docId + clause`');
    expect(readme).toContain('The public registry currently tracks coverage by `docId + clause`');
  });

  it('does not reference private requirement folders or internal docs folders from the README', () => {
    const readme = readRootFile('README.md');

    for (const forbiddenPath of forbiddenPaths) {
      expect(readme).not.toContain(forbiddenPath);
    }
  });
});
