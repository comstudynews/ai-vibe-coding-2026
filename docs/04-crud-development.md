> **핵심 시연 \| 약 25분(실제 촬영)** — 아래 전체 코드는 사전 준비용 완성 기준 예제입니다. 녹화 때 처음부터 타이핑하지 않습니다.
# 제4장. 중고차 CRUD 웹 앱 구현과 검증
## 4.1 목표와 구현 범위
**프로젝트명:** used-car-demo
**목표:** React로 매물 목록과 등록·수정·삭제 UI를 구성하고, Express REST API로 CRUD를 수행합니다. 데이터는 서버 메모리 배열에 임시 저장합니다.
**학습 범위:** CRUD, REST/JSON, 컴포넌트·폼 상태, HTTP 응답 코드, 입력 검증, AI 코드 변경 검토.
**제외 범위:** DB, 로그인, 파일 업로드, 결제, 실제 매물 정보, RAG, OpenAI API 호출. Codex CLI 자체가 AI를 사용하지만 **앱이 LLM API를 호출하는 것은 아닙니다.**
## 4.2 저장소 구조
```plain text
used-car-demo/
├── .devcontainer/
│   └── devcontainer.json
├── AGENTS.md
├── .gitignore
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
└── server/
    ├── app.js
    ├── index.js
    ├── package.json
    └── test/
        └── app.test.js
```
명령은 **GitHub Codespaces 저장소 루트**를 기준으로 합니다.
## 4.3 1단계 — 서버 준비 및 검증 가능한 구조
먼저 Node.js 24 환경에서 서버 폴더의 의존성을 설치합니다. **이번 GitHub 소스는 app.js와 index.js를 분리**하여 HTTP 서버를 실행하지 않고도 테스트할 수 있도록 수정했습니다.
```bash
cd server
npm install
npm test
npm start
```
파일: **server/app.js** — Express 생성, 입력 검증, CRUD, 운영 환경 쓰기 차단
```javascript
import express from "express";
import cors from "cors";

const initialCars = [
  { id: 1, name: "현대 쏘나타", year: 2022, mileage: 38000, price: 1850 },
  { id: 2, name: "기아 K7 프리미어", year: 2020, mileage: 72000, price: 1690 },
];

function integerFrom(value) {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value !== "string" || !/^[0-9]+$/.test(value.trim())) return null;
  const number = Number(value.trim());
  return Number.isSafeInteger(number) ? number : null;
}

export function validateCar(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "차량 정보를 입력해 주세요." };
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const year = integerFrom(body.year);
  const mileage = integerFrom(body.mileage);
  const price = integerFrom(body.price);

  if (name.length < 2 || name.length > 80) {
    return { error: "차량명은 2~80자로 입력해 주세요." };
  }
  if (year === null || year < 1990 || year > new Date().getFullYear() + 1) {
    return { error: "연식이 올바르지 않습니다." };
  }
  if (mileage === null || mileage < 0) {
    return { error: "주행거리는 0 이상의 정수여야 합니다." };
  }
  if (price === null || price < 0) {
    return { error: "가격은 0 이상의 정수(만원)여야 합니다." };
  }
  return { value: { name, year, mileage, price } };
}

export function createApp(options = {}) {
  const readOnly = options.readOnly ?? (
    process.env.NODE_ENV === "production" || process.env.DEMO_READ_ONLY === "1"
  );
  const additionalOrigins = (process.env.APP_CORS_ALLOWED_ORIGINS || "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const origins = options.allowedOrigins ?? [
    "http://localhost:5173", ...additionalOrigins,
  ];

  const app = express();
  let cars = initialCars.map((car) => ({ ...car }));
  let nextId = 3;

  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: "16kb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/config", (_req, res) => res.json({ readOnly }));
  app.get("/api/cars", (_req, res) => res.json(cars));

  // 공개 환경의 쓰기 요청은 인증이 없으므로 기본 차단합니다.
  app.use("/api/cars", (req, res, next) => {
    if (readOnly && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return res.status(403).json({ message: "공개 데모에서는 조회만 지원합니다." });
    }
    next();
  });

  app.post("/api/cars", (req, res) => {
    const parsed = validateCar(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    const created = { id: nextId++, ...parsed.value };
    cars.push(created);
    return res.status(201).json(created);
  });

  app.put("/api/cars/:id", (req, res) => {
    const id = integerFrom(req.params.id);
    if (id === null || id < 1) {
      return res.status(400).json({ message: "잘못된 매물 ID입니다." });
    }
    const index = cars.findIndex((car) => car.id === id);
    if (index < 0) return res.status(404).json({ message: "매물을 찾을 수 없습니다." });
    const parsed = validateCar(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });
    cars[index] = { id, ...parsed.value };
    return res.json(cars[index]);
  });

  app.delete("/api/cars/:id", (req, res) => {
    const id = integerFrom(req.params.id);
    if (id === null || id < 1) {
      return res.status(400).json({ message: "잘못된 매물 ID입니다." });
    }
    const oldLength = cars.length;
    cars = cars.filter((car) => car.id !== id);
    if (oldLength === cars.length) {
      return res.status(404).json({ message: "매물을 찾을 수 없습니다." });
    }
    return res.status(204).end();
  });

  return app;
}
```
파일: **server/index.js** — 실제 웹 서버 시작
```javascript
import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
createApp().listen(port, "0.0.0.0", () => {
  console.log(`Used-car API listening on port ${port}`);
});
```
**핵심 수정:** 문자열 `""`, `null`, 음수, 소수·지수 표기를 입력으로 전달해도 정상 숫자로 오인하지 않도록 검증합니다. 입력값은 서버에서도 검사해야 하며 React의 required 속성만 믿지 않습니다.
**운영 보안 기본값:** `NODE_ENV=production` 또는 `DEMO_READ_ONLY=1`이면 GET 조회는 허용하고 POST/PUT/DELETE는 403으로 차단합니다. 공개 Demo에 사용자 인증 없이 변경 API를 노출하지 않습니다.
## 4.4 2단계 — React/Vite 프로젝트 준비
이번 특강의 GitHub 저장소에는 `client/` 디렉터리와 React 소스가 **이미 들어 있습니다**. 기존 저장소를 사용하는 경우 새 프로젝트 생성 명령을 다시 실행하지 않습니다.
```bash
# 저장소 최상위에서 시작
cd client
npm install
npm run dev -- --host 0.0.0.0
```
Vite 프로젝트를 처음부터 만드는 방법을 설명할 때만 `npm create vite@latest client -- --template react`를 참고합니다. 이미 client 폴더가 있다면 실행하지 마세요.
파일: **client/vite.config.js**
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
```
Codespaces에서 React는 5173, Express는 3000 포트를 사용합니다. 개발 중 Vite 서버는 `/api` 요청을 Express로 프록시하지만, 배포 후 Vercel에서는 `VITE_API_BASE_URL`로 실제 Render 주소를 지정해야 합니다.
## 4.5 3단계 — React 화면 구현
파일: **client/src/App.jsx**. 앱 시작 시 `GET /api/config`로 공개 모드인지 확인합니다. 공개 배포는 조회 전용으로 보이며, Codespaces 개발 환경에서는 등록·수정·삭제 폼이 활성화됩니다.
```javascript
import { useEffect, useState } from "react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const emptyForm = () => ({
  name: "", year: String(new Date().getFullYear()), mileage: "0", price: "",
});

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `HTTP ${response.status} 오류`);
  return data;
}

export default function App() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setCars(await api("/api/cars"));
  }

  useEffect(() => {
    let active = true;
    Promise.all([api("/api/config"), api("/api/cars")])
      .then(([config, items]) => {
        if (!active) return;
        setReadOnly(Boolean(config.readOnly));
        setCars(items);
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  function edit(car) {
    if (readOnly || loading) return;
    setEditingId(car.id);
    setForm({
      name: car.name, year: String(car.year),
      mileage: String(car.mileage), price: String(car.price),
    });
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (readOnly || loading) return;
    setLoading(true);
    setError("");
    try {
      const path = editingId === null ? "/api/cars" : `/api/cars/${editingId}`;
      await api(path, {
        method: editingId === null ? "POST" : "PUT",
        body: JSON.stringify(form),
      });
      setEditingId(null);
      setForm(emptyForm());
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (readOnly || loading || !window.confirm("매물을 삭제하시겠습니까?")) return;
    setLoading(true);
    setError("");
    try {
      await api(`/api/cars/${id}`, { method: "DELETE" });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCars = cars.filter((car) =>
    car.name.toLocaleLowerCase("ko").includes(keyword.trim().toLocaleLowerCase("ko"))
  );

  return (
    <main className="container">
      <header>
        <p className="eyebrow">세종사이버대학교 온라인 특강 · 학습용 프로토타입</p>
        <h1>중고차 매물 관리</h1>
        <p>React + Express + GitHub Codespaces + Codex CLI</p>
        {readOnly && <p className="notice">공개 배포 환경은 조회 전용입니다. CRUD는 비공개 개발 환경에서 실습합니다.</p>}
      </header>

      <section className="summary">
        <strong>전체 매물 {cars.length}대</strong>
        <input aria-label="차량 검색" placeholder="차량명 검색" value={keyword}
               onChange={(event) => setKeyword(event.target.value)} />
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="layout">
        <div className="card">
          <h2>매물 목록</h2>
          {!filteredCars.length && <p>검색 결과가 없습니다.</p>}
          {filteredCars.map((car) => (
            <article className="car" key={car.id}>
              <div>
                <strong>{car.name}</strong>
                <p>{car.year}년 · {car.mileage.toLocaleString()}km</p>
                <p>{car.price.toLocaleString()}만원</p>
              </div>
              {!readOnly && (
                <div className="actions">
                  <button disabled={loading} onClick={() => edit(car)}>수정</button>
                  <button disabled={loading} onClick={() => remove(car.id)}>삭제</button>
                </div>
              )}
            </article>
          ))}
        </div>

        {!readOnly && (
          <form className="card form" onSubmit={submit}>
            <h2>{editingId === null ? "매물 등록" : "매물 수정"}</h2>
            <label>차량명
              <input name="name" value={form.name}
                     onChange={(event) => setForm({ ...form, name: event.target.value })}
                     minLength={2} maxLength={80} required />
            </label>
            <label>연식
              <input name="year" type="number" min="1990"
                     value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} required />
            </label>
            <label>주행거리 (km)
              <input name="mileage" type="number" min="0"
                     value={form.mileage} onChange={(event) => setForm({ ...form, mileage: event.target.value })} required />
            </label>
            <label>가격 (만원)
              <input name="price" type="number" min="0"
                     value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            </label>
            <button className="primary" type="submit" disabled={loading}>
              {loading ? "처리 중" : editingId === null ? "등록" : "수정 저장"}
            </button>
            {editingId !== null && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()); }}>
                수정 취소
              </button>
            )}
          </form>
        )}
      </section>
      <footer>가상 데이터만 사용합니다. 서버 재시작 또는 재배포 시 메모리 변경 내용은 초기화됩니다.</footer>
    </main>
  );
}
```
파일: **client/src/index.css**
```css
* { box-sizing: border-box; }
body { margin: 0; background: #f4f6fa; color: #1d2939; font-family: system-ui, sans-serif; }
.container { max-width: 1120px; margin: 0 auto; padding: 32px 20px; }
h1 { margin: 0 0 8px; }
.eyebrow { font-size: 0.82rem; font-weight: 700; color: #365fa0; }
header p, .car p, footer { color: #526073; }
.notice { background: #edf4ff; padding: 12px; border-radius: 8px; }
.summary { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin: 28px 0; }
.layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; }
.card { background: white; border: 1px solid #dfe4ee; border-radius: 14px; padding: 22px; }
.car { border-top: 1px solid #e7ecf2; padding: 14px 0; display: flex; justify-content: space-between; gap: 12px; }
.car p { margin: 4px 0; }
.actions { display: flex; gap: 8px; align-items: center; }
.form { display: grid; gap: 14px; align-content: start; }
.form label { display: grid; gap: 5px; font-size: 0.92rem; }
input { padding: 10px; border: 1px solid #bcc8d9; border-radius: 8px; }
button { padding: 10px 14px; border: 1px solid #bcc8d9; border-radius: 8px; cursor: pointer; background: white; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button.primary { color: white; background: #315f9c; border-color: #315f9c; }
.error { color: #a61b1b; background: #fff0f0; border-radius: 8px; padding: 12px; }
footer { margin-top: 26px; font-size: 0.85rem; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  .summary, .car { flex-direction: column; align-items: stretch; }
}
```
Vite가 만든 client/src/main.jsx는 기본 import를 유지하면서 App.jsx와 index.css를 불러옵니다. GitHub 저장소에는 완성된 예제의 main.jsx가 포함됩니다.
## 4.6 4단계 — 실행
**첫 번째 터미널**
```bash
cd server
npm start
```
**두 번째 터미널**
```bash
cd client
npm run dev -- --host 0.0.0.0
```
Codespaces PORTS에서 5173 포트를 열고 화면을 확인합니다. React가 5173, Express가 3000 포트로 실행되며 개발 단계에서는 Vite가 /api 요청을 프록시합니다.
## 4.7 5단계 — REST API 테스트 및 반례 검증
Codespaces 개발 환경(`NODE_ENV`를 production으로 설정하지 않은 상태)에서 서버를 실행하면 CRUD를 사용할 수 있습니다.
```bash
cd server
npm install
npm test
npm start
```
Node 내장 테스트 러너가 아래 항목을 검사합니다.
① 정상 매물의 등록·조회·수정·삭제(201/200/204)
② 잘못된 입력: 가격과 주행거리의 빈 문자열·null·음수, 잘못된 연식, 소수·지수 표기(400)
③ 존재하지 않는 id 수정/삭제(404)
④ 읽기 전용 배포 환경에서 쓰기 요청 거부(403)
파일: **server/test/app.test.js**
```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp, validateCar } from "../app.js";

const valid = { name: "기아 K8", year: 2022, mileage: 45000, price: 2650 };

async function withServer(readOnly, callback) {
  const server = createApp({ readOnly }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await callback(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function request(base, path, method = "GET", body) {
  const response = await fetch(`${base}${path}`, {
    method,
    ...(body !== undefined ? {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data };
}

test("입력 검증: 빈 문자열, null, 음수, 소수, 잘못된 연식 거부", () => {
  for (const [key, value] of [
    ["price", ""], ["price", null], ["price", -1],
    ["mileage", ""], ["mileage", null], ["mileage", -1],
    ["year", ""], ["year", null], ["year", 1850],
    ["price", 2.5], ["mileage", "1e4"],
  ]) {
    assert.ok(validateCar({ ...valid, [key]: value }).error, `${key}=${String(value)}`);
  }
  assert.equal(validateCar(valid).value.price, 2650);
});

test("CRUD: 200/201/400/404/204와 상태 변경 확인", async () => {
  await withServer(false, async (base) => {
    assert.equal((await request(base, "/health")).status, 200);
    let r = await request(base, "/api/cars");
    assert.equal(r.status, 200);
    assert.equal(r.data.length, 2);

    r = await request(base, "/api/cars", "POST", valid);
    assert.equal(r.status, 201);
    const id = r.data.id;

    r = await request(base, `/api/cars/${id}`, "PUT", { ...valid, price: 2490 });
    assert.equal(r.status, 200);
    assert.equal(r.data.price, 2490);

    r = await request(base, "/api/cars", "POST", { ...valid, price: "" });
    assert.equal(r.status, 400);
    r = await request(base, `/api/cars/${id}`, "PUT", { ...valid, mileage: null });
    assert.equal(r.status, 400);
    r = await request(base, "/api/cars/99999", "PUT", valid);
    assert.equal(r.status, 404);

    r = await request(base, `/api/cars/${id}`, "DELETE");
    assert.equal(r.status, 204);
    r = await request(base, `/api/cars/${id}`, "DELETE");
    assert.equal(r.status, 404);
  });
});

test("공개 환경은 쓰기 요청 차단, 조회 허용", async () => {
  await withServer(true, async (base) => {
    assert.deepEqual((await request(base, "/api/config")).data, { readOnly: true });
    assert.equal((await request(base, "/api/cars")).status, 200);
    assert.equal((await request(base, "/api/cars", "POST", valid)).status, 403);
    assert.equal((await request(base, "/api/cars/1", "PUT", valid)).status, 403);
    assert.equal((await request(base, "/api/cars/1", "DELETE")).status, 403);
  });
});
```
수동 점검:
```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3000/api/config
curl -i http://localhost:3000/api/cars
curl -i -X POST http://localhost:3000/api/cars \
  -H 'Content-Type: application/json' \
  -d '{"name":"기아 K8","year":2022,"mileage":45000,"price":2650}'
curl -i -X POST http://localhost:3000/api/cars \
  -H 'Content-Type: application/json' \
  -d '{"name":"기아 K8","year":2022,"mileage":45000,"price":""}'
```
마지막 요청은 반드시 400이어야 합니다. React에서는 폼 입력값이 문자열로 전달되므로 서버가 문자열 숫자를 안전하게 처리하는지도 확인합니다.
## 4.8 6단계 — Codex CLI 시연 프롬프트
**녹화 시작 전** 위 예제 또는 동일한 기능의 실행 가능 저장소를 마련합니다. 촬영 중 처음부터 생성하지 않고, 다음과 같이 **목록 검색 UI 개선**을 AI에게 수행시키는 구성을 권합니다.
```plain text
현재 저장소를 먼저 분석해 주세요. client와 server 구조와 API 경로를 설명하되
내 승인 전에는 수정하지 마세요.

그다음 React 화면의 차량명 검색 기능을 점검하고,
검색 결과 건수를 화면에 표시하도록 개선하는 최소 변경안을 제안해 주세요.
기존 CRUD API는 변경하지 마세요.
작업 후 npm run build, git diff --check, git diff로 확인하세요.
```
**시연 관찰 포인트:** ① 실제 파일 분석 ② 변경 범위 제한 ③ 수정 파일 확인 ④ 빌드/테스트 ⑤ 사람의 최종 승인.
## 4.9 제한 사항 및 공개 배포 안전 기준
- 모든 차량 데이터는 가상 데이터이며 실제 사용자·차량·개인정보를 포함하지 않습니다.
- 서버 메모리는 재시작·배포 후 초기화됩니다. 다중 인스턴스 공유 및 영구 저장이 되지 않습니다.
- 인증·인가·영구 데이터 저장이 없습니다. 이 프로젝트는 완성 서비스가 아닌 **프로토타입**입니다.
- `NODE_ENV=production`으로 실행한 공개 Render 서비스는 **조회 전용**입니다. 쓰기 요청은 403을 반환합니다.
- 전체 CRUD는 비공개 Codespaces 환경에서 시연합니다. 외부 클라우드에서는 화면·API 조회, 자동 배포를 확인합니다.
- CORS는 브라우저 접근 정책이며 API 인증을 대신하지 않습니다.
**검증 상태:** 코드에 자동 테스트를 포함하고 GitHub Actions에서 npm 기반 API 테스트 및 React 빌드를 수행합니다. 실제 GitHub Actions 통과 여부는 작업 이력으로 확인해야 하며 Render·Vercel의 실제 배포는 별도 리허설이 필요합니다. 촬영 전 리허설에서 명령·버전·데이터 흐름을 확인해야 합니다.
