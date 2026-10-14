> **이론 4 + 시연 1 \| 이론 6분·시연 5분** — 설치·인증은 사전에 완료하고, 녹화에서는 실행 흐름을 확인합니다.
# 제3장. GitHub Codespaces·Codex CLI 개발 환경
## 3.1 GitHub Codespaces란?
GitHub 저장소와 연결된 클라우드 개발 환경으로, 브라우저에서 VS Code 형태의 편집기와 Linux 터미널을 사용할 수 있습니다. Codespace는 클라우드 VM 위에서 Dev Container 기반으로 구성됩니다. 브라우저를 닫는 것과 Codespace를 중지하는 것은 다릅니다.
```plain text
GitHub Repository
  └─ .devcontainer/devcontainer.json
        └─ GitHub Codespace
             ├─ VS Code Web + Linux Terminal
             ├─ Node.js / npm
             ├─ Codex CLI
             ├─ React Vite :5173
             └─ Express :3000
```
## 3.2 Codespaces 생성
① GitHub 로그인 후 실습 저장소로 이동합니다.
② **Code → Codespaces → Create codespace on main**을 선택합니다.
③ VS Code 웹 화면과 터미널이 열리면 다음을 확인합니다.
```bash
pwd
git status
node --version
npm --version
```
**확인 기준:** 위치가 /workspaces/저장소명 형식이며 Node.js, npm 버전이 출력됩니다.
## 3.3 Dev Container 구성
파일 위치: **.devcontainer/devcontainer.json**
GitHub 저장소에 실제 업로드한 개발 컨테이너 구성입니다. Node.js 24 환경을 사용하며, Codespace 생성 직후 client·server 의존성을 설치합니다.
```json
{
  "name": "ai-vibe-coding-node24",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:1-24-bookworm",
  "forwardPorts": [
    5173,
    3000
  ],
  "portsAttributes": {
    "3000": {
      "label": "Express API",
      "onAutoForward": "silent"
    },
    "5173": {
      "label": "React UI",
      "onAutoForward": "notify"
    }
  },
  "postCreateCommand": "npm install --prefix server && npm install --prefix client"
}
```
① GitHub 저장소에서 Codespace를 생성합니다.
② 필요한 경우 명령 팔레트에서 **Codespaces: Rebuild Container**를 실행합니다.
③ `node --version`, `npm --version`, `npm test --prefix server` 등으로 환경을 확인합니다.
④ Ports 탭의 5173과 3000 포트는 기본적으로 Private로 유지합니다.
**주의:** GitHub Actions의 Node.js 테스트와 Codespaces의 실제 Dev Container 이미지 구동은 서로 다른 검증입니다. 컨테이너 생성 및 Codex 로그인은 촬영 전에 직접 확인해야 합니다.
## 3.4 Codex CLI 개념
Codex CLI는 터미널에서 실행하는 AI 코딩 에이전트입니다. 프로젝트 파일 읽기, 수정안 작성, 승인 범위 내 명령 실행, 빌드·테스트 보조가 가능합니다. **GitHub Codespaces는 개발 환경이고 Codex CLI는 그 안에서 사용하는 AI 도구**입니다.
## 3.5 설치 및 인증
사용자 제공 「GitHub Codespaces에서 Codex CLI 사용 방법」 2~4쪽을 기본으로 정리한 실습입니다. 설치 스크립트는 공식 OpenAI 저장소에서 확인할 수 있지만, 외부 스크립트 실행은 출처를 확인한 후 진행해야 합니다.
```bash
# 공식 Codex CLI 설치 스크립트: Codespaces Linux 환경
curl -fsSL https://chatgpt.com/codex/install.sh | sh

# 현재 쉘에서 명령을 찾지 못할 경우
export PATH="$HOME/.local/bin:$PATH"

which codex
codex --version
codex
```
대안: **npm install -g @openai/codex**. 두 설치 방식을 동시에 반복 설치할 필요는 없습니다.
**인증:** Codex를 실행하고 Sign in with ChatGPT를 선택합니다. Codespaces에서 브라우저 연동이 불편하면 기기 인증 방식을 시도할 수 있습니다.
```bash
codex login --device-auth
```
로그인 화면과 계정·권한 상태는 녹화 전 사전 준비합니다. 이용 가능 플랜·인증 정책·사용 한도는 계정마다 다를 수 있습니다.
## 3.6 프로젝트 루트에서 첫 작업
```bash
pwd
git status
codex
```
Codex 입력 예:
```plain text
현재 React·Express 프로젝트를 먼저 분석하세요.
1. 폴더 구조와 실행 방법
2. GET /api/cars 동작
3. 프론트엔드 API 호출 위치
4. 보안 및 데이터 저장 한계
분석 결과만 보고하고 파일은 변경하지 마세요.
```
그다음 AI의 분석 결과와 실제 파일을 대조한 후 특정 기능을 구현하도록 지시합니다.
## 3.7 보안과 비용
- ChatGPT 구독, Codex 사용 권한, API 과금은 서로 구별합니다.
- Codespaces는 사용 시간·저장소 등 계정별 한도가 있고, 종료하지 않으면 자원이 소모될 수 있습니다.
- 비밀키 확인에 **echo $OPENAI_API_KEY**를 사용하지 않습니다. 키의 존재 여부만 확인합니다.
- Codespaces와 공개 GitHub 저장소에 인증정보·신분증·실사용 개인정보 등을 올리지 않습니다.
- 실습 완료 후 Codespace를 **Stop**하여 불필요한 비용을 줄입니다.
```bash
if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "API Key 등록 확인"
else
  echo "API Key 미등록"
fi
```
## 3.8 장애와 점검

| 증상 | 확인 | 조치 |
| --- | --- | --- |
| codex 명령 없음 | which codex, PATH | 설치 경로와 .local/bin 확인 |
| 로그인 실패 | 계정 권한, 팝업, 네트워크 | device-auth 또는 계정 설정 점검 |
| 개발 서버 접속 불가 | 5173/3000 포트, Vite 설정 | PORTS 탭과 서버 실행 로그 확인 |
| 환경 설정 변경 미반영 | devcontainer.json | Rebuild Container |

## 3.9 요약
촬영에서는 개발 환경 구성의 원리와 주요 명령을 설명하고, 실제 실행은 **이미 인증된 Codespace에서 codex --version → 구조 분석 → 변경 계획 확인 → 최소 UI 변경 → 빌드·테스트** 흐름으로 보여 줍니다. 공개 배포에서의 CRUD 쓰기는 차단하므로 데이터 변경 시연은 비공개 Codespace에서 수행합니다.
**공식 문서:** [GitHub Codespaces](https://docs.github.com/en/codespaces/overview) · [포트 전달](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace) · [OpenAI Codex CLI](https://github.com/openai/codex)
