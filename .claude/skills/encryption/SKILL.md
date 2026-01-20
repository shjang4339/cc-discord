# Encryption Skill

## 목적
봇 토큰 암호화를 담당하는 스킬

## 적용 시점
- 설정 정보 저장/로드 시
- 보안 관련 기능 개발 시

## 구현 원칙

### 암호화 알고리즘
- AES-256-GCM (인증된 암호화)
- 32바이트 키, 16바이트 IV

### 키 생성
```javascript
const machineId = hostname + username + platform;
const key = crypto.createHash('sha256').update(machineId).digest();
```

### 저장 형식
```
iv:authTag:encryptedData
```

- iv: 16바이트 (hex)
- authTag: 16바이트 (hex)
- encryptedData: 암호화된 데이터 (hex)

### 암호화 대상
- botToken
- clientId
- userId

### 복호화 실패 처리
- 복호화 실패 시 원본 값 그대로 반환
- 콜론(:)이 3개 미만이면 암호화되지 않은 것으로 간주

## 참고 파일
- src/config.js (encrypt, decrypt 함수)
