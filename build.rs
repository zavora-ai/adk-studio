use std::env;
use std::path::Path;
use std::process::Command;

fn main() {
    println!("cargo:rerun-if-env-changed=ADK_STUDIO_SKIP_UI_BUILD");
    println!("cargo:rerun-if-changed=ui/index.html");
    println!("cargo:rerun-if-changed=ui/package.json");
    println!("cargo:rerun-if-changed=ui/package-lock.json");
    println!("cargo:rerun-if-changed=ui/vite.config.ts");
    println!("cargo:rerun-if-changed=ui/src");

    let ui_dir = Path::new("ui");
    let dist_index = ui_dir.join("dist/index.html");
    let skip_ui_build = env::var_os("ADK_STUDIO_SKIP_UI_BUILD").is_some()
        || env::var_os("DOCS_RS").is_some();

    if skip_ui_build {
        if !dist_index.exists() {
            // On docs.rs the UI assets aren't needed for documentation generation
            if env::var_os("DOCS_RS").is_some() {
                // Create a minimal placeholder so rust-embed doesn't fail
                std::fs::create_dir_all(ui_dir.join("dist")).ok();
                std::fs::write(&dist_index, "<html><body>docs.rs build</body></html>").ok();
                return;
            }
            panic!(
                "ADK_STUDIO_SKIP_UI_BUILD is set, but ui/dist/index.html is missing. \
                 Build the UI first with `cd ui && npm run build`."
            );
        }
        return;
    }

    if !command_exists("npm") {
        if dist_index.exists() {
            println!(
                "cargo:warning=npm was not found; reusing existing UI build in {}",
                dist_index.display()
            );
            return;
        }

        panic!(
            "npm is required to build the embedded UI from source. \
             Install Node.js/npm or build the UI manually with `cd ui && npm run build`."
        );
    }

    if !ui_dir.join("node_modules").exists() {
        run(Command::new("npm").arg("ci").current_dir(ui_dir), "npm ci");
    }

    run(
        Command::new("npm")
            .args(["run", "build"])
            .current_dir(ui_dir),
        "npm run build",
    );
}

fn command_exists(name: &str) -> bool {
    Command::new(name)
        .arg("--version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

fn run(command: &mut Command, label: &str) {
    let status = command
        .status()
        .unwrap_or_else(|err| panic!("failed to start `{label}`: {err}"));

    if !status.success() {
        panic!("`{label}` failed with status {status}");
    }
}
