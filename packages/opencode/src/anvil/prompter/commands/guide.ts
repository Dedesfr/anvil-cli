import chalk from 'chalk';

export class GuideCommand {
    async execute(): Promise<void> {
        console.log(chalk.blue('\nGuides:'));
        console.log(chalk.gray('  1. Provide a detailed and filled-out version of the "anvil/project.md"'));
        console.log(chalk.gray('     document based on the project\'s specifics, including a clear description'));
        console.log(chalk.gray('     of the project, its purpose, the technologies used (tech stack), and any'));
        console.log(chalk.gray('     conventions or standards being followed.'));
        
        console.log(chalk.blue('\nDocument Workflow & Dependencies:'));
        console.log(chalk.gray('  This table shows the recommended order for document generation:\n'));
        
        // Print table header
        console.log(chalk.cyan('  Document         │ Required Inputs                       │ Extra Inputs                      │ Recommended Model'));
        console.log(chalk.cyan('  ─────────────────┼───────────────────────────────────────┼───────────────────────────────────┼──────────────────────────'));
        
        // Table rows
        const rows = [
            ['Product Brief   ', '—                                    ', '—                                ', 'Opus'],
            ['PRD             ', 'Product Brief                        ', '—                                ', 'Sonnet'],
            ['FSD             ', 'PRD                                  ', 'Product Brief                    ', 'Sonnet'],
            ['ERD             ', 'FSD                                  ', '—                                ', 'Sonnet'],
            ['API Contract    ', 'FSD + ERD                            ', '—                                ', 'Sonnet / GPT 5.2 Codex'],
            ['UI Wireframes   ', 'FSD + ERD + API Contract             ', '—                                ', 'Gemini 3 Pro / Sonnet'],
            ['Design System   ', 'UI Wireframes (new) / FSD (existing) ', 'Brand guide / existing UI        ', 'Sonnet'],
            ['TDD             ', 'FSD                                  ', 'ERD + API + UI + Design System   ', 'Sonnet'],
            ['Epics           ', 'FSD + TDD-Lite                       ', 'UI Wireframes + Design System    ', 'Sonnet'],
            ['Stories         ', 'Epics                                ', 'FSD + UI Wireframes + API        ', 'Sonnet'],
            ['Proposal        ', 'Specs (FSD/TDD/etc)                  ', '—                                ', 'Opus'],
            ['Apply           ', 'Approved Proposal                    ', '—                                ', 'Sonnet / Gemini 3 / GPT 5.2 / GLM / Haiku']
        ];
        
        rows.forEach(row => {
            console.log(chalk.gray(`  ${row[0]} │ ${row[1]} │ ${row[2]} │ ${row[3]}`));
        });

        console.log(chalk.blue('\n Complexity-Based Workflows:'));
        console.log(chalk.gray('  Small    → Brief → FSD → Design System → Stories'));
        console.log(chalk.gray('  Medium   → Brief → PRD → FSD → UI → Design System → Stories'));
        console.log(chalk.gray('  High     → Brief → PRD → FSD → ERD → API → UI → Design System → TDD → Epics → Stories'));

        console.log(chalk.blue('\n Prompter Solo Dev 🤓 Workflow:'));
        console.log(chalk.green.bold(' Step 1 📄: Brief → PRD → Epic (Foundation)'));
        console.log(chalk.green.bold(' Step 2 🚀: [ Proposal ⇄ Apply ⇄ Archive ] ↺ (Development Loop)'));
        console.log(chalk.gray('     • Initial setup: Create Brief, PRD and Epic to establish context.'));
        console.log(chalk.gray('     • Active Dev: Repeat Step 2 for every feature, bugfix, or improvement.'));
        console.log(chalk.gray('     • Archive step automatically updates your specs to keep them current.'));
    }
}