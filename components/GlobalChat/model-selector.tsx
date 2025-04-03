"use client"

import { useState } from "react"
import { Check, ChevronDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGlobalChatStore } from "@/store/chat/globalChatStore"

export default function ModelSelector() {
  const [open, setOpen] = useState(false)
  const { availableModels, selectedModel, setSelectedModel } = useGlobalChatStore()

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "openai":
        return "text-green-500"
      case "anthropic":
        return "text-purple-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className={`h-4 w-4 ${getProviderColor(selectedModel.provider)}`} />
            <span className="truncate">{selectedModel.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {availableModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    setSelectedModel(model)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Sparkles className={`h-4 w-4 ${getProviderColor(model.provider)}`} />
                    <span className="flex-1 truncate">{model.name}</span>
                  </div>
                  <Check className={`h-4 w-4 ${selectedModel.id === model.id ? "opacity-100" : "opacity-0"}`} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

