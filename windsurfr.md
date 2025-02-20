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

supabase tables:
| table_name               | column_name         | data_type                | is_nullable | column_default                                 |
| ------------------------ | ------------------- | ------------------------ | ----------- | ---------------------------------------------- |
| chat_message_annotations | id                  | uuid                     | NO          | uuid_generate_v4()                             |
| chat_message_annotations | message_id          | uuid                     | NO          | null                                           |
| chat_message_annotations | type                | text                     | NO          | null                                           |
| chat_message_annotations | text                | text                     | NO          | null                                           |
| chat_message_annotations | file_id             | text                     | YES         | null                                           |
| chat_message_annotations | quote               | text                     | YES         | null                                           |
| chat_message_annotations | start_index         | integer                  | YES         | null                                           |
| chat_message_annotations | end_index           | integer                  | YES         | null                                           |
| chat_message_annotations | created_at          | timestamp with time zone | YES         | now()                                          |
| chat_messages            | id                  | uuid                     | NO          | uuid_generate_v4()                             |
| chat_messages            | created_at          | timestamp with time zone | YES         | now()                                          |
| chat_messages            | updated_at          | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| chat_messages            | role                | text                     | NO          | null                                           |
| chat_messages            | message_id          | text                     | NO          | null                                           |
| chat_messages            | user_id             | uuid                     | NO          | null                                           |
| chat_messages            | thread_id           | text                     | NO          | null                                           |
| chat_messages            | file_ids            | ARRAY                    | YES         | ARRAY[]::text[]                                |
| chat_messages            | metadata            | jsonb                    | YES         | null                                           |
| chat_messages            | content             | jsonb                    | NO          | null                                           |
| chat_threads             | id                  | uuid                     | NO          | uuid_generate_v4()                             |
| chat_threads             | user_id             | uuid                     | NO          | null                                           |
| chat_threads             | assistant_id        | text                     | YES         | null                                           |
| chat_threads             | status              | USER-DEFINED             | YES         | 'queued'::thread_status                        |
| chat_threads             | created_at          | timestamp with time zone | YES         | now()                                          |
| chat_threads             | updated_at          | timestamp with time zone | YES         | now()                                          |
| chat_threads             | metadata            | ARRAY                    | YES         | null                                           |
| chat_threads             | thread_id           | text                     | NO          | null                                           |
| chat_threads             | title               | text                     | YES         | null                                           |
| chat_threads             | last_message_at     | timestamp with time zone | YES         | null                                           |
| chat_threads             | is_active           | boolean                  | YES         | true                                           |
| chat_threads             | vector_store_id     | text                     | YES         | null                                           |
| documents                | document_id         | uuid                     | NO          | uuid_generate_v4()                             |
| documents                | user_id             | uuid                     | NO          | null                                           |
| documents                | facility_id         | uuid                     | YES         | null                                           |
| documents                | bucket              | character varying        | NO          | null                                           |
| documents                | file_path           | text                     | NO          | null                                           |
| documents                | file_name           | character varying        | YES         | null                                           |
| documents                | file_type           | character varying        | YES         | null                                           |
| documents                | created_at          | timestamp with time zone | NO          | now()                                          |
| documents                | updated_at          | timestamp with time zone | NO          | now()                                          |
| facilities               | facility_id         | uuid                     | NO          | uuid_generate_v4()                             |
| facilities               | owner_id            | uuid                     | NO          | null                                           |
| facilities               | name                | character varying        | NO          | null                                           |
| facilities               | address             | text                     | YES         | null                                           |
| facilities               | created_at          | timestamp with time zone | NO          | now()                                          |
| facilities               | updated_at          | timestamp with time zone | NO          | now()                                          |
| profiles                 | id                  | uuid                     | NO          | null                                           |
| profiles                 | full_name           | character varying        | YES         | null                                           |
| profiles                 | created_at          | timestamp with time zone | NO          | now()                                          |
| profiles                 | updated_at          | timestamp with time zone | NO          | now()                                          |
| store_new_function       | id                  | integer                  | NO          | nextval('store_new_function_id_seq'::regclass) |
| store_new_function       | function_name       | character varying        | NO          | null                                           |
| store_new_function       | type                | character varying        | NO          | null                                           |
| store_new_function       | components          | jsonb                    | YES         | null                                           |
| store_new_function       | agency              | character varying        | YES         | null                                           |
| store_new_function       | additional          | jsonb                    | YES         | null                                           |
| store_new_function       | created_at          | timestamp with time zone | YES         | CURRENT_TIMESTAMP                              |
| summarize_eob_payouts    | id                  | uuid                     | NO          | gen_random_uuid()                              |
| summarize_eob_payouts    | patient_name        | text                     | NO          | null                                           |
| summarize_eob_payouts    | policy_number       | text                     | NO          | null                                           |
| summarize_eob_payouts    | auth_days_requested | numeric                  | NO          | null                                           |
| summarize_eob_payouts    | auth_days_approved  | numeric                  | NO          | null                                           |
| summarize_eob_payouts    | amount_billed       | numeric                  | NO          | null                                           |
| summarize_eob_payouts    | amount_awarded      | numeric                  | NO          | null                                           |
| summarize_eob_payouts    | time_period         | text                     | NO          | null                                           |
| summarize_eob_payouts    | created_at          | timestamp with time zone | NO          | now()                                          |
| user_assistants          | id                  | uuid                     | NO          | gen_random_uuid()                              |
| user_assistants          | created_at          | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| user_assistants          | user_id             | uuid                     | NO          | null                                           |
| user_assistants          | assistant_id        | text                     | NO          | null                                           |
| user_assistants          | name                | text                     | YES         | null                                           |
| user_assistants          | instructions        | text                     | YES         | null                                           |
| user_assistants          | description         | text                     | YES         | null                                           |
| user_assistants          | model               | text                     | NO          | 'gpt-4-1106-preview'::text                     |
| user_assistants          | tools               | ARRAY                    | YES         | ARRAY[]::jsonb[]                               |
| user_assistants          | file_ids            | ARRAY                    | YES         | ARRAY[]::text[]                                |
| user_assistants          | metadata            | jsonb                    | YES         | null                                           |
| user_assistants          | is_active           | boolean                  | YES         | true                                           |
| user_assistants          | vector_store_id     | text                     | YES         | null                                           |
| user_assistants          | updated_at          | timestamp with time zone | YES         | now()                                          |
| user_facilities          | user_id             | uuid                     | NO          | null                                           |
| user_facilities          | facility_id         | uuid                     | NO          | null                                           |
| user_facilities          | role                | USER-DEFINED             | NO          | null                                           |
| user_facilities          | assigned_at         | timestamp with time zone | NO          | now()                                          |