/* eslint-disable @typescript-eslint/no-explicit-any */
// Gerçek tarayıcı testleri için küçük CDP sürücüsü (headless Chrome). Çekirdek repodan (hanasai/scripts/lib/cdp.mts) kopya;
// ek: Log alanı açılır, CSP ihlalleri ve ağ hataları errors() içinde döner. Node testleri tarayıcıya özgü hataları yakalamıyor
// (2026-11-13: no-referrer → Origin: null → formlar 403). Bu yüzden panelin her formu bununla tarayıcıdan gönderilir.
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Browser {
  private constructor(
    private readonly proc: ChildProcess,
    readonly port: number,
  ) {}

  // extraArgs: ör. ["--lang=en-GB"] (arayüz dili tarayıcı diline göre seçilen sayfalar için).
  static async launch(extraArgs: string[] = [], port = 9300 + Math.floor(Math.random() * 400)): Promise<Browser> {
    const proc = spawn(
      CHROME,
      [
        "--headless=new",
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-first-run",
        ...extraArgs,
        "--window-size=1280,900",
        "about:blank",
      ],
      { stdio: "ignore" },
    );
    for (let i = 0; i < 60; i++) {
      try {
        await fetch(`http://127.0.0.1:${port}/json/version`);
        return new Browser(proc, port);
      } catch {
        await sleep(200);
      }
    }
    throw new Error("Chrome başlamadı");
  }

  // Ayrı tarayıcı bağlamı (çerezler ayrı): iki farklı kullanıcıyı aynı anda sürmek için.
  async page(opts: { isolated?: boolean } = {}): Promise<Page> {
    const v = (await (await fetch(`http://127.0.0.1:${this.port}/json/version`)).json()) as { webSocketDebuggerUrl: string };
    const root = await Conn.open(v.webSocketDebuggerUrl);
    let browserContextId: string | undefined;
    if (opts.isolated) browserContextId = (await root.send("Target.createBrowserContext", {})).browserContextId;
    const { targetId } = await root.send("Target.createTarget", { url: "about:blank", ...(browserContextId ? { browserContextId } : {}) });
    const list = (await (await fetch(`http://127.0.0.1:${this.port}/json`)).json()) as { id: string; webSocketDebuggerUrl: string }[];
    const t = list.find((x) => x.id === targetId)!;
    const conn = await Conn.open(t.webSocketDebuggerUrl);
    await conn.send("Page.enable");
    await conn.send("Runtime.enable");
    await conn.send("Network.enable");
    await conn.send("Log.enable");
    return new Page(conn);
  }

  close(): void {
    this.proc.kill();
  }
}

class Conn {
  private id = 0;
  private readonly pending = new Map<number, { res: (v: any) => void; rej: (e: Error) => void }>();
  readonly events: { method: string; params: any }[] = [];
  private constructor(private readonly ws: WebSocket) {
    ws.onmessage = (m) => {
      const d = JSON.parse(String(m.data));
      if (d.id && this.pending.has(d.id)) {
        const p = this.pending.get(d.id)!;
        this.pending.delete(d.id);
        if (d.error) p.rej(new Error(`${d.error.message}`));
        else p.res(d.result);
      } else if (d.method) this.events.push(d);
    };
  }
  static async open(url: string): Promise<Conn> {
    const ws = new WebSocket(url);
    await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
    return new Conn(ws);
  }
  send(method: string, params: object = {}): Promise<any> {
    const i = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(i, { res, rej });
      this.ws.send(JSON.stringify({ id: i, method, params }));
    });
  }
}

export class Page {
  constructor(private readonly conn: Conn) {}

  // Konsol hataları ve yakalanmamış istisnalar (her testte sıfır olmalı).
  errors(): string[] {
    return this.conn.events
      .filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error") || (e.method === "Log.entryAdded" && e.params.entry.level === "error"))
      .map((e) =>
        e.method === "Runtime.exceptionThrown"
          ? `EXC ${e.params.exceptionDetails.exception?.description ?? e.params.exceptionDetails.text}`
          : e.method === "Log.entryAdded"
            ? `log.${e.params.entry.source} ${e.params.entry.text}${e.params.entry.url ? ` (${e.params.entry.url})` : ""}`
            : `console.error ${e.params.args.map((a: any) => a.value ?? a.description).join(" ")}`,
      );
  }

  // Ana belge yanıtlarının durum kodları (son gezinmeden bu yana).
  documentStatuses(): number[] {
    return this.conn.events.filter((e) => e.method === "Network.responseReceived" && e.params.type === "Document").map((e) => e.params.response.status);
  }

  async goto(url: string): Promise<void> {
    const before = this.conn.events.length;
    await this.conn.send("Page.navigate", { url });
    await this.waitLoad(before);
  }

  private async waitLoad(since: number, timeoutMs = 15000): Promise<void> {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      if (this.conn.events.slice(since).some((e) => e.method === "Page.loadEventFired")) {
        await sleep(150);
        return;
      }
      await sleep(50);
    }
    throw new Error("sayfa yüklenmedi");
  }

  async eval<T = unknown>(expr: string): Promise<T> {
    const r = await this.conn.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
    return r.result?.value as T;
  }

  url(): Promise<string> {
    return this.eval<string>("location.href");
  }
  text(): Promise<string> {
    return this.eval<string>("document.body.innerText");
  }

  // Alanı doldurur (input/textarea/select). Seçici CSS.
  async fill(selector: string, value: string): Promise<void> {
    const ok = await this.eval<boolean>(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
      el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    if (!ok) throw new Error(`alan yok: ${selector}`);
  }

  async check(selector: string, on = true): Promise<void> {
    const ok = await this.eval<boolean>(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.checked = ${on}; return true; })()`);
    if (!ok) throw new Error(`kutu yok: ${selector}`);
  }

  // Tıklar ve gezinme olursa yüklenmesini bekler (form gönderimi gerçek tarayıcı yolundan gider: Origin, Sec-Fetch-Site, çerez).
  async click(selector: string, opts: { navigates?: boolean } = { navigates: true }): Promise<void> {
    const before = this.conn.events.length;
    const ok = await this.eval<boolean>(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error(`öğe yok: ${selector}`);
    if (opts.navigates !== false) await this.waitLoad(before);
    else await sleep(300);
  }

  // Metni içeren butona/linke tıklar.
  async clickText(text: string, opts: { navigates?: boolean } = { navigates: true }): Promise<void> {
    const before = this.conn.events.length;
    const ok = await this.eval<boolean>(`(() => { const el = [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim() === ${JSON.stringify(text)}); if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error(`metinli öğe yok: ${text}`);
    if (opts.navigates !== false) await this.waitLoad(before);
    else await sleep(300);
  }

  // Odaktaki öğeye klavyeden yazılmış gibi metin ekler (contenteditable düzenleyiciler için).
  async typeText(text: string): Promise<void> {
    await this.conn.send("Input.insertText", { text });
  }

  // Dosya seçme kutusuna (input[type=file]) diskteki dosyaları verir; sayfa "change" olayını kendisi alır.
  // nth: seçiciye uyan kaçıncı kutu (0 = ilki).
  async setFiles(selector: string, paths: string[], nth = 0): Promise<void> {
    const { root } = await this.conn.send("DOM.getDocument", { depth: -1, pierce: true });
    const { nodeIds } = await this.conn.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
    const nodeId = nodeIds?.[nth];
    if (!nodeId) throw new Error(`dosya kutusu yok: ${selector} [${nth}]`);
    await this.conn.send("DOM.setFileInputFiles", { files: paths, nodeId });
  }

  async viewport(width: number, height = 900): Promise<void> {
    await this.conn.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }

  async colorScheme(scheme: "light" | "dark"): Promise<void> {
    await this.conn.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
  }

  // Yatay taşma (telefon genişliğinde olmamalı).
  overflowX(): Promise<boolean> {
    return this.eval<boolean>("document.documentElement.scrollWidth > window.innerWidth + 1");
  }

  async screenshot(path: string): Promise<void> {
    const h = await this.eval<number>("Math.min(document.documentElement.scrollHeight, 4000)");
    const w = await this.eval<number>("window.innerWidth");
    const r = await this.conn.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(path, Buffer.from(r.data, "base64"));
  }

  // HttpOnly çerez (ör. test oturumu) doğrudan tarayıcıya yazılır.
  async setCookie(c: { name: string; value: string; url: string; path?: string; httpOnly?: boolean; secure?: boolean }): Promise<void> {
    await this.conn.send("Network.setCookie", { httpOnly: true, secure: true, sameSite: "Lax", ...c });
  }

  async cookies(): Promise<{ name: string; value: string; path: string; httpOnly: boolean; secure: boolean }[]> {
    return (await this.conn.send("Network.getCookies", {})).cookies;
  }
}

// Basit kontrol listesi: her satır yazdırılır, sonda hata sayısı döner.
export function checker(): { check: (label: string, cond: boolean, extra?: string) => void; failures: () => number } {
  let n = 0;
  return {
    check: (label, cond, extra = "") => {
      console.log(`${cond ? "OK  " : "HATA"} ${label}${extra ? `  (${extra})` : ""}`);
      if (!cond) n++;
    },
    failures: () => n,
  };
}
