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
