# Updated Endpoints

## 1) `/api/agent` (generateText + tools)

### 1.1 Basic DB question (SELECT via `generate_sql` + `run_sql`)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me the 5 most recently accessed chats from the chat_ids table."
  }'
```

### 1.2 Save / upsert a chat (`save_chat` → `upsertChat` with numeric id)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Save a new chat with id 1 and content \"Stored through the first agent.\""
  }'
```

### 1.3 Update existing chat content (same id, new content)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Update the chat with id 1 so that its content is now \"This chat was updated by the first agent.\""
  }'
```

### 1.4 Fetch a chat by id (`get_chat` → `getChatById`)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Load the chat with id 1 from chat_ids and summarize its content for me."
  }'
```

### 1.5 List recent chats (`list_chats` / SQL tools)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "List the 10 most recently accessed chats from the chat_ids table and briefly describe each."
  }'
```

### 1.6 Delete a chat (`delete_chat` → `deleteChatById`)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Delete the chat with id 1 from the chat_ids table."
  }'
```

### 1.7 Ask it to explain its SQL (`explain_sql`)

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me the SQL you would use to get the 5 most recently accessed chats and explain that SQL step by step."
  }'
```

---

## 2) `/api/second-agent` (triage agent → dbAgent / generalAgent)

Assuming this route is exposed as `/api/second-agent`.

### 2.1 General non-DB question (should route to `generalAgent`)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Tell me an interesting fact about PostgreSQL."
  }'
```

### 2.2 DB-specific question (triage → `dbAgent`, uses SQL tools)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me the last 5 entries in the chat_ids table ordered by last_date_accessed."
  }'
```

### 2.3 Save / upsert a chat via triage (`save_chat` with numeric id)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Save a new chat with id 2 and content \"Stored through the triage agent.\""
  }'
```

### 2.4 Update that chat via triage

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Update the chat with id 2 so that its content reads \"This chat was updated via the triage agent.\""
  }'
```

### 2.5 Fetch a specific chat via triage (`get_chat`)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Fetch the chat with id 2 from chat_ids and summarize its content."
  }'
```

### 2.6 List recent chats via triage (`list_chats` / SQL tools)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "List the 10 most recently accessed chats from the chat_ids table and give a short description of each."
  }'
```

### 2.7 Delete a chat via triage (`delete_chat`)

```bash
curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Delete the chat with id 2 from the chat_ids Postgres table."
  }'
```

## Succefully Executed Commands

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Update the chat with id 0001 so that its content is now \"This chat was updated by the first agent.\""
  }'
```


----------

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Load the chat with id 0001 from chat_ids and summarize its content for me."
  }'

```

  ----------------
```bash
  curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Save a new chat with id 0002 and content \"Stored through the triage agent.\""
  }'
```


```bash

curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Update the chat with id 0002 so that its content reads \"This chat was updated via the triage agent.\""
  }'
```

```bash

curl -X POST http://localhost:3000/api/second-agent \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Fetch the chat with id 0002 from chat_ids and summarize its content."
  }'

```