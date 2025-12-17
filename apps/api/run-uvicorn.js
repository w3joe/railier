const { spawn, exec } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");
const net = require("net");

// Determine the correct activation script based on OS
const isWindows = os.platform() === "win32";
const venvPath = path.join(__dirname, ".venv");
const pythonPath = isWindows
  ? path.join(venvPath, "Scripts", "python.exe")
  : path.join(venvPath, "bin", "python");

const DEFAULT_PORT = 8001;

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Kill process on port (macOS/Linux)
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => {
      // Wait a bit longer to ensure port is freed
      setTimeout(resolve, 1500);
    });
  });
}

async function startServer() {
  // Check if virtual environment exists
  if (!fs.existsSync(pythonPath)) {
    console.error("❌ Virtual environment not found!");
    console.error("\nPlease run these commands:");
    console.error("  cd apps/api");
    console.error("  python3 -m venv .venv");
    console.error(
      "  source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate"
    );
    console.error('  pip install -e ".[dev]"');
    console.error("\nThen run: pnpm dev");
    process.exit(1);
  }

  // Check if port is available
  const portAvailable = await isPortAvailable(DEFAULT_PORT);

  if (!portAvailable) {
    console.log(`⚠️  Port ${DEFAULT_PORT} is already in use`);
    console.log("🔄 Attempting to kill existing process...");
    await killProcessOnPort(DEFAULT_PORT);

    // Wait a bit for the port to be released
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const nowAvailable = await isPortAvailable(DEFAULT_PORT);
    if (!nowAvailable) {
      console.error(`❌ Could not free port ${DEFAULT_PORT}`);
      console.error("\nManually kill the process using:");
      console.error(
        isWindows
          ? `  netstat -ano | findstr :${DEFAULT_PORT} && taskkill /PID <PID> /F`
          : `  lsof -ti:${DEFAULT_PORT} | xargs kill -9`
      );
      process.exit(1);
    }
    console.log("✅ Port freed successfully");
  }

  console.log("🚀 Starting FastAPI server on http://localhost:8001...");

  // Spawn uvicorn process
  const uvicorn = spawn(
    pythonPath,
    [
      "-m",
      "uvicorn",
      "app.main:app",
      "--reload",
      "--host",
      "0.0.0.0",
      "--port",
      DEFAULT_PORT.toString(),
    ],
    {
      cwd: __dirname,
      stdio: "inherit",
      env: { ...process.env },
    }
  );

  // Handle process termination
  uvicorn.on("close", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ uvicorn exited with code ${code}`);
      process.exit(code);
    }
  });

  uvicorn.on("error", (err) => {
    console.error("❌ Failed to start uvicorn:", err.message);
    process.exit(1);
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n⏹️  Stopping FastAPI server...");
    uvicorn.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    uvicorn.kill("SIGTERM");
  });
}

startServer();
