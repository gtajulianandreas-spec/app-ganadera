# AI Cattle Advisory Assistant Modal

## Overview
Interactive conversational modal connecting farmers to an AI assistant with dual capabilities: answering questions about internal herd metrics and providing external veterinary/zootechnical advice.

## Interface
- `CattleAiChatModal`: Chat modal supporting quick-prompt chips, internal RAG herd analysis, and external agronomic Q&A (`CattleAiChatModal.tsx`).

## Invariants
- Questions about the herd query the local Dexie database for grounded metrics without external hallucination.
- Chat state retains message history across turns within the modal session.

## Side Effects
- Reads `db.animals`, `db.milkingRecords`, and `db.healthRecords` for local context synthesis.

## Verification
- Run: `npm run build`
