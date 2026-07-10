/**
 * VocalBridge Teammate Academy — Google Apps Script backend
 * Spreadsheet columns (row 1 headers):
 * timestamp | name | difficulty | correct | wrong | total | pct | xp | usedCount | clientId | remark
 *
 * Deploy: Deploy → New deployment → Web app
 * Execute as: Me
 * Who has access: Anyone
 */

var SHEET_NAME = 'Scores';
var ADMIN_PASSWORD = 'Nimit@1234'; // same as site admin password (change both)

function doGet(e) {
  return handle_(e, 'GET');
}

function doPost(e) {
  return handle_(e, 'POST');
}

function handle_(e, method) {
  try {
    e = e || {};
    var p = e.parameter || {};
    var data = {};

    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = {};
      }
    }

    // merge query params
    for (var k in p) {
      if (Object.prototype.hasOwnProperty.call(p, k) && data[k] == null) {
        data[k] = p[k];
      }
    }

    var action = String(data.action || p.action || (method === 'GET' ? 'list' : 'submit')).toLowerCase();

    if (action === 'list' || action === 'admin' || action === 'scores') {
      return json_(listScores_(data));
    }

    if (action === 'submit' || action === 'score' || method === 'POST') {
      return json_(submitScore_(data));
    }

    if (action === 'ping') {
      return json_({ ok: true, message: 'VocalBridge backend alive', time: new Date().toISOString() });
    }

    return json_({ ok: false, error: 'Unknown action. Use action=submit or action=list' }, 400);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) }, 500);
  }
}

function submitScore_(data) {
  var name = clean_(data.name || 'Guest', 40) || 'Guest';
  var difficulty = String(data.difficulty || 'beginner').toLowerCase();
  if (['beginner', 'medium', 'advanced'].indexOf(difficulty) === -1) difficulty = 'beginner';

  var correct = num_(data.correct, 0, 10000);
  var wrong = num_(data.wrong, 0, 10000);
  var xp = num_(data.xp, 0, 1000000);
  var usedCount = num_(data.usedCount, 0, 1000);
  var clientId = clean_(data.clientId || '', 64);
  var total = correct + wrong;
  var pct = total ? Math.round((100 * correct) / total) : 0;

  if (total === 0 && xp === 0) {
    return { ok: false, error: 'Nothing to submit (no answers yet)' };
  }

  var remark = remarkFor_(pct);
  var ts = new Date();
  var sheet = getSheet_();

  sheet.appendRow([
    ts,
    name,
    difficulty,
    correct,
    wrong,
    total,
    pct,
    xp,
    usedCount,
    clientId,
    remark
  ]);

  return {
    ok: true,
    entry: {
      name: name,
      difficulty: difficulty,
      correct: correct,
      wrong: wrong,
      total: total,
      pct: pct,
      xp: xp,
      usedCount: usedCount,
      remark: remark,
      ts: ts.toISOString()
    }
  };
}

function listScores_(data) {
  var password = String(data.password || '');
  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: 'Unauthorized' };
  }

  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { ok: true, count: 0, events: [], players: [], serverTime: new Date().toISOString() };
  }

  var events = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[1] && !r[3] && !r[4]) continue;
    var ts = r[0];
    var tsIso = ts instanceof Date ? ts.toISOString() : String(ts || '');
    events.push({
      name: String(r[1] || 'Guest'),
      difficulty: String(r[2] || ''),
      correct: Number(r[3]) || 0,
      wrong: Number(r[4]) || 0,
      total: Number(r[5]) || ((Number(r[3]) || 0) + (Number(r[4]) || 0)),
      pct: Number(r[6]) || 0,
      xp: Number(r[7]) || 0,
      usedCount: Number(r[8]) || 0,
      clientId: String(r[9] || ''),
      remark: String(r[10] || ''),
      ts: tsIso
    });
  }

  // newest first
  events.reverse();

  // best by player name
  var map = {};
  for (var j = 0; j < events.length; j++) {
    var e = events[j];
    var key = e.name.toLowerCase();
    var prev = map[key];
    if (!prev || e.pct > prev.pct || (e.pct === prev.pct && e.xp >= prev.xp)) {
      map[key] = {
        name: e.name,
        difficulty: e.difficulty,
        correct: e.correct,
        wrong: e.wrong,
        pct: e.pct,
        xp: e.xp,
        remark: e.remark,
        ts: e.ts
      };
    }
  }

  var players = [];
  for (var k in map) {
    if (Object.prototype.hasOwnProperty.call(map, k)) players.push(map[k]);
  }
  players.sort(function (a, b) {
    return b.pct - a.pct || b.xp - a.xp;
  });

  return {
    ok: true,
    count: events.length,
    events: events.slice(0, 100),
    players: players,
    serverTime: new Date().toISOString()
  };
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'timestamp',
      'name',
      'difficulty',
      'correct',
      'wrong',
      'total',
      'pct',
      'xp',
      'usedCount',
      'clientId',
      'remark'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function remarkFor_(pct) {
  if (pct >= 90) return 'Outstanding — finals-ready understanding. Keep honesty about limits.';
  if (pct >= 75) return 'Strong work — you can represent this project. Polish viva + demo next.';
  if (pct >= 50) return 'Solid start. Re-read How + Sensor, then retry.';
  return 'Keep going — review Story/How, then Beginner quiz again.';
}

function clean_(s, n) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f]/g, '')
    .trim()
    .slice(0, n);
}

function num_(v, min, max) {
  var n = Number(v);
  if (isNaN(n)) n = 0;
  if (n < min) n = min;
  if (n > max) n = max;
  return n;
}

function json_(obj, status) {
  // Apps Script web apps don't use HTTP status the same way for all clients;
  // body.ok is what the frontend checks.
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
