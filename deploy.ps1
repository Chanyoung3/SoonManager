# 찬영의 놀이터(ChanPlay) 개발 서버 배포 스크립트 (OpenSSH scp / ssh + 키 로그인)
# 실행: deploy.bat 더블클릭 (또는 PowerShell 에서 .\deploy.ps1)
# 서버의 ~/.ssh/authorized_keys 에 chanplay_deploy.pub 이 등록되어 있으면 비밀번호 없이, 없으면 비밀번호 입력

$ErrorActionPreference = 'Stop'

# ===== 서버 설정 =====
$SERVER_HOST = '211.233.210.113'
$SERVER_USER = 'root'
$REMOTE_DIR  = '/root'
$JAR_NAME    = 'chanplay-0.0.1-SNAPSHOT.jar'
$REMOTE_JAVA = '/usr/lib/jvm/jre-21/bin/java'   # 서버 기본 java 는 1.8 이라 21 경로 직접 지정
$KEY_FILE    = Join-Path $env:USERPROFILE '.ssh\chanplay_deploy'
# =====================

$root = $PSScriptRoot
$jar  = Join-Path $root "backend\build\libs\$JAR_NAME"
$target = "$SERVER_USER@$SERVER_HOST"
$sshOpts = @( '-i' , $KEY_FILE , '-o' , 'StrictHostKeyChecking=accept-new' )

Write-Host "[1/3] 빌드 (frontend + backend jar)" -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
try {
    & .\gradlew.bat bootJar
    if ( $LASTEXITCODE -ne 0 ) { throw '빌드 실패' }
}
finally {
    Pop-Location
}

Write-Host "[2/3] 서버로 업로드" -ForegroundColor Cyan
& scp @sshOpts $jar "${target}:$REMOTE_DIR/$JAR_NAME"
if ( $LASTEXITCODE -ne 0 ) { throw '업로드 실패 (서버에 키가 등록되어 있는지 확인)' }

Write-Host "[3/3] 서버에서 재시작 (profile=dev)" -ForegroundColor Cyan
# jar 이름을 변수(`$JAR)로 넘김: 명령 문자열에 실제 이름이 없어야 pkill 이 이 셸 자신을 죽이지 않음
$restart = @"
cd $REMOTE_DIR
JAR=$JAR_NAME
pkill -f java.-jar.`$JAR && sleep 3
nohup $REMOTE_JAVA -jar `$JAR --spring.profiles.active=dev > chanplay.log 2>&1 < /dev/null &
sleep 1
echo 'started. log: tail -f $REMOTE_DIR/chanplay.log'
"@ -replace "`r", ''
& ssh @sshOpts $target $restart
if ( $LASTEXITCODE -ne 0 ) { throw '재시작 실패' }

Write-Host ""
Write-Host "배포 완료 -> https://play.chan.it.kr/" -ForegroundColor Green
