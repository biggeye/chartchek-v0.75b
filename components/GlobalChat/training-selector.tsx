"use client"

import { useState } from "react"
import { Check, ChevronDown, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useGlobalChatStore } from "@/store/chat/chatStore" 
import { Badge } from "@/components/ui/badge"

export default function TrainingSelector() {
  const [open, setOpen] = useState(false)
  const { availableTrainingDatasets, selectedTrainingDataset, setSelectedTrainingDataset } = useGlobalChatStore()

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "compliance":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "certification":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "guidelines":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "standards":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{selectedTrainingDataset.name}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search training datasets..." />
          <CommandList>
            <CommandEmpty>No training dataset found.</CommandEmpty>
            <CommandGroup>
              {availableTrainingDatasets.map((dataset: any) => (
                <CommandItem
                  key={dataset.id}
                  value={dataset.id}
                  onSelect={() => {
                    setSelectedTrainingDataset(dataset)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{dataset.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{dataset.organization}</span>
                    </div>
                    <Badge className={`text-[10px] px-1 py-0 ${getCategoryColor(dataset.category)}`}>
                      {dataset.category}
                    </Badge>
                  </div>
                  <Check
                    className={`ml-2 h-4 w-4 ${
                      selectedTrainingDataset.id === dataset.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

