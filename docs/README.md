# 세종사이버대학교 바이브 코딩 특강 교재

**강의:** 생성형 AI와 바이브 코딩: AI 기반 웹 서비스 설계부터 개발·배포까지
**강사:** 김범준 · **대상:** AI응용소프트웨어공학과 · **시간:** 90분(이론·실제 개발 시연)

각 문서는 Notion 교재의 최신 검토본을 GitHub Markdown으로 정리했습니다.
교재의 코드와 실습 소스는 동일 저장소의 `client/`, `server/`를 기준으로 합니다.

1. [강의 개요와 90분 구성](00-course-overview.md)
2. [제1장. 생성형 AI·바이브 코딩과 소프트웨어 기획](01-ai-vibe-coding-planning.md)
3. [제2장. 프롬프트·컨텍스트·하네스 엔지니어링](02-prompt-context-harness.md)
4. [제3장. GitHub Codespaces·Codex CLI](03-codespaces-codex.md)
5. [제4장. 중고차 CRUD 앱 구현 및 검증](04-crud-development.md)
6. [제5장. GitHub·DevOps·Render·Vercel 배포](05-devops-deployment.md)
7. [제6장. 녹화 시나리오와 PPT 설계](06-shooting-ppt-guide.md)

[원본 Notion 교재](https://app.notion.com/p/3f991bd5a9ac81f59c2bc4cab7f35c1a)

> 공개 Render 환경은 `NODE_ENV=production`으로 **조회 전용**으로 운영합니다. CRUD는 비공개 Codespaces 개발 환경에서 시연하고, 실제 서비스로 확장하려면 별도 인증·영구 저장·보안 검증이 필요합니다.

**검증:** GitHub Actions에서 Node.js 24 API 테스트와 React 빌드를 자동 실행합니다. 다만 외부 클라우드 배포, Codespaces 컨테이너 빌드와 촬영 리허설까지 검증하는 것은 아닙니다.
