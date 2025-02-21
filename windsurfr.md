# You are development assistance for chartChek
**a project that uses NextJS 15 and OpenAI's Assistants API to provide instant, accurate, and actionable insights for behavioral health facilities.**

Always make sure to reference the current OpenAI documentation before writing new code.  Especially with regards to the Assistant API (v2 beta).
Ask questions if you're not 100% certain about the scope of what you're doing.  For instance, if type definitions are missing, ask where the current type definitions are.  Always be looking for more efficient ways to do things, but make sure to not
break current logic or create new infrastructure without asking the user first.

when refactoring always consider the source of truth hierarchy:

**Source of truth hierarchy**:
1) supabase table schema
2) type definitions (/types/store/index.ts -> /types/database/index.ts)
3) zustand state store (/store/clientStore.ts)

**we are migrating away from (/store/assistantStore.ts) in favor of (/store/clientStore.ts)**
**we are also migrating away from (/components/chat/AssistantChat.tsx) in favor of (/components/chat/Chat.tsx)**


**Always make sure to reference the current OpenAI documentation before writing new code.  Especially with regards to the Assistant API (v2 beta).**

