/**
 * GET /.netlify/functions/admin-scores?password=...
 * Returns recent events + best-by-player from Netlify Blobs
 */
const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

function bad(status, msg) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ ok: false, error: msg }) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "GET") {
    return bad(405, "Use GET");
  }

  const expected =
    process.env.ADMIN_PASSWORD ||
    process.env.VB_ADMIN_PASSWORD ||
    "vb-admin-2026";

  const q = event.queryStringParameters || {};
  const headerPw = event.headers["x-admin-password"] || event.headers["X-Admin-Password"];
  const password = q.password || headerPw || "";

  if (password !== expected) {
    return bad(401, "Unauthorized");
  }

  try {
    const store = getStore("scores");
    let index = [];
    try {
      index = (await store.get("index", { type: "json" })) || [];
      if (!Array.isArray(index)) index = [];
    } catch {
      index = [];
    }

    const events = [];
    for (const id of index.slice(0, 100)) {
      try {
        const e = await store.get(`event:${id}`, { type: "json" });
        if (e) events.push(e);
      } catch {
        /* skip missing */
      }
    }

    // Best players: scan player:* keys via listing if available
    let players = [];
    try {
      const listed = await store.list({ prefix: "player:" });
      const blobs = (listed && listed.blobs) || [];
      for (const b of blobs) {
        try {
          const p = await store.get(b.key, { type: "json" });
          if (p) players.push(p);
        } catch {
          /* skip */
        }
      }
    } catch {
      // Fallback: derive from events
      const map = new Map();
      for (const e of events) {
        const k = (e.name || "Guest").toLowerCase();
        const prev = map.get(k);
        if (
          !prev ||
          e.pct > prev.pct ||
          (e.pct === prev.pct && e.xp >= prev.xp)
        ) {
          map.set(k, {
            name: e.name,
            difficulty: e.difficulty,
            correct: e.correct,
            wrong: e.wrong,
            pct: e.pct,
            xp: e.xp,
            remark: e.remark,
            ts: e.ts,
          });
        }
      }
      players = [...map.values()];
    }

    players.sort((a, b) => b.pct - a.pct || b.xp - a.xp);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        ok: true,
        count: events.length,
        events,
        players,
        serverTime: new Date().toISOString(),
      }),
    };
  } catch (err) {
    return bad(500, "Storage error: " + (err && err.message ? err.message : String(err)));
  }
};
