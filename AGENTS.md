# AGENTS.md — 중고차 CRUD 특강 실습

## 구성
- `client/`: React 19 + Vite 프론트엔드
- `server/`: Express REST API, 메모리 CRUD
- `server/test/`: Node.js 내장 테스트

## 작업 원칙
- 먼저 현재 구조와 변경 대상 파일을 설명합니다. 승인 없이 광범위하게 수정하지 않습니다.
- 기존 API 경로 `/api/cars`와 `/health`를 유지합니다.
- 실제 차량·사용자 개인정보와 API 키를 넣지 않습니다.
- 공개 배포 기본 읽기 전용(`NODE_ENV=production`)을 해제하지 않습니다.
- 데이터베이스/새 라이브러리는 요구 없이 추가하지 않습니다.
- 테스트는 `cd server && npm test`, 프론트엔드 빌드는 `cd client && npm run build`.
- 작업 후 `git diff --check`, `git diff` 확인 뒤 사람의 승인을 받습니다.

> 이 파일은 Codex의 **지침**이지 권한 제어나 보안 샌드박스가 아닙니다. 명령 권한과 실행 환경을 별도로 관리하세요.
