//! ADK Studio - Visual development environment for ADK-Rust agents (v0.8.0)
//!
//! Build-only architecture: Users create agents in UI, build to binary, run compiled code.
//!
//! ## ADK 0.8.0 Alignment
//!
//! - All generated code targets adk-rust 0.8.0 APIs
//! - Tool trait gains `is_read_only()` and `is_concurrency_safe()` for parallel dispatch
//! - `ToolExecutionStrategy::Auto` enables concurrent read-only tool execution
//! - Runner supports typestate builder pattern via `Runner::builder()`
//! - Multimodal function responses (inline_data, file_data in tool returns)
//! - Action nodes leverage `adk-graph`'s `ActionNodeExecutor` with feature-gated deps
//! - Shared types via `adk-action` crate for cross-crate compatibility
//! - Structured error envelope (`AdkError`) with retry hints
//! - rmcp 1.3 for MCP toolset connections

pub mod codegen;
pub mod embedded;
pub mod keystore;
pub mod schema;
pub mod server;
pub mod storage;

pub use schema::{AgentSchema, ProjectSchema, ToolSchema, WorkflowSchema};
pub use server::{AppState, api_routes, cleanup_stale_sessions, start_scheduler, stop_scheduler};
pub use storage::FileStorage;
