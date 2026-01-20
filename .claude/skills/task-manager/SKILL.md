# Task Manager Skill

## 목적
작업 생성, 상태관리, 조회를 담당하는 스킬

## 적용 시점
- 작업 CRUD 구현 시
- 작업 상태 관리 시

## 구현 원칙

### ID 생성
- 날짜 기반 고유 ID: `YYYYMMDD-HHmmss-XXX`
- XXX는 랜덤 3자리 영숫자

### 우선순위 시스템
| 레벨 | 값 | 상수 |
|------|-----|------|
| URGENT | 4 | PRIORITY.URGENT |
| HIGH | 3 | PRIORITY.HIGH |
| NORMAL | 2 | PRIORITY.NORMAL |
| LOW | 1 | PRIORITY.LOW |

### 파일 구조
- 인덱스 파일: tasks.json, completed.json, failed.json
- 개별 작업 파일: tasks/{taskId}.json

### 원자적 파일 쓰기
```javascript
const tempPath = filePath + '.tmp';
fs.writeFileSync(tempPath, data);
fs.renameSync(tempPath, filePath);
```

### 작업 정렬
- 1차: 우선순위 내림차순 (URGENT → LOW)
- 2차: 생성시간 오름차순 (오래된 것 먼저)

### 상태 전이
- ready → inProgress (startTask)
- inProgress → completed (completeTask)
- inProgress → failed (failTask, 재시도 소진 시)
- inProgress → ready (incrementRetry, 재시도 가능 시)

## 참고 파일
- src/tasks.js
