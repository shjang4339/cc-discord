# NPM Package Init Skill

## 목적
npx 실행 가능한 npm 패키지 구조 초기화를 담당하는 스킬

## 적용 시점
- 새 npm 패키지 생성 시
- CLI 도구 구조 설정 시

## 구현 원칙

### package.json 필수 필드

```json
{
  "name": "cc-discord",
  "version": "1.0.0",
  "main": "src/cli.js",
  "bin": {
    "cc-discord": "src/cli.js"
  },
  "files": [
    "src",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Shebang
```javascript
#!/usr/bin/env node
```
- cli.js 파일 첫 줄에 추가
- Unix/macOS에서 직접 실행 가능하게 함

### 엔진 요구사항
- Node.js 18.0.0 이상
- Discord.js v14 요구사항

### scripts
```json
{
  "scripts": {
    "start": "node src/cli.js",
    "deploy": "node src/discord/deploy-commands.js",
    "test": "jest --testTimeout=10000"
  }
}
```

### 의존성
```json
{
  "dependencies": {
    "discord.js": "^14.18.0"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

## 참고 파일
- package.json
