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
