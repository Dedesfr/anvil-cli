import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { checkbox } from '@inquirer/prompts';
import { PROMPTER_DIR, SUPPORTED_TOOLS, PrompterConfig } from '../core/config.js';
import { projectTemplate, agentsTemplate, claudeTemplate } from '../core/templates/index.js';
import { registry } from '../core/configurators/slash/index.js';
import type { SlashCommandId } from '../core/templates/index.js';

// Workflow commands always installed — these are the only ones written to disk
const WORKFLOW_COMMANDS: SlashCommandId[] = ['proposal', 'apply', 'archive'];

interface InitOptions {
    tools?: string[];
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
            console.log(chalk.blue('\n🔄 Re-configuring Anvil tools...\n'));
        } else {
            console.log(chalk.blue('🚀 Initializing Anvil workspace...\n'));
        }

        // Detect currently configured tools if re-initializing
        let currentTools: string[] = [];
        if (isReInitialization) {
            currentTools = await this.detectConfiguredTools(projectPath);
            if (currentTools.length > 0) {
                console.log(chalk.gray('Currently configured tools: ') + chalk.cyan(currentTools.map(t => {
                    const tool = SUPPORTED_TOOLS.find(st => st.value === t);
                    return tool ? tool.name : t;
                }).join(', ')));
                console.log();
            }
        }

        // Select tools
        let selectedTools: string[] = [];

        if (options.tools && options.tools.length > 0) {
            selectedTools = options.tools.flatMap(tool => tool.split(',').map(t => t.trim()));
        } else if (!options.noInteractive) {
            try {
                const message = isReInitialization
                    ? 'Select AI tools to configure (check/uncheck to add/remove):'
                    : 'Select AI tools to configure:';

                selectedTools = await checkbox({
                    message,
                    choices: SUPPORTED_TOOLS.map(tool => ({
                        name: tool.name,
                        value: tool.value,
                        checked: isReInitialization ? currentTools.includes(tool.value) : false,
                    }))
                });
            } catch {
                console.log(chalk.yellow(isReInitialization ? '\nRe-configuration cancelled.' : '\nInitialization cancelled.'));
                return;
            }
        } else if (isReInitialization && selectedTools.length === 0) {
            selectedTools = currentTools;
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

        // Create AGENTS.md
        const agentsMdPath = path.join(prompterPath, 'AGENTS.md');
        await fs.writeFile(agentsMdPath, agentsTemplate, 'utf-8');
        console.log(chalk.green('✓') + ` ${await this.fileExists(agentsMdPath) ? 'Updated' : 'Created'} ${chalk.cyan(PROMPTER_DIR + '/AGENTS.md')}`);

        // Create CLAUDE.md
        const claudeMdPath = path.join(prompterPath, 'CLAUDE.md');
        await fs.writeFile(claudeMdPath, claudeTemplate, 'utf-8');
        console.log(chalk.green('✓') + ` ${await this.fileExists(claudeMdPath) ? 'Updated' : 'Created'} ${chalk.cyan(PROMPTER_DIR + '/CLAUDE.md')}`);

        // Ensure root AGENTS.md and CLAUDE.md have Anvil instructions
        await this.ensureRootAgentsFile(projectPath);
        await this.ensureRootClaudeFile(projectPath);

        // Handle tool changes
        const toolsToAdd = selectedTools.filter(t => !currentTools.includes(t));
        const toolsToRemove = currentTools.filter(t => !selectedTools.includes(t));
        const toolsToKeep = selectedTools.filter(t => currentTools.includes(t));

        // Remove old tool files
        if (toolsToRemove.length > 0) {
            console.log(chalk.blue('\n🗑️  Removing workflow files...\n'));
            for (const toolId of toolsToRemove) {
                const configurator = registry.get(toolId);
                if (configurator) {
                    try {
                        const files = await this.removeToolFiles(projectPath, configurator);
                        for (const file of files) {
                            console.log(chalk.yellow('✓') + ` Removed ${chalk.cyan(file)}`);
                        }
                    } catch (error) {
                        console.log(chalk.red('✗') + ` Failed to remove files for ${toolId}: ${error}`);
                    }
                }
            }
        }

        // Generate workflow files for new tools (proposal/apply/archive only)
        if (toolsToAdd.length > 0) {
            console.log(chalk.blue('\n📝 Creating workflow files...\n'));
            for (const toolId of toolsToAdd) {
                const configurator = registry.get(toolId);
                if (configurator) {
                    try {
                        const files = await configurator.generateAll(projectPath, WORKFLOW_COMMANDS);
                        for (const file of files) {
                            console.log(chalk.green('✓') + ` Created ${chalk.cyan(file)}`);
                        }
                    } catch (error) {
                        console.log(chalk.red('✗') + ` Failed to create files for ${toolId}: ${error}`);
                    }
                }
            }
        }

        // Update kept tools (add missing workflow files)
        if (isReInitialization && toolsToKeep.length > 0) {
            for (const toolId of toolsToKeep) {
                const configurator = registry.get(toolId);
                if (configurator) {
                    try {
                        await configurator.generateAll(projectPath, WORKFLOW_COMMANDS);
                    } catch {
                        // ignore
                    }
                }
            }
        }

        // Done
        if (isReInitialization) {
            console.log(chalk.green('\n✅ Anvil workspace updated!\n'));
            const hasChanges = toolsToAdd.length > 0 || toolsToRemove.length > 0;
            if (hasChanges) {
                if (toolsToAdd.length > 0) console.log(chalk.green('  Tools Added: ') + toolsToAdd.map(t => SUPPORTED_TOOLS.find(st => st.value === t)?.name ?? t).join(', '));
                if (toolsToRemove.length > 0) console.log(chalk.yellow('  Tools Removed: ') + toolsToRemove.map(t => SUPPORTED_TOOLS.find(st => st.value === t)?.name ?? t).join(', '));
                console.log();
            } else {
                console.log(chalk.gray('  No changes made.\n'));
            }
        } else {
            console.log(chalk.green('\n✅ Anvil workspace initialized!\n'));
            console.log(chalk.gray('Proposal, apply, and archive workflows installed.\n'));
            console.log(chalk.gray('Run `anvil guide` for next steps.\n'));
        }
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try { await fs.access(filePath); return true; } catch { return false; }
    }

    private async detectConfiguredTools(projectPath: string): Promise<string[]> {
        const configuredTools: string[] = [];
        for (const configurator of registry.getAll()) {
            for (const target of configurator.getTargets()) {
                if (await this.fileExists(path.join(projectPath, target.path))) {
                    configuredTools.push(configurator.toolId);
                    break;
                }
            }
        }
        return configuredTools;
    }

    private async removeToolFiles(projectPath: string, configurator: any): Promise<string[]> {
        const removedFiles: string[] = [];
        for (const target of configurator.getTargets()) {
            const filePath = path.join(projectPath, target.path);
            if (await this.fileExists(filePath)) {
                await fs.unlink(filePath);
                removedFiles.push(target.path);
                await this.removeEmptyDirs(path.dirname(filePath), projectPath);
            }
        }
        return removedFiles;
    }

    private async removeEmptyDirs(dirPath: string, projectPath: string): Promise<void> {
        if (dirPath === projectPath || dirPath === path.dirname(projectPath)) return;
        try {
            const files = await fs.readdir(dirPath);
            if (files.length === 0) {
                await fs.rmdir(dirPath);
                await this.removeEmptyDirs(path.dirname(dirPath), projectPath);
            }
        } catch { /* ignore */ }
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
