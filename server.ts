import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

interface Session {
  process: ChildProcessWithoutNullStreams;
  stdout: string[];
  clients: express.Response[];
  filePath: string;
}

const sessions = new Map<string, Session>();

// API Routes

// 1. Run Python terminal session
app.post("/api/terminal/start", (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Code is required" });
    return;
  }

  const sessionId = Math.random().toString(36).substring(2, 15);
  const filePath = path.join(process.cwd(), `temp_portfolio_${sessionId}.py`);

  try {
    // Write code to a temporary python file
    fs.writeFileSync(filePath, code, "utf8");

    // Spawn Python process with unbuffered output (-u)
    const pythonProcess = spawn("python", ["-u", filePath]);

    const session: Session = {
      process: pythonProcess,
      stdout: [],
      clients: [],
      filePath
    };

    sessions.set(sessionId, session);

    // Capture standard output
    pythonProcess.stdout.on("data", (data) => {
      const text = data.toString();
      session.stdout.push(text);
      session.clients.forEach((client) => {
        client.write(`data: ${JSON.stringify({ type: "output", text })}\n\n`);
      });
    });

    // Capture standard error
    pythonProcess.stderr.on("data", (data) => {
      const text = data.toString();
      session.stdout.push(text);
      session.clients.forEach((client) => {
        client.write(`data: ${JSON.stringify({ type: "error", text })}\n\n`);
      });
    });

    // Handle process completion
    pythonProcess.on("close", (code) => {
      session.clients.forEach((client) => {
        client.write(`data: ${JSON.stringify({ type: "exit", code })}\n\n`);
      });
      // Cleanup files and session
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Error unlinking temp file:", err);
      }
      sessions.delete(sessionId);
    });

    res.json({ sessionId });
  } catch (error: any) {
    console.error("Failed to start python terminal:", error);
    res.status(500).json({ error: error.message || "Failed to start terminal" });
  }
});

// 2. Write input to active terminal session
app.post("/api/terminal/input/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const { input } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: "Terminal session not found or already terminated" });
    return;
  }

  try {
    session.process.stdin.write(input + "\n");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to write input" });
  }
});

// 3. Stream terminal output (SSE)
app.get("/api/terminal/stream/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  session.clients.push(res);

  // Send historical output
  session.stdout.forEach((line) => {
    res.write(`data: ${JSON.stringify({ type: "output", text: line })}\n\n`);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    if (sessions.has(sessionId)) {
      const activeSession = sessions.get(sessionId);
      if (activeSession) {
        activeSession.clients = activeSession.clients.filter((c) => c !== res);
      }
    }
  });
});

// 4. Force stop active session
app.post("/api/terminal/stop/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  try {
    session.process.kill("SIGKILL");
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to stop terminal" });
  }
});

// 5. List files generated in workspace (txt and csv)
app.get("/api/files/list", (req, res) => {
  try {
    const files = fs.readdirSync(process.cwd());
    const allowedExtensions = [".txt", ".csv"];
    const generatedFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext) && !file.startsWith("temp_portfolio_") && !file.startsWith("package");
      })
      .map((file) => {
        const stats = fs.statSync(path.join(process.cwd(), file));
        return {
          name: file,
          size: stats.size,
          mtime: stats.mtime,
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    res.json({ files: generatedFiles });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to list files" });
  }
});

// 6. Download a specific file
app.get("/api/files/download/:filename", (req, res) => {
  const { filename } = req.params;
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send("File not found");
    return;
  }

  // Ensure it's a txt or csv file
  const ext = path.extname(safeFilename).toLowerCase();
  if (ext !== ".txt" && ext !== ".csv" || safeFilename.startsWith("temp_portfolio_")) {
    res.status(403).send("Access denied");
    return;
  }

  res.download(filePath, safeFilename);
});

// 7. Delete a specific file
app.delete("/api/files/delete/:filename", (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), safeFilename);

  if (!fs.existsSync(filePath)) {
    res.status(404).send("File not found");
    return;
  }

  const ext = path.extname(safeFilename).toLowerCase();
  if (ext !== ".txt" && ext !== ".csv" || safeFilename.startsWith("temp_portfolio_")) {
    res.status(403).send("Access denied");
    return;
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Vite middleware and static files config
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
