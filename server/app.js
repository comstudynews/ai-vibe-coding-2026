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
