// nova-ai-runtime/src/lib.rs — Library exports
pub mod context;
pub mod gemini;
pub mod manager;
pub mod offline;
pub mod ollama;
pub mod provider;
pub mod tool_registry;

pub use context::{ChatMessage, ContextManager, MessageRole};
pub use manager::{ProviderManager, ProviderMode, QueryResult};
pub use offline::OfflineBuiltinProvider;
pub use provider::{AIProvider, ProviderKind, ProviderStatus};
pub use tool_registry::{ToolDefinition, ToolRegistry};
