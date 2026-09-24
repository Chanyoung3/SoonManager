// 플레이어 아바타 (로봇 / 허스키 / 강아지 / 병아리 / 펭귄)
export const AVATARS = [1, 2, 3, 4, 5].map((n) => `/images/room/avatar-${n}.png`);

// 같은 이름은 항상 같은 아바타가 나오도록 이름으로 고정 배정
export const avatarFor = (name: string | null | undefined): string => {
  if (!name) return AVATARS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATARS[Math.abs(hash) % AVATARS.length];
};

export const GAME_NAMES: Record<string, string> = {
  who: "주인 찾기",
  what: "퀴즈 대결",
  liar: "라이어 게임",
};

// 게임별 아이콘 이미지
export const GAME_ICONS: Record<string, string> = {
  who: "/images/room/badge-heart.png",
  what: "/images/room/game-icon-quiz.png",
  liar: "/images/room/badge-sparkle.png",
};
