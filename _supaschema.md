| table_name      | column_name     | data_type                | is_nullable | column_default               |
| --------------- | --------------- | ------------------------ | ----------- | ---------------------------- |
| chat_messages   | id              | uuid                     | NO          | uuid_generate_v4()           |
| chat_messages   | created_at      | timestamp with time zone | YES         | now()                        |
| chat_messages   | updated_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| chat_messages   | role            | text                     | NO          | null                         |
| chat_messages   | message_id      | text                     | NO          | null                         |
| chat_messages   | user_id         | uuid                     | NO          | null                         |
| chat_messages   | thread_id       | text                     | NO          | null                         |
| chat_messages   | file_ids        | ARRAY                    | YES         | ARRAY[]::text[]              |
| chat_messages   | metadata        | jsonb                    | YES         | null                         |
| chat_messages   | content         | jsonb                    | NO          | null                         |
| chat_threads    | id              | uuid                     | NO          | uuid_generate_v4()           |
| chat_threads    | user_id         | uuid                     | NO          | null                         |
| chat_threads    | assistant_id    | text                     | YES         | null                         |
| chat_threads    | status          | USER-DEFINED             | YES         | 'queued'::thread_status      |
| chat_threads    | created_at      | timestamp with time zone | YES         | now()                        |
| chat_threads    | updated_at      | timestamp with time zone | YES         | now()                        |
| chat_threads    | metadata        | ARRAY                    | YES         | null                         |
| chat_threads    | thread_id       | text                     | NO          | null                         |
| chat_threads    | title           | text                     | YES         | null                         |
| chat_threads    | last_message_at | timestamp with time zone | YES         | null                         |
| chat_threads    | is_active       | boolean                  | YES         | true                         |
| chat_threads    | vector_store_id | text                     | YES         | null                         |
| documents       | document_id     | uuid                     | NO          | uuid_generate_v4()           |
| documents       | user_id         | uuid                     | NO          | null                         |
| documents       | facility_id     | uuid                     | YES         | null                         |
| documents       | bucket          | character varying        | NO          | null                         |
| documents       | file_path       | text                     | NO          | null                         |
| documents       | file_name       | character varying        | YES         | null                         |
| documents       | file_type       | character varying        | YES         | null                         |
| documents       | created_at      | timestamp with time zone | NO          | now()                        |
| documents       | updated_at      | timestamp with time zone | NO          | now()                        |
| facilities      | facility_id     | uuid                     | NO          | uuid_generate_v4()           |
| facilities      | owner_id        | uuid                     | NO          | null                         |
| facilities      | name            | character varying        | NO          | null                         |
| facilities      | address         | text                     | YES         | null                         |
| facilities      | created_at      | timestamp with time zone | NO          | now()                        |
| facilities      | updated_at      | timestamp with time zone | NO          | now()                        |
| profiles        | user_id         | uuid                     | NO          | null                         |
| profiles        | first_name      | character varying        | YES         | null                         |
| profiles        | created_at      | timestamp with time zone | NO          | now()                        |
| profiles        | updated_at      | timestamp with time zone | NO          | now()                        |
| profiles        | last_name       | character varying        | YES         | null                         |
| profiles        | is_owner        | boolean                  | NO          | false                        |
| profiles        | email           | text                     | YES         | null                         |
| user_assistants | id              | uuid                     | NO          | gen_random_uuid()            |
| user_assistants | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) |
| user_assistants | user_id         | uuid                     | NO          | null                         |
| user_assistants | assistant_id    | text                     | NO          | null                         |
| user_assistants | name            | text                     | YES         | null                         |
| user_assistants | instructions    | text                     | YES         | null                         |
| user_assistants | description     | text                     | YES         | null                         |
| user_assistants | model           | text                     | NO          | 'gpt-4-1106-preview'::text   |
| user_assistants | tools           | ARRAY                    | YES         | ARRAY[]::jsonb[]             |
| user_assistants | file_ids        | ARRAY                    | YES         | ARRAY[]::text[]              |
| user_assistants | metadata        | jsonb                    | YES         | null                         |
| user_assistants | is_active       | boolean                  | YES         | true                         |
| user_assistants | vector_store_id | text                     | YES         | null                         |
| user_assistants | updated_at      | timestamp with time zone | YES         | now()                        |
| user_facilities | user_id         | uuid                     | NO          | null                         |
| user_facilities | facility_id     | uuid                     | NO          | null                         |
| user_facilities | role            | USER-DEFINED             | NO          | null                         |
| user_facilities | assigned_at     | timestamp with time zone | NO          | now()                        |