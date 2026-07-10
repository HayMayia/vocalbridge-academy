/**
 * POST /.netlify/functions/submit-score
 * Body JSON: { name, difficulty, correct, wrong, xp, usedCount?, clientId? }
 * Stores one score event in Netlify Blobs (store: "scores")
 */
const { getStore } = require("@netlify/blobs");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function bad(status, msg) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ ok: false, error: msg }) };
}

function clampStr(s, n) {
  return String(s ?? "")
    .trim()
    .replace(/[\u0000-\u001f]/g, "")
    .slice(0, n);
}

function remarkFor(pct) {
  if (pct >= 90)
    return "Outstanding — finals-ready understanding. Keep honesty about limits.";
  if (pct >= 75)
    return "Strong work — you can represent this project. Polish viva + demo next.";
  if (pct >= 50)
    return "Solid start. Re-read How + Sensor, then retry.";
  return "Keep going — review Story/How, then Beginner quiz again.";
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return bad(405, "Use POST");
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch {
    return bad(400, "Invalid JSON");
  }

  const name = clampStr(data.name || "Guest", 40) || "Guest";
  const difficulty = ["beginner", "medium", "advanced"].includes(data.difficulty)
    ? data.difficulty
    : "beginner";
  const correct = Math.max(0, Math.min(10000, Number(data.correct) || 0));
  const wrong = Math.max(0, Math.min(10000, Number(data.wrong) || 0));
  const xp = Math.max(0, Math.min(1000000, Number(data.xp) || 0));
  const usedCount = Math.max(0, Math.min(1000, Number(data.usedCount) || 0));
  const clientId = clampStr(data.clientId || "", 64);
  const total = correct + wrong;
  const pct = total ? Math.round((100 * correct) / total) : 0;

  if (total === 0 && xp === 0) {
    return bad(400, "Nothing to submit (no answers yet)");
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    difficulty,
    correct,
    wrong,
    total,
    pct,
    xp,
    usedCount,
    clientId,
    remark: remarkFor(pct),
    ts: new Date().toISOString(),
    ua: clampStr(event.headers["user-agent"] || "", 160),
  };

  try {
    const store = getStore("scores");
    // One object per event
    await store.setJSON(`event:${entry.id}`, entry);

    // Maintain a rolling index of recent ids (last ~200)
    let index = [];
    try {
      index = (await store.get("index", { type: "json" })) || [];
      if (!Array.isArray(index)) index = [];
    } catch {
      index = [];
    }
    index.unshift(entry.id);
    index = index.slice(0, 200);
    await store.setJSON("index", index);

    // Latest-by-name for quick leaderboard (best pct, then xp)
    const key = `player:${name.toLowerCase()}`;
    let prev = null;
    try {
      prev = await store.get(key, { type: "json" });
    } catch {
      prev = null;
    }
    const better =
      !prev ||
      entry.pct > (prev.pct || 0) ||
      (entry.pct === (prev.pct || 0) && entry.xp >= (prev.xp || 0));
    if (better) {
      await store.setJSON(key, {
        name: entry.name,
        difficulty: entry.difficulty,
        correct: entry.correct,
        wrong: entry.wrong,
        pct: entry.pct,
        xp: entry.xp,
        remark: entry.remark,
        ts: entry.ts,
        lastEventId: entry.id,
      });
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, entry }),
    };
  } catch (err) {
    return bad(500, "Storage error: " + (err && err.message ? err.message : String(err)));
  }
};
