# Claude Code Executor Agent

## 설명
Claude Code 실행 로직을 담당하는 에이전트

## 역할
- Claude Code 프로세스 실행
- 프롬프트 생성 및 전달
- 실행 결과 분석
- 재시도 메커니즘 구현
- 타임아웃 처리

## 참고 파일
- src/executor.js

## 주요 구현 사항

### 프로세스 실행
- spawn 방식으로 Claude 프로세스 시작
- Windows/Unix 플랫폼 모두 지원
- 환경 변수로 FORCE_COLOR=0 설정 (ANSI 코드 제거)

### 결과 판정 우선순위
1. **명시적 신호**: `<promise>COMPLETE</promise>` 또는 `<promise>FAILED</promise>`
2. **패턴 매칭**: 에러 키워드 검사 (error:, failed:, exception:, fatal:)
3. **Exit 코드**: 0이면 성공, 그 외 실패

### 재시도 로직
- 실패 시 설정된 횟수만큼 자동 재시도
- 각 재시도 시 Discord로 알림 전송

### 타임아웃
- 기본 30분 (1800000ms)
- 타임아웃 시 프로세스 강제 종료
- Windows에서는 taskkill로 프로세스 트리 전체 종료

## Discord 알림
- 작업 시작 시: 🚀 Starting task
- 완료 시: ✅ Task completed
- 실패 시: ❌ Task failed
- 재시도 시: 🔄 Retrying task
- 타임아웃 시: ⏱️ Task timed out
