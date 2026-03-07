import express from "express";
import { createServer as createViteServer } from "vite";
import { createPublicClient, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Setup
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://dgnjpvrzxmmargbkypgh.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Viem Setup
  const publicClient = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  // API Routes
  app.get("/api/health", (req: express.Request, res: express.Response) => {
    res.json({ status: "ok" });
  });

  /**
   * Verify Gacha Payment Transaction
   * This endpoint verifies the on-chain payment.
   */
  app.post("/api/gacha/verify", async (req: express.Request, res: express.Response) => {
    const { txHash, fid, tab, isTriple } = req.body;

    if (!txHash || !fid || !tab) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    try {
      console.log(`Verifying Gacha Payment: TX=${txHash}, FID=${fid}, Tab=${tab}`);

      // 1. Verify Transaction Receipt
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: txHash as `0x${string}` 
      });
      
      if (receipt.status !== "success") {
        return res.status(400).json({ error: "Transaction failed on-chain" });
      }

      // Note: We removed the gacha_payments table check as requested.
      // In a production environment, you should still ensure a transaction hash 
      // is only used once to prevent replay attacks.

      // 2. Success Response
      res.json({ success: true });

    } catch (error: any) {
      console.error("Gacha Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
