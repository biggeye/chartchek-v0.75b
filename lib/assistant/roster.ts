import type { AssistantCreateParams } from 'openai/resources/beta/assistants'

// Assistant configuration roster
export const assistantRoster = [
  {
    key: "default",
    name: "chartChek Assistant",
    assistant_id: "asst_9RqcRDt3vKUEFiQeA0HfLC08",  
    tools: [{ type: "code_interpreter" }] as AssistantCreateParams['tools'],
    model: "gpt-4o"
  },
  {
    key: "billing",
    name: "Accounts & Billing",
    assistant_id: "asst_7rzhAUWAamYufZJjZeKYkX1t",
       tools: [{ type: "file_search" }] as AssistantCreateParams['tools'],
    model: "gpt-4o"
  },
  {
    key: "tjc",
    assistant_id: "asst_CAjCQW3Lkif3FuAOFCQBaOh0",
    name: "Joint Commission Specialist",
    tools: [{ type: "file_search" }] as AssistantCreateParams['tools'],
    model: "gpt-4o"
  },
  {
    key: "dhcs",
    name: "DHCS Compliance Expert",
    tools: [{ type: "file_search" }] as AssistantCreateParams['tools'],
    model: "gpt-4o"
  },
  {
    key: "docPress",
    assistant_id: "asst_G2MphVdxJQ4bTkKTQvQgUHGX",
    name: "docPress",
    tools: [{ type: "file_search" }] as AssistantCreateParams['tools'],
    model: "gpt-4o"
  }
];
