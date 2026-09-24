import { Moon, Sun } from 'lucide-react';
import { useTheme } from "./useTheme";
import "./Header.css";

// 파란 행성 마크
const PlanetMark = () => (
  <svg className="logo-mark" viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <radialGradient id="planet-body" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#9fd4ff" />
        <stop offset="45%" stopColor="#3d8bff" />
        <stop offset="100%" stopColor="#1b3fbf" />
      </radialGradient>
      <linearGradient id="planet-ring" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7cc4ff" />
        <stop offset="100%" stopColor="#8b7bff" />
      </linearGradient>
    </defs>
    {/* 뒤쪽 고리 */}
    <path d="M4 24 C 2 29, 38 18, 36 13" fill="none" stroke="url(#planet-ring)" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    <circle cx="20" cy="19" r="11" fill="url(#planet-body)" />
    {/* 앞쪽 고리 */}
    <path d="M36 13 C 40 20, 6 32, 4 24" fill="none" stroke="url(#planet-ring)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 로고 (사이드바 / 게임 화면 헤더 공용)
export const Logo = () => (
  <div className="logo-wrapper">
    <PlanetMark />
    <h1 className="logo">찬영의 <span className="logo-accent">놀이터</span></h1>
  </div>
);

export const ThemeToggle = () => {
  const { isLight, toggleTheme } = useTheme();
  return (
    <button
      className="nav-button theme-toggle-btn"
      title={isLight ? "Dark mode" : "Light mode"}
      onClick={toggleTheme}
    >
      {isLight ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
    </button>
  );
};

// 게임 진행 화면(퀴즈 / 라이어)용 상단 헤더
const Header = () => (
  <header className="header-container">
    <Logo />
    <div className="button-group">
      <ThemeToggle />
    </div>
  </header>
);

export default Header;
