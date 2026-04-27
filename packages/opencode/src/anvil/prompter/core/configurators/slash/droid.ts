import { SlashCommandConfigurator } from './base.js';
import type { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
    enhance: '.factory/commands/anvil/enhance.md',
    'prd-generator': '.factory/commands/anvil/prd-generator.md',
    'prd-agent-generator': '.factory/commands/anvil/prd-agent-generator.md',
    'product-brief': '.factory/commands/anvil/product-brief.md',
    'epic-single': '.factory/commands/anvil/epic-single.md',
    'epic-generator': '.factory/commands/anvil/epic-generator.md',
    'story-single': '.factory/commands/anvil/story-single.md',
    'story-generator': '.factory/commands/anvil/story-generator.md',
    'qa-test-scenario': '.factory/commands/anvil/qa-test-scenario.md',
    'skill-creator': '.factory/commands/anvil/skill-creator.md',
    'ai-humanizer': '.factory/commands/anvil/ai-humanizer.md',
    'api-contract-generator': '.factory/commands/anvil/api-contract-generator.md',
    'apply': '.factory/commands/anvil/apply.md',
    'archive': '.factory/commands/anvil/archive.md',
    'design-system': '.factory/commands/anvil/design-system.md',
    'erd-generator': '.factory/commands/anvil/erd-generator.md',
    'fsd-generator': '.factory/commands/anvil/fsd-generator.md',
    'proposal': '.factory/commands/anvil/proposal.md',
    'tdd-generator': '.factory/commands/anvil/tdd-generator.md',
    'tdd-lite-generator': '.factory/commands/anvil/tdd-lite-generator.md',
    'wireframe-generator': '.factory/commands/anvil/wireframe-generator.md',
    'document-explainer': '.factory/commands/anvil/document-explainer.md'
};

export class DroidConfigurator extends SlashCommandConfigurator {
    readonly toolId = 'droid';
    readonly isAvailable = true;

    protected getRelativePath(id: SlashCommandId): string {
        return FILE_PATHS[id];
    }

    protected getFrontmatter(id: SlashCommandId): string | undefined {
        return undefined;
    }

    protected getSkillTargetDir(skillName: string): string {
        return `.factory/skills/${skillName}`;
    }
}
