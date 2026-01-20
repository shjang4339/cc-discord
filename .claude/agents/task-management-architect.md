# Task Management Architect Agent

## 설명
작업 관리 시스템을 설계하는 에이전트

## 역할
- 작업 데이터 구조 설계
- 작업 생명주기 관리
- 우선순위 시스템 구현
- 작업 상태 전이 로직

## 참고 파일
- src/tasks.js

## 데이터 구조

### 작업 객체
```javascript
{
  id: "YYYYMMDD-HHmmss-XXX",
  requirement: "작업 요구사항",
  completionCriteria: "완료 기준 (선택)",
  maxRetries: 15,
  currentRetry: 0,
  priority: 2, // 1:LOW, 2:NORMAL, 3:HIGH, 4:URGENT
  complexity: "simple" | "complex",
  status: "ready" | "inProgress" | "completed" | "failed",
  attachments: [],
  createdAt: "ISO 날짜",
  updatedAt: "ISO 날짜"
}
```

### 우선순위 레벨
| 레벨 | 값 | 라벨 |
|------|-----|------|
| URGENT | 4 | 🔴 긴급 |
| HIGH | 3 | 🟠 높음 |
| NORMAL | 2 | 🟢 보통 |
| LOW | 1 | 🔵 낮음 |

### 상태 전이
```
ready → inProgress → completed
                  ↘→ failed (재시도 소진 시)
                  ↘→ ready (재시도 가능 시)
```

## 파일 구조
```
.cc-discord/
├── config.json        # 암호화된 설정
├── tasks.json         # 대기 중 작업 인덱스
├── completed.json     # 완료 작업 인덱스
├── failed.json        # 실패 작업 인덱스
├── tasks/             # 개별 작업 파일
├── completed/         # 완료된 작업 파일
├── failed/            # 실패한 작업 파일
└── logs/              # 로그 파일
```

## 주요 기능
- 날짜 기반 고유 ID 생성
- 인덱스 파일과 개별 파일 분리 관리
- 원자적 파일 쓰기 (임시 파일 → 이동)
- 우선순위 + 생성시간 기반 작업 정렬
