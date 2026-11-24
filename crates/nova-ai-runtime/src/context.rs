// nova-ai-runtime/src/context.rs — Context and Conversation History Manager

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MessageRole {
    User,
    Assistant,
    System,
    Tool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub tool_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemContext {
    pub os_name: String,
    pub os_version: String,
    pub active_workspace: u32,
    pub zero_trust_enforced: bool,
}

pub struct ContextManager {
    max_turns: usize,
    history: VecDeque<ChatMessage>,
    system_context: SystemContext,
}

impl Default for ContextManager {
    fn default() -> Self {
        Self::new(15)
    }
}

impl ContextManager {
    pub fn new(max_turns: usize) -> Self {
        Self {
            max_turns,
            history: VecDeque::new(),
            system_context: SystemContext {
                os_name: "NOVA OS".to_string(),
                os_version: "0.1.0-alpha".to_string(),
                active_workspace: 1,
                zero_trust_enforced: true,
            },
        }
    }

    pub fn add_message(&mut self, role: MessageRole, content: String, tool_name: Option<String>) {
        let msg = ChatMessage {
            id: format!("msg-{}", Utc::now().timestamp_millis()),
            role,
            content,
            timestamp: Utc::now(),
            tool_name,
        };
        self.history.push_back(msg);
        while self.history.len() > self.max_turns {
            self.history.pop_front();
        }
    }

    pub fn get_messages(&self) -> Vec<ChatMessage> {
        self.history.iter().cloned().collect()
    }

    pub fn turn_count(&self) -> usize {
        self.history.len()
    }

    pub fn clear(&mut self) {
        self.history.clear();
    }

    pub fn update_workspace(&mut self, ws: u32) {
        self.system_context.active_workspace = ws;
    }

    pub fn render_prompt_with_context(&self, user_query: &str) -> String {
        let mut prompt = String::new();
        prompt.push_str(&format!(
            "[System Context: {} v{}, Workspace {}, Zero-Trust: {}]\n\n",
            self.system_context.os_name,
            self.system_context.os_version,
            self.system_context.active_workspace,
            self.system_context.zero_trust_enforced
        ));

        for msg in &self.history {
            let role_str = match msg.role {
                MessageRole::User => "User",
                MessageRole::Assistant => "Assistant",
                MessageRole::System => "System",
                MessageRole::Tool => "Tool Result",
            };
            prompt.push_str(&format!("{}: {}\n", role_str, msg.content));
        }

        prompt.push_str(&format!("User: {}\nAssistant:", user_query));
        prompt
    }
}
