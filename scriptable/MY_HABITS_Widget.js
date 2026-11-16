// MY HABITS · Widget mediano para Scriptable
// Configura PROJECT_URL y PUBLISHABLE_KEY con los datos públicos de tu proyecto Supabase.
// No introduzcas nunca una Secret key ni service_role.
const PROJECT_URL = "https://aiqtvrrctwtmyapzqbzd.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_1wuOnDBR7ro4GatcoK5HcQ_NK4CjW_e";
const TOKEN_KEY = "myhabits_supabase_refresh_token_v1";
const USER_KEY = "myhabits_supabase_user_id_v1";
const EMAIL_KEY = "myhabits_supabase_email_v1";

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
async function requestJSON(url, method="GET", body=null, accessToken=null) {
  const req = new Request(url);
  req.method = method;
  req.headers = {"apikey":PUBLISHABLE_KEY,"Content-Type":"application/json"};
  if (accessToken) req.headers["Authorization"] = `Bearer ${accessToken}`;
  if (body !== null) req.body = JSON.stringify(body);
  return await req.loadJSON();
}
async function loginPrompt() {
  const alert = new Alert();
  alert.title = "Conectar MY HABITS";
  alert.message = "Inicia sesión con la misma cuenta que usarás en la aplicación MY HABITS.";
  alert.addTextField("Correo electrónico", Keychain.get(EMAIL_KEY) || "");
  alert.addSecureTextField("Contraseña", "");
  alert.addAction("Iniciar sesión");
  alert.addCancelAction("Cancelar");
  const choice = await alert.present();
  if (choice < 0) return null;
  const email = alert.textFieldValue(0).trim();
  const password = alert.textFieldValue(1);
  const data = await requestJSON(`${PROJECT_URL}/auth/v1/token?grant_type=password`, "POST", {email,password});
  if (!data.refresh_token || !data.user?.id) throw new Error("No se recibió una sesión válida. Comprueba correo y contraseña.");
  Keychain.set(TOKEN_KEY, data.refresh_token);
  Keychain.set(USER_KEY, data.user.id);
  Keychain.set(EMAIL_KEY, email);
  return data;
}
async function getSession() {
  if (!Keychain.contains(TOKEN_KEY)) return await loginPrompt();
  try {
    const data = await requestJSON(`${PROJECT_URL}/auth/v1/token?grant_type=refresh_token`, "POST", {refresh_token:Keychain.get(TOKEN_KEY)});
    if (!data.refresh_token || !data.user?.id) throw new Error("No se pudo renovar la sesión.");
    Keychain.set(TOKEN_KEY, data.refresh_token);
    Keychain.set(USER_KEY, data.user.id);
    return data;
  } catch (e) {
    Keychain.remove(TOKEN_KEY);
    Keychain.remove(USER_KEY);
    if (config.runsInWidget) throw new Error("Abre Scriptable y ejecuta MY_HABITS_Widget para volver a iniciar sesión.");
    return await loginPrompt();
  }
}
function makeWidget(payload, email) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#101114");
  w.setPadding(12,14,10,14);
  const habits = Array.isArray(payload?.habits) ? payload.habits : [];
  const logs = payload?.logs || {};
  const done = logs[localDateKey(new Date())] || [];
  const count = habits.filter(h => done.includes(h.id)).length;
  const pct = habits.length ? Math.round(count/habits.length*100) : 0;
  const title = w.addText("MY HABITS  ·  HOY");
  title.font = Font.boldSystemFont(11);
  title.textColor = new Color("#D6C18D");
  title.minimumScaleFactor = 0.8;
  w.addSpacer(5);
  const line = w.addStack();
  line.centerAlignContent();
  const progress = line.addText(`${pct}%`);
  progress.font = Font.boldSystemFont(22);
  progress.textColor = Color.white();
  line.addSpacer(7);
  const detail = line.addText(`${count}/${habits.length} completados`);
  detail.font = Font.systemFont(10);
  detail.textColor = new Color("#B7B2A8");
  w.addSpacer(5);
  const track = w.addStack();
  track.size = new Size(270,5);
  track.backgroundColor = new Color("#343238");
  track.cornerRadius = 3;
  const fill = track.addStack();
  fill.size = new Size(Math.max(2, 270 * pct/100),5);
  fill.backgroundColor = new Color("#D6C18D");
  fill.cornerRadius = 3;
  w.addSpacer(7);
  const columns = w.addStack();
  columns.layoutHorizontally();
  columns.topAlignContent();
  const split = Math.ceil(habits.length/2);
  for (let col=0; col<2; col++) {
    const stack = columns.addStack();
    stack.layoutVertically();
    stack.spacing = 3;
    const subset = habits.slice(col*split, (col+1)*split);
    for (const h of subset) {
      const row = stack.addStack();
      row.centerAlignContent();
      const isDone = done.includes(h.id);
      const mark = row.addText(isDone ? "✓" : "○");
      mark.font = Font.boldSystemFont(10);
      mark.textColor = isDone ? new Color("#D6C18D") : new Color("#77747A");
      row.addSpacer(4);
      const name = row.addText(`${h.emoji || "•"} ${h.name}`);
      name.font = Font.systemFont(9);
      name.textColor = isDone ? new Color("#D6C18D") : new Color("#E8E5DF");
      name.lineLimit = 1;
      name.minimumScaleFactor = 0.65;
    }
    if (col===0) columns.addSpacer(10);
  }
  w.addSpacer();
  const footer = w.addText("SINCRONIZADO · " + new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
  footer.font = Font.systemFont(7);
  footer.textColor = new Color("#77747A");
  w.refreshAfterDate = new Date(Date.now()+15*60*1000);
  return w;
}

try {
  if (!PROJECT_URL.startsWith("https://") || !PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
    throw new Error("Primero pega PROJECT_URL y PUBLISHABLE_KEY en la parte superior del script.");
  }
  const session = await getSession();
  if (!session) throw new Error("Inicio de sesión cancelado.");
  const userId = session.user.id;
  const rows = await requestJSON(`${PROJECT_URL}/rest/v1/habit_sync?select=payload&user_id=eq.${encodeURIComponent(userId)}`, "GET", null, session.access_token);
  if (!rows || !rows.length || !rows[0].payload) throw new Error("Aún no hay datos sincronizados. Abre MY HABITS e inicia sesión con esta misma cuenta.");
  const widget = makeWidget(rows[0].payload, Keychain.get(EMAIL_KEY) || "");
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }
} catch (error) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#101114");
  w.addText("MY HABITS").textColor = new Color("#D6C18D");
  w.addSpacer(5);
  const msg = w.addText(String(error.message || error));
  msg.textColor = Color.white();
  msg.font = Font.systemFont(11);
  msg.lineLimit = 5;
  if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
}
Script.complete();
