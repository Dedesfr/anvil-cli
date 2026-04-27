import { AVAILABLE_PROMPTS } from "@/anvil/prompter/core/config"
import { PROMPT_TEMPLATES } from "@/anvil/prompter/core/prompt-templates"

export const TEMPLATE_COMMANDS = AVAILABLE_PROMPTS.map((p) => ({
  name: p.value,
  title: p.name,
  description: p.description,
}))

export function getTemplateContent(name: string): string | undefined {
  return PROMPT_TEMPLATES[name as keyof typeof PROMPT_TEMPLATES]
}

export function isTemplateCommand(name: string): boolean {
  return AVAILABLE_PROMPTS.some((p) => p.value === name)
}
