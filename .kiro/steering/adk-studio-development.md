---
inclusion: auto
---

# ADK Studio Development Standards

## Project Identity

ADK Studio is a visual IDE that generates production Rust code for AI agents using ADK-Rust. It is NOT a runtime — it is a code generator with a live preview. The generated code is the product, not the studio itself.

## Architecture Principles

### Separation of Concerns

- **Schema** (`src/schema/*.rs` + `ui/src/types/*.ts`): Source of truth for project data. Rust and TypeScript types must stay in sync. All new fields use `Option<T>` with `#[serde(default)]` for backward compatibility.
- **Codegen** (`src/codegen/mod.rs`): Transforms schema into compilable Rust code. Never imports runtime crates directly — it generates `use` statements as strings.
- **Runtime** (`src/server/*.rs`): Studio's own execution (SSE streaming, build process, deploy). Uses adk-runner/adk-session for live preview only.
- **UI** (`ui/src/`): React/TypeScript frontend. State in Zustand. Canvas in ReactFlow. No business logic in components — logic lives in hooks and store slices.

### Generated Code Quality

Generated code is what users ship to production. It must be:
- **Idiomatic Rust** — proper error handling, no unwrap in user-facing paths
- **Minimal** — only import what's used, only add dependencies that are needed
- **Current** — always target the latest adk-rust version (currently 0.8.0)
- **Documented** — header comments explaining workflow structure, env vars, agent roles

### Backward Compatibility

Existing projects must always load without error. New schema fields:
- Rust: `#[serde(default, skip_serializing_if = "Option::is_none")]`
- TypeScript: optional fields with `?`
- Never rename or remove existing fields — deprecate with aliases if needed

## Code Standards

### Rust

- Edition 2024, minimum Rust 1.85.0
- Use `anyhow::Result` for fallible operations in server code
- Use `thiserror` for typed errors in library code
- Codegen functions return `String` — they build code via `push_str`, not templates
- All public functions have doc comments
- Tests use `proptest` for property-based testing where applicable

### TypeScript/React

- Functional components only, no class components
- Hooks for all stateful logic (`useLayout`, `useCanvasNodes`, etc.)
- Zustand slices for global state — no prop drilling beyond 2 levels
- Types in `ui/src/types/` — never use `any`
- CSS variables for theming (`var(--accent-primary)`, etc.)

### Model Data

- Model IDs must match exact API identifiers (e.g., `gemini-3.1-flash-lite-preview`, not `gemini-3.1-flash-lite`)
- No fabricated pricing tiers or capability claims — only document what's verified
- Provider detection in both Rust (`detect_provider()`) and TypeScript (`detectProviderFromModel()`) must produce identical results for the same input
- Default model: `gemini-3.1-flash-lite-preview` everywhere

## ADK-Rust API Usage

### What We Generate (codegen output)

| Crate | Primary APIs |
|-------|-------------|
| adk-agent | `LlmAgentBuilder`, `SequentialAgent`, `ParallelAgent`, `LoopAgent`, `LlmConditionalAgent` |
| adk-core | `Content`, `ToolContext`, `ReadonlyContext`, `Toolset`, `ToolExecutionStrategy` |
| adk-graph | `StateGraph`, `AgentNode`, `ExecutionConfig`, `NodeOutput`, `Router`, `START`, `END` |
| adk-model | All 15 provider clients (Gemini through OpenRouter) |
| adk-tool | `FunctionTool`, `GoogleSearchTool`, `ExitLoopTool`, `LoadArtifactsTool`, `McpToolset` |

### What We Use at Runtime (studio server)

| Crate | Primary APIs |
|-------|-------------|
| adk-core | `Content`, `SessionId` |
| adk-runner | `Runner`, `RunnerConfig` (migrating to `Runner::builder()`) |
| adk-session | `InMemorySessionService`, `CreateRequest`, `GetRequest` |
| adk-code | `RustExecutor`, `RustExecutorConfig`, `CodeError` |
| adk-sandbox | `ProcessBackend`, `SandboxBackend` |
| adk-deploy | `BundleBuilder`, `DeployClient`, `DeploymentManifest` |
| adk-action | `ActionNodeConfig` (type conversion via `to_shared()`) |

### Version Alignment

- `Cargo.toml` dependencies, `DEFAULT_ADK_VERSION` constants, `ui/src/version.ts`, `ui/src/types/settings.ts`, and `ui/package.json` must all reflect the same version
- When upgrading adk-rust: update all 11 crate versions simultaneously, run tests, update the version test assertion

## Testing Requirements

### Before Any PR

1. `cargo test` — all Rust tests pass (unit + property + integration)
2. `npx tsc --noEmit` in `ui/` — zero TypeScript errors
3. `npm run build` in `ui/` — UI builds without errors
4. `cargo check` — no compilation warnings on the main crate

### For Codegen Changes

- Add/update snapshot tests in `tests/codegen_tests.rs`
- Verify generated code contains expected patterns (assert on string content)
- If adding a new provider: add a test that the generated Cargo.toml includes the correct feature flag

### For Schema Changes

- Add property-based tests verifying backward compatibility (old JSON → new struct)
- Test round-trip: serialize → deserialize → serialize produces identical output

### For UI Changes

- Verify conditional rendering logic (model-specific options only show for correct provider)
- Test that new settings persist through save/reload cycle

## File Organization

```
src/
├── codegen/
│   ├── mod.rs              # Main codegen (generate_main_rs, generate_cargo_toml)
│   ├── action_node_codegen.rs  # Action node code generation
│   ├── action_node_types.rs    # Action node type definitions
│   └── validation.rs          # Project validation
├── schema/
│   ├── project.rs          # ProjectSchema, ProjectSettings, AgentSchema
│   ├── agent.rs            # Agent types, routes
│   ├── tool.rs             # Tool configs
│   ├── workflow.rs         # Workflow, edges
│   └── deploy.rs           # Deploy manifest
├── server/
│   ├── handlers.rs         # REST API handlers
│   ├── sse.rs              # SSE streaming
│   ├── runner.rs           # Action node runtime executor
│   ├── graph_runner.rs     # HITL interrupt handling
│   ├── websocket.rs        # WebSocket agent execution
│   ├── scheduler.rs        # Cron schedule triggers
│   └── events.rs           # Debug/trace events
└── storage/
    └── filesystem.rs       # File-based project storage

ui/src/
├── data/models.ts          # Provider/model definitions (source of truth)
├── types/                  # TypeScript type definitions
├── store/slices/           # Zustand state slices
├── hooks/                  # React hooks (logic)
├── components/
│   ├── Panels/             # Right sidebar panels (properties, model selector)
│   ├── Canvas/             # Main canvas area
│   ├── Nodes/              # ReactFlow node components
│   ├── ActionNodes/        # Action node components
│   └── Overlays/           # Modals, tooltips
└── version.ts              # Version constant
```

## Common Pitfalls to Avoid

1. **Don't hardcode model lists for dynamic providers** — OpenRouter has 400+ models with a discovery API. Don't try to enumerate them.
2. **Don't add pricing/tier metadata** — it changes constantly and we can't verify it. Model identity speaks for itself.
3. **Don't use path dependencies** — always use published crates.io versions.
4. **Don't break the websocket module** — it's not wired into routes but references `compile_agent` which doesn't exist. Leave it as dead code until properly implemented.
5. **Don't forget `ui/dist/`** — the embedded UI must be rebuilt (`npm run build` in `ui/`) before `cargo run` or `cargo publish`.
6. **Don't use `Runner::new(RunnerConfig { ... })` in new code** — use `Runner::builder()` typestate pattern.
7. **Don't assume all crates bump versions together** — check each crate's actual published version on lib.rs before upgrading.

## Release Checklist

1. All tests pass (`cargo test` + `npx tsc --noEmit`)
2. UI rebuilt (`cd ui && npm run build`)
3. Version bumped in: `Cargo.toml`, `ui/package.json`, `ui/src/version.ts`, `ui/src/types/settings.ts`, `DEFAULT_ADK_VERSION` constants
4. `cargo publish --dry-run` succeeds (with `ADK_STUDIO_SKIP_UI_BUILD=1`)
5. Git commit, tag, push
6. `cargo publish --allow-dirty` (for ui/dist)
7. `gh release create` with release notes
