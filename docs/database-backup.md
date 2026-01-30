# 데이터베이스 백업 및 복구 전략

## 자동 백업 (Supabase 기본 제공)
- Supabase는 매일 자동 백업 수행 (최근 7일 보관)
- Dashboard > Settings > Backups에서 확인 가능
- Point-in-Time Recovery (PITR) 활성화 권장 (Pro 플랜 이상)

## 수동 백업
정기적으로 중요 데이터를 로컬에 백업하세요:

```bash
# PostgreSQL dump 생성
pg_dump -h db.xxxx.supabase.co -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
pg_dump -h db.xxxx.supabase.co -U postgres -d postgres -t courses -t bookmarks > partial_backup.sql
```

## 복구 절차
1. Supabase Dashboard에서 복구 포인트 선택
2. 새 프로젝트로 복원 (테스트 후 전환)
3. 또는 SQL 파일로 복원: `psql -h ... -U postgres -d postgres < backup.sql`

## 백업 스케줄
- 매일 자동: Supabase
- 매주 수동: 중요 테이블 로컬 백업
- 매월: 전체 DB 덤프 + 외부 저장소(AWS S3 등)에 보관
