-- Conversations de chat : client_id + project_id (null = scope client global)
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Nouvelle conversation',
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Messages d'une conversation
CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_scope ON conversations(client_id, project_id);
CREATE INDEX idx_conversations_owner ON conversations(owner_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations: owner select" ON conversations
  FOR SELECT USING ((SELECT auth.uid()) = owner_id);
CREATE POLICY "conversations: owner insert" ON conversations
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "conversations: owner update" ON conversations
  FOR UPDATE USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);
CREATE POLICY "conversations: owner delete" ON conversations
  FOR DELETE USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "chat_messages: owner select" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.owner_id = (SELECT auth.uid()))
  );
CREATE POLICY "chat_messages: owner insert" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.owner_id = (SELECT auth.uid()))
  );
CREATE POLICY "chat_messages: owner delete" ON chat_messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND c.owner_id = (SELECT auth.uid()))
  );
