import { SlashCommandConfigurator } from './base.js';
import type { SlashCommandId } from '../../templates/index.js';

const FILE_PATHS: Record<SlashCommandId, string> = {
    enhance: '.forge/commands/anvil/enhance.md',
    'prd-generator': '.forge/commands/anvil/prd-generator.md',
    'prd-agent-generator': '.forge/commands/anvil/prd-agent-generator.md',
    'product-brief': '.forge/commands/anvil/product-brief.md',
    'epic-single': '.forge/commands/anvil/epic-single.md',
    'epic-generator': '.forge/commands/anvil/epic-generator.md',
    'story-single': '.forge/commands/anvil/story-single.md',
    'story-generator': '.forge/commands/anvil/story-generator.md',
    'qa-test-scenario': '.forge/commands/anvil/qa-test-scenario.md',
    'skill-creator': '.forge/commands/anvil/skill-creator.md',
    'ai-humanizer': '.forge/commands/anvil/ai-humanizer.md',
    'api-contract-generator': '.forge/commands/anvil/api-contract-generator.md',
    'apply': '.forge/commands/anvil/apply.md',
    'archive': '.forge/commands/anvil/archive.md',
    'design-system': '.forge/commands/anvil/design-system.md',
    'erd-generator': '.forge/commands/anvil/erd-generator.md',
    'fsd-generator': '.forge/commands/anvil/fsd-generator.md',
    'proposal': '.forge/commands/anvil/proposal.md',
    'tdd-generator': '.forge/commands/anvil/tdd-generator.md',
    'tdd-lite-generator': '.forge/commands/anvil/tdd-lite-generator.md',
    'wireframe-generator': '.forge/commands/anvil/wireframe-generator.md',
    'document-explainer': '.forge/commands/anvil/document-explainer.md'
};

export class ForgeConfigurator extends SlashCommandConfigurator {
    readonly toolId = 'forge';
    readonly isAvailable = true;

    protected getRelativePath(id: SlashCommandId): string {
        return FILE_PATHS[id];
    }

    protected getFrontmatter(id: SlashCommandId): string | undefined {
        return undefined;
    }

    protected getSkillTargetDir(skillName: string): string {
        return `.forge/skills/${skillName}`;
    }
}
