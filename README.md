# Arquitetura Pivotada: Ollama + Gemma3 + Node-TS + Vite + Vanilla TS + Tailwind

## Estrutura

- `docker-compose.yml` — Ollama (Gemma3) via Docker
- `backend/` — Node-TS + Express (proxy stream para Ollama)
- `frontend/` — Vite + Vanilla TS + Tailwind CSS

## Como rodar

1. Inicie o Ollama com o modelo:
```bash
docker compose up -d
# dentro do container ou via CLI:
docker exec ollama-gemma3 ollama pull gemma3
# ou se já tiver o modelo:
docker exec ollama-gemma3 ollama run gemma3
```

2. Inicie o backend:
```bash
cd backend
npm install
npm run dev
```

3. Inicie o frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Acesse `http://localhost:5173` (Vite) que faz proxy para `http://localhost:4000`.

## System Prompt

O `main.ts` envia `system` no payload para o backend (`chain of drafts`).
