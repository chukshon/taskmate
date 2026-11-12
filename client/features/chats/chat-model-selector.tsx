"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ChatModelCatalog, ChatModelSelection } from "@/schemas/ai.schema"

export function ChatModelSelector({
  catalog,
  selection,
  disabled,
  onChange,
}: {
  catalog: ChatModelCatalog
  selection: ChatModelSelection
  disabled: boolean
  onChange: (selection: ChatModelSelection) => void
}) {
  const provider = catalog.providers.find(({ id }) => id === selection.provider)
  const providerItems = catalog.providers.map((item) => ({
    value: item.id,
    label: item.available ? item.name : `${item.name} (not configured)`,
  }))
  const defaultModel = provider?.models.find(
    ({ id }) => id === provider.defaultModel
  )
  const modelItems = [
    {
      value: "auto",
      label: `Auto${defaultModel ? ` · ${defaultModel.name}` : ""}`,
    },
    ...(provider?.models.map(({ id, name }) => ({ value: id, label: name })) ??
      []),
  ]

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <Select
        items={providerItems}
        value={selection.provider}
        disabled={disabled}
        onValueChange={(value) => {
          const nextProvider = catalog.providers.find(({ id }) => id === value)
          if (nextProvider?.available)
            onChange({ provider: nextProvider.id, model: "auto" })
        }}
      >
        <SelectTrigger aria-label="AI provider" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {catalog.providers.map((item) => (
              <SelectItem
                key={item.id}
                value={item.id}
                disabled={!item.available}
              >
                {providerItems.find(({ value }) => value === item.id)?.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        items={modelItems}
        value={selection.model}
        disabled={disabled || !provider?.available}
        onValueChange={(value) => {
          if (typeof value === "string")
            onChange({ ...selection, model: value })
        }}
      >
        <SelectTrigger aria-label="AI model" size="sm" className="max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {modelItems.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
