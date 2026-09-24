import { useEffect, useState } from "react";

// 기본은 다크 테마, 라이트 선택 시 body.light-mode 추가 (localStorage 에 저장)
export const useTheme = () => {
  const [isLight, setIsLight] = useState(() => localStorage.getItem("theme") === "light");

  useEffect(() => {
    document.body.classList.toggle("light-mode", isLight);
  }, [isLight]);

  const toggleTheme = () => {
    const next = !isLight;
    localStorage.setItem("theme", next ? "light" : "dark");
    setIsLight(next);
  };

  return { isLight, toggleTheme };
};

// 마지막으로 사용한 닉네임 (이름 설정 시 저장, 프로필 표시 / 이름 입력 기본값에 사용)
export const NICKNAME_KEY = "nickname";
