| table_name      | column_name     | data_type                |
| --------------- | --------------- | ------------------------ |
| chat_messages   | id              | uuid                     |
| chat_messages   | created_at      | timestamp with time zone |
| chat_messages   | updated_at      | timestamp with time zone |
| chat_messages   | role            | text                     |
| chat_messages   | message_id      | text                     |
| chat_messages   | user_id         | uuid                     |
| chat_messages   | thread_id       | text                     |
| chat_messages   | file_ids        | ARRAY                    |
| chat_messages   | metadata        | jsonb                    |
| chat_messages   | content         | jsonb                    |
| chat_threads    | id              | uuid                     |
| chat_threads    | user_id         | uuid                     |
| chat_threads    | assistant_id    | text                     |
| chat_threads    | status          | USER-DEFINED             |
| chat_threads    | created_at      | timestamp with time zone |
| chat_threads    | updated_at      | timestamp with time zone |
| chat_threads    | metadata        | ARRAY                    |
| chat_threads    | thread_id       | text                     |
| chat_threads    | title           | text                     |
| chat_threads    | last_message_at | timestamp with time zone |
| chat_threads    | is_active       | boolean                  |
| chat_threads    | vector_store_id | text                     |
| documents       | document_id     | uuid                     |
| documents       | user_id         | uuid                     |
| documents       | facility_id     | uuid                     |
| documents       | bucket          | character varying        |
| documents       | file_path       | text                     |
| documents       | file_name       | character varying        |
| documents       | file_type       | character varying        |
| documents       | created_at      | timestamp with time zone |
| documents       | updated_at      | timestamp with time zone |
| documents       | file_size       | character varying        |
| documents       | metadata        | ARRAY                    |
| documents       | openai_file_id  | text                     |
| facilities      | facility_id     | uuid                     |
| facilities      | owner_id        | uuid                     |
| facilities      | name            | character varying        |
| facilities      | address         | text                     |
| facilities      | created_at      | timestamp with time zone |
| facilities      | updated_at      | timestamp with time zone |
| profiles        | user_id         | uuid                     |
| profiles        | first_name      | character varying        |
| profiles        | created_at      | timestamp with time zone |
| profiles        | updated_at      | timestamp with time zone |
| profiles        | last_name       | character varying        |
| profiles        | is_owner        | boolean                  |
| profiles        | email           | text                     |
| user_assistants | id              | uuid                     |
| user_assistants | created_at      | timestamp with time zone |
| user_assistants | user_id         | uuid                     |
| user_assistants | assistant_id    | text                     |
| user_assistants | name            | text                     |
| user_assistants | instructions    | text                     |
| user_assistants | description     | text                     |
| user_assistants | model           | text                     |
| user_assistants | tools           | ARRAY                    |
| user_assistants | file_ids        | ARRAY                    |
| user_assistants | metadata        | jsonb                    |
| user_assistants | is_active       | boolean                  |
| user_assistants | vector_store_id | text                     |
| user_assistants | updated_at      | timestamp with time zone |
| user_facilities | user_id         | uuid                     |
| user_facilities | facility_id     | uuid                     |
| user_facilities | role            | USER-DEFINED             |
| user_facilities | assigned_at     | timestamp with time zone |