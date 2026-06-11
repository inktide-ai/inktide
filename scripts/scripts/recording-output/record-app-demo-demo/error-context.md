# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: record-app-demo.spec.mjs >> demo
- Location: scripts/record-app-demo.spec.mjs:6:1

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('button').filter({ hasText: /select a soul/i })

```

```
Error: write EPIPE
```

# Test source

```ts
  1   | import { test } from '@playwright/test';
  2   | 
  3   | const EMAIL = process.env.DEMO_EMAIL || 'scarlet.surge86@gmail.com';
  4   | const PASSWORD = process.env.DEMO_PASSWORD || '1590753';
  5   | 
  6   | test('demo', async ({ page }) => {
  7   | 
  8   |   // ── 1. Landing page ───────────────────────────────────────────────
  9   |   await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  10  |   await page.waitForTimeout(2200);
  11  | 
  12  |   // ── 2. Click Log in ──────────────────────────────────────────────
  13  |   await page.locator('button').filter({ hasText: /войти|log in/i }).first().click();
  14  |   await page.waitForURL(/localhost:8080/, { timeout: 12_000 });
  15  |   await page.waitForTimeout(800);
  16  | 
  17  |   // ── 3. Keycloak login ────────────────────────────────────────────
  18  |   await page.fill('#username', EMAIL);
  19  |   await page.waitForTimeout(400);
  20  |   await page.fill('#password', PASSWORD);
  21  |   await page.waitForTimeout(400);
  22  |   await page.locator('#kc-login').click();
  23  |   await page.waitForURL('**/home**', { timeout: 25_000 });
  24  |   await page.waitForTimeout(2000);
  25  | 
  26  |   // ── 3b. Delete existing souls to avoid billing 402 ──────────────
  27  |   await page.evaluate(async () => {
  28  |     const r = await fetch('/api/v1/souls/cards');
  29  |     if (!r.ok) return;
  30  |     const data = await r.json();
  31  |     for (const soul of (data.items ?? [])) {
  32  |       await fetch(`/api/v1/souls/cards/${soul.id}`, { method: 'DELETE' });
  33  |     }
  34  |   });
  35  |   await page.waitForTimeout(800);
  36  | 
  37  |   // ── 4. Open Soul creation wizard ─────────────────────────────────
  38  |   await page.locator('button').filter({ hasText: /новый персонаж|new soul/i }).first().click();
  39  |   await page.waitForTimeout(3000);
  40  | 
  41  |   // ── 5. Templates: pick Gaming Streamer ───────────────────────────
  42  |   await page.locator('button').filter({ hasText: /gaming streamer/i }).first().click();
  43  |   await page.waitForTimeout(3000);
  44  | 
  45  |   // ── 6. Steps hub: click LLM step ─────────────────────────────────
  46  |   await page.locator('button').filter({ hasText: /выберите llm/i }).click();
  47  |   await page.waitForTimeout(3000);
  48  | 
  49  |   // ── 7. LLM: click Ollama card then confirm (auto-returns to steps) ─
  50  |   await page.locator('button').filter({ hasText: /ollama/i }).first().click();
  51  |   await page.waitForTimeout(700);
  52  |   await page.locator('button').filter({ hasText: /выбрать ollama|select ollama/i }).click();
  53  |   await page.waitForTimeout(1000);
  54  | 
  55  |   // ── 8. Steps hub: click TTS step ─────────────────────────────────
  56  |   await page.locator('button').filter({ hasText: /выберите tts/i }).click();
  57  |   await page.waitForTimeout(1200);
  58  | 
  59  |   // ── 9. TTS: click Kokoro card then confirm (auto-returns to steps) ─
  60  |   await page.locator('button').filter({ hasText: /kokoro/i }).first().click();
  61  |   await page.waitForTimeout(700);
  62  |   await page.locator('button').filter({ hasText: /выбрать kokoro|select kokoro/i }).click();
  63  |   await page.waitForTimeout(1000);
  64  | 
  65  |   // ── 10. Steps hub: click Finish step ─────────────────────────────
  66  |   await page.locator('button').filter({ hasText: /завершение/i }).click();
  67  |   await page.waitForTimeout(1200);
  68  |   await page.screenshot({ path: 'scripts/dbg-finish-screen.png' });
  69  | 
  70  |   // ── 11. Soul name input ───────────────────────────────────────────
  71  |   const nameInput = page.locator('input[placeholder*="душ"]').first();
  72  |   await nameInput.waitFor({ state: 'visible', timeout: 10_000 });
  73  |   await nameInput.fill('Aria');
  74  |   await page.waitForTimeout(800);
  75  |   await page.screenshot({ path: 'scripts/dbg-name-filled.png' });
  76  | 
  77  |   // ── 12. Create soul ───────────────────────────────────────────────
  78  |   await page.locator('button').filter({ hasText: /создать душу/i }).click();
  79  |   await page.waitForURL(/\/souls\/|\/home/, { timeout: 35_000 });
  80  |   await page.waitForTimeout(2000);
  81  | 
  82  |   // ── 15. Navigate to home for project creation ────────────────────
  83  |   await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' });
  84  |   await page.waitForTimeout(1200);
  85  | 
  86  |   // ── 16. Open project creation wizard ─────────────────────────────
  87  |   await page.locator('button').filter({ hasText: /новый проект|new project/i }).first().click();
  88  |   await page.waitForTimeout(1000);
  89  | 
  90  |   // ── 17. Project name ──────────────────────────────────────────────
  91  |   await page.locator('input[placeholder="My Twitch Project"]').fill('My First Stream');
  92  |   await page.waitForTimeout(600);
  93  | 
  94  |   // ── 17b. Select soul (required field) ────────────────────────────
> 95  |   await page.locator('button').filter({ hasText: /select a soul/i }).click();
      |   ^ Error: write EPIPE
  96  |   await page.waitForTimeout(500);
  97  |   await page.locator('li button').filter({ hasText: /aria/i }).first().click();
  98  |   await page.waitForTimeout(600);
  99  | 
  100 |   // ── 18. Create project ────────────────────────────────────────────
  101 |   await page.locator('button').filter({ hasText: /create project/i }).click();
  102 |   await page.waitForURL('**/projects/**', { timeout: 25_000 });
  103 |   await page.waitForTimeout(1500);
  104 | 
  105 |   // ── 19. Click Sandbox tab ─────────────────────────────────────────
  106 |   await page.locator('a, button').filter({ hasText: /^sandbox$/i }).first().click();
  107 |   await page.waitForURL(/sandbox/i, { timeout: 10_000 });
  108 |   await page.waitForTimeout(3000);
  109 | 
  110 |   // ── 20. Type and send a message ───────────────────────────────────
  111 |   const chatInput = page.locator(
  112 |     'textarea[placeholder], input[placeholder*="Сообщение"], input[placeholder*="Message"]'
  113 |   ).last();
  114 |   await chatInput.click();
  115 |   await chatInput.fill('Привет! Расскажи о себе.');
  116 |   await page.waitForTimeout(1000);
  117 |   await chatInput.press('Enter');
  118 |   await page.waitForTimeout(3000);
  119 | });
  120 | 
```