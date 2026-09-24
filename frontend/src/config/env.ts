// 실행 환경별 백엔드 주소 설정
// - 로컬(localhost / 127.0.0.1)에서 접속하면 로컬 백엔드(8080) 사용
// - 그 외(https://play.chan.it.kr 등 개발 서버)는 프론트와 백엔드가 같은 주소에서 서비스되므로 현재 접속 주소 사용
// - .env 파일에 VITE_API_BASE_URL 이 지정되어 있으면 그 값을 우선 사용

type EnvName = 'local' | 'dev';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

export const ENV_NAME: EnvName = LOCAL_HOSTS.includes(window.location.hostname) ? 'local' : 'dev';

const ENV_API_BASE: Record<EnvName, string> = {
  local: 'http://localhost:8080',
  dev: window.location.origin,
};

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL || ENV_API_BASE[ENV_NAME];

export const WS_URL = `${API_BASE}/ws-stomp`;
