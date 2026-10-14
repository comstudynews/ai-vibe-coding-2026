# 생성형 AI와 바이브 코딩: AI 기반 웹 서비스 설계부터 개발·배포까지

세종사이버대학교 AI응용소프트웨어공학과 온라인 특강(90분)용 교재와 중고차 CRUD **프로토타입**입니다.

[Notion 특강 교재](https://app.notion.com/p/3f991bd5a9ac81f59c2bc4cab7f35c1a) · [강의 문서](docs/README.md)

## 프로젝트 구조

```text
client/           React + Vite UI (5173)
server/           Express REST API (3000)
server/test/      Node.js 내장 테스트 러너로 CRUD 검증
docs/             강의 교재 6개 장 및 실습 안내
.devcontainer/    GitHub Codespaces 개발 환경
AGENTS.md         Codex CLI 작업 지침
.github/workflows/ci.yml   빌드·테스트 검사
```

## 빠른 시작 (Node.js 24 권장)

GitHub Codespaces에서 개발하거나 Node.js가 설치된 PC에서 실행합니다.

```bash
# 1번 터미널: 백엔드
cd server
npm install
npm test
npm start

# 2번 터미널: 프론트엔드 (저장소 루트 기준)
cd client
npm install
npm run dev -- --host 0.0.0.0
```

브라우저에서 http://localhost:5173 (Codespaces에서는 Ports에서 5173 열기)를 확인합니다. 초기 차량 데이터는 합성 예시입니다.

### 검증

```bash
cd server && npm test
cd ../client && npm run build
```

## Codex CLI 시연

```bash
npm install -g @openai/codex
codex
```

계정 인증은 녹화 전에 완료합니다. 먼저 프로젝트 분석만 요청하고 변경·테스트·diff 확인 후 커밋합니다.

## 배포

- **Render (백엔드):** 저장소 연결, Root Directory `server`, Build `npm install`, Start `npm start`, Health `/health`; 환경변수 `NODE_ENV=production`, `APP_CORS_ALLOWED_ORIGINS=https://실제-Vercel-도메인`.
- **Vercel (프론트엔드):** Root Directory `client`, Framework Vite, Build `npm run build`, Output `dist`, 환경변수 `VITE_API_BASE_URL=https://실제-Render-도메인`.
- **배포 순서:** Render 주소 확보 → Vercel 주소 확보 → Render CORS 업데이트 → 통합 GET 검증.

**안전 기본값:** `NODE_ENV=production` 또는 `DEMO_READ_ONLY=1`인 서버에서는 POST/PUT/DELETE가 403으로 차단됩니다. Codespaces의 비공개 개발 서버에서 전체 CRUD를 시연하고, 공개 클라우드에서는 목록 조회·배포·연동을 시연합니다. 외부 공개 쓰기 API를 허용하지 않습니다.

**Vercel Hobby:** 개인·비상업적 용도 제한을 확인해야 하므로 대학 유료 특강용 계정·요금제 적합성을 검토한 뒤 배포합니다. Render 무료 서비스는 유휴 중지·콜드 스타트가 발생할 수 있습니다.

## 제한 사항

- 로그인·인가·영구 저장소 없이 메모리 배열을 사용하는 **학습용 프로토타입**입니다. 서버 재시작 시 매물 변경 사항이 사라집니다.
- Codex CLI로 개발하는 예제이며, 결과 앱은 OpenAI API 또는 RAG를 호출하지 않습니다.
- 실제 차량·실사용 개인정보·비밀키를 저장소에 올리지 마세요.
- 외부 서비스의 실제 빌드/배포 성공은 계정 설정과 GitHub Actions 결과 및 촬영 전 리허설로 확인해야 합니다.

## 라이선스

학습·개인 시연을 위한 코드입니다. 외부 교안의 텍스트·이미지나 학교 로고는 포함하지 않았습니다. 타인에게 재배포할 때 저작권·상표·각 서비스 이용약관을 확인하세요.
