import { DialogSelect, type DialogSelectOption } from "@tui/ui/dialog-select"
import { createResource, createMemo } from "solid-js"
import { useDialog } from "@tui/ui/dialog"
import { useSDK } from "@tui/context/sdk"
import { useToast } from "@tui/ui/toast"

export type DialogSkillProps = {
  onSelect: (skill: string) => void
}

export function DialogSkill(props: DialogSkillProps) {
  const dialog = useDialog()
  const sdk = useSDK()
  const toast = useToast()
  dialog.setSize("large")

  const [skills] = createResource(async () => {
    const result = await sdk.client.app.skills()
    if (result.error) {
      console.log("Loading skills failed:", result.error)
      toast.show({
        message: "Loading skills failed. Open console for more details.",
        variant: "error",
      })
      return []
    }
    return result.data ?? []
  })

  const options = createMemo<DialogSelectOption<string>[]>(() => {
    if (skills.loading) {
      return [
        {
          title: "Loading skills...",
          description: "Fetching available skills",
          value: "__loading__",
          category: "Skills",
        },
      ]
    }

    const list = skills() ?? []
    if (list.length === 0) {
      return [
        {
          title: "No skills found",
          description: "Configure skills in your Anvil/OpenCode config to use them here.",
          value: "__empty__",
          category: "Skills",
        },
      ]
    }

    const maxWidth = Math.max(0, ...list.map((s) => s.name.length))
    return list.map((skill) => ({
      title: skill.name.padEnd(maxWidth),
      description: skill.description?.replace(/\s+/g, " ").trim(),
      value: skill.name,
      category: "Skills",
      onSelect: () => {
        props.onSelect(skill.name)
        dialog.clear()
      },
    }))
  })

  return <DialogSelect title="Skills" placeholder="Search skills..." options={options()} />
}
