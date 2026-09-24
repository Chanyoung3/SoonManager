import React from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Logo, ThemeToggle } from "./Header";
import { NICKNAME_KEY } from "./useTheme";
import { avatarFor } from "./avatar";
import "./AppShell.css";

export interface NavItem {
    key: string;
    label: string;
    // lucide 아이콘 또는 이미지 아이콘 중 하나
    icon?: LucideIcon;
    iconSrc?: string;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    disabled?: boolean;
}

interface AppShellProps {
    navItems: NavItem[];
    children: React.ReactNode;
    blur?: boolean;
    // 사이드바 하단 영역 (방 화면의 내 프로필 카드 등)
    sidebarFooter?: React.ReactNode;
    // 로고 클릭 동작 (기본: 홈 이동, 방 화면에서는 나가기 확인)
    onLogoClick?: () => void;
}

// 좌측 사이드바 + 상단 바(테마 / 프로필) + 본문 공통 레이아웃
const AppShell: React.FC<AppShellProps> = ({ navItems, children, blur, sidebarFooter, onLogoClick }) => {
    const navigate = useNavigate();
    const nickname = localStorage.getItem(NICKNAME_KEY);

    return (
        <div className={`app-shell ${blur ? "content-blur" : ""}`}>
            <aside className="app-sidebar">
                <button className="app-sidebar-logo" onClick={onLogoClick ?? (() => navigate("/"))}>
                    <Logo />
                </button>

                <nav className="app-nav">
                    {navItems.map(({ key, label, icon: Icon, iconSrc, onClick, active, danger, disabled }) => (
                        <button
                            key={key}
                            className={`app-nav-item ${active ? "active" : ""} ${danger ? "danger" : ""}`}
                            onClick={onClick}
                            disabled={disabled}
                            title={label}
                        >
                            {iconSrc ? <img className="app-nav-img" src={iconSrc} alt="" /> : Icon && <Icon size={20} />}
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>

                {sidebarFooter && <div className="app-sidebar-footer">{sidebarFooter}</div>}
            </aside>

            <div className="app-main">
                <div className="app-topbar">
                    <ThemeToggle />
                    <div className="app-profile">
                        <img className="app-profile-avatar" src={avatarFor(nickname)} alt="" />
                        <span className="app-profile-name">{nickname || "게스트"}</span>
                    </div>
                </div>
                <div className="app-content">{children}</div>
            </div>
        </div>
    );
};

export default AppShell;
