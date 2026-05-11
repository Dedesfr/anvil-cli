import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { PROMPTER_DIR, PrompterConfig } from '../core/config.js';
import { projectTemplate, agentsTemplate, claudeTemplate } from '../core/templates/index.js';

interface InitOptions {
    noInteractive?: boolean;
}

export class InitCommand {
    async execute(options: InitOptions = {}): Promise<void> {
        const projectPath = process.cwd();
        const isReInitialization = await PrompterConfig.prompterDirExists(projectPath);

        if (!isReInitialization) {
            console.log(chalk.cyan(`
   █████  ███    ██ ██    ██ ██ ██
  ██   ██ ████   ██ ██    ██ ██ ██
  ███████ ██ ██  ██ ██    ██ ██ ██
  ██   ██ ██  ██ ██  ██  ██  ██ ██
  ██   ██ ██   ████   ████   ██ ███████
`));
            console.log(chalk.white.bold('Welcome to Anvil!\n'));
        }

        if (isReInitialization) {
            console.log(chalk.blue('\n🔄 Updating Anvil workspace...\n'));
        } else {
            console.log(chalk.blue('🚀 Initializing Anvil workspace...\n'));
        }

        // Create prompter workspace directory
        const prompterPath = await PrompterConfig.ensurePrompterDir(projectPath);
        if (!isReInitialization) {
            console.log(chalk.green('✓') + ` Created ${chalk.cyan(PROMPTER_DIR + '/')}`);
        }

        // Create project.md
        const projectMdPath = path.join(prompterPath, 'project.md');
        if (!await this.fileExists(projectMdPath)) {
            await fs.writeFile(projectMdPath, projectTemplate, 'utf-8');
            console.log(chalk.green('✓') + ` Created ${chalk.cyan(PROMPTER_DIR + '/project.md')}`);
        } else if (isReInitialization) {
            console.log(chalk.gray('  project.md already exists, keeping it'));
        }

        // Create/update AGENTS.md
        const agentsMdPath = path.join(prompterPath, 'AGENTS.md');
        const agentsExisted = await this.fileExists(agentsMdPath);
        await fs.writeFile(agentsMdPath, agentsTemplate, 'utf-8');
        console.log(chalk.green('✓') + ` ${agentsExisted ? 'Updated' : 'Created'} ${chalk.cyan(PROMPTER_DIR + '/AGENTS.md')}`);

        // Create/update CLAUDE.md
        const claudeMdPath = path.join(prompterPath, 'CLAUDE.md');
        const claudeExisted = await this.fileExists(claudeMdPath);
        await fs.writeFile(claudeMdPath, claudeTemplate, 'utf-8');
        console.log(chalk.green('✓') + ` ${claudeExisted ? 'Updated' : 'Created'} ${chalk.cyan(PROMPTER_DIR + '/CLAUDE.md')}`);

        // Ensure root AGENTS.md and CLAUDE.md have Anvil instructions
        await this.ensureRootAgentsFile(projectPath);
        await this.ensureRootClaudeFile(projectPath);

        if (isReInitialization) {
            console.log(chalk.green('\n✅ Anvil workspace updated!\n'));
        } else {
            console.log(chalk.green('\n✅ Anvil workspace initialized!\n'));
            console.log(chalk.gray('Run `anvil guide` for next steps.\n'));
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try { await fs.access(filePath); return true; } catch { return false; }
    }

    private async ensureRootClaudeFile(projectPath: string): Promise<void> {
        const rootClaudePath = path.join(projectPath, 'CLAUDE.md');
        const instructionsBlock = `<!-- PROMPTER:START -->
# Anvil Workspace Instructions

These instructions are for AI assistants working in this project.

Always open \`@/anvil/CLAUDE.md\` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use \`@/anvil/CLAUDE.md\` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines
- Show Remaining Tasks

<!-- PROMPTER:END -->`;

        if (!await this.fileExists(rootClaudePath)) {
            await fs.writeFile(rootClaudePath, instructionsBlock + '\n', 'utf-8');
            console.log(chalk.green('✓') + ` Created ${chalk.cyan('CLAUDE.md')} in root`);
        } else {
            const content = await fs.readFile(rootClaudePath, 'utf-8');
            const startIdx = content.indexOf('<!-- PROMPTER:START -->');
            const endIdx = content.indexOf('<!-- PROMPTER:END -->');
            if (startIdx === -1 || endIdx === -1) {
                await fs.writeFile(rootClaudePath, instructionsBlock + '\n\n' + content, 'utf-8');
                console.log(chalk.green('✓') + ` Added Anvil instructions to ${chalk.cyan('CLAUDE.md')}`);
            } else {
                const before = content.substring(0, startIdx);
                const after = content.substring(endIdx + '<!-- PROMPTER:END -->'.length);
                await fs.writeFile(rootClaudePath, before + instructionsBlock + after, 'utf-8');
                console.log(chalk.gray('  CLAUDE.md instructions block updated'));
            }
        }
    }

    private async ensureRootAgentsFile(projectPath: string): Promise<void> {
        const rootAgentsPath = path.join(projectPath, 'AGENTS.md');
        const instructionsBlock = `<!-- PROMPTER:START -->
# Anvil Workspace Instructions

These instructions are for AI assistants working in this project.

Always open \`@/anvil/AGENTS.md\` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use \`@/anvil/AGENTS.md\` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines
- Show Remaining Tasks

<!-- PROMPTER:END -->`;

        if (!await this.fileExists(rootAgentsPath)) {
            await fs.writeFile(rootAgentsPath, instructionsBlock + '\n', 'utf-8');
            console.log(chalk.green('✓') + ` Created ${chalk.cyan('AGENTS.md')} in root`);
        } else {
            const content = await fs.readFile(rootAgentsPath, 'utf-8');
            const startIdx = content.indexOf('<!-- PROMPTER:START -->');
            const endIdx = content.indexOf('<!-- PROMPTER:END -->');
            if (startIdx === -1 || endIdx === -1) {
                await fs.writeFile(rootAgentsPath, instructionsBlock + '\n\n' + content, 'utf-8');
                console.log(chalk.green('✓') + ` Added Anvil instructions to ${chalk.cyan('AGENTS.md')}`);
            } else {
                const before = content.substring(0, startIdx);
                const after = content.substring(endIdx + '<!-- PROMPTER:END -->'.length);
                await fs.writeFile(rootAgentsPath, before + instructionsBlock + after, 'utf-8');
                console.log(chalk.gray('  AGENTS.md instructions block updated'));
            }
        }
    }
}
