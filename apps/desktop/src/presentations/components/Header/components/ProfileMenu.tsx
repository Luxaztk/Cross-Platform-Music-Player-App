import React from 'react';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { ICON_SIZES } from '@constants';
import { type ProfileMenuProps } from '../types';

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
    isOpen,
    activeMenuStack,
    menusToRender,
    menuHeight,
    dropdownRef,
    profileRef,
    onToggle,
    onPushMenu,
    onPopMenu,
    t
}) => {
    return (
        <div className="profile-container" ref={profileRef}>
            <button
                className={`user-profile-btn ${isOpen ? 'active' : ''}`}
                title={t('header.profile')}
                onClick={onToggle}
            >
                <div className="avatar">
                    <User size={ICON_SIZES.MEDIUM} />
                </div>
            </button>

            {isOpen && (
                <div
                    className="profile-dropdown"
                    onClick={(e) => e.stopPropagation()}
                    ref={dropdownRef}
                    style={{
                        height: menuHeight ? `${menuHeight}px` : undefined,
                        transition: 'height 0.3s ease',
                    }}
                >
                    <div
                        className="drilldown-slider"
                        style={{
                            transform: `translateX(-${activeMenuStack.length - 1}00%)`,
                        }}
                    >
                        {menusToRender.map((menu, index) => {
                            if (!menu) return null;
                            return (
                                <div key={menu.id} className="drilldown-page">
                                    {index > 0 && (
                                        <div className="dropdown-header" onClick={onPopMenu}>
                                            <ChevronLeft size={16} className="back-icon" />
                                            <span>{menu.title}</span>
                                        </div>
                                    )}
                                    <div className="dropdown-items">
                                        {menu.items.map((item) =>
                                            item.isDivider ? (
                                                <div key={item.id} className="dropdown-divider" />
                                            ) : (
                                                <button
                                                    key={item.id}
                                                    className={`dropdown-item ${item.isSelected ? 'selected' : ''} ${item.className || ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (item.children) {
                                                            onPushMenu(item.id);
                                                        } else if (item.action) {
                                                            item.action();
                                                        }
                                                    }}
                                                >
                                                    <div className="item-left">
                                                        {item.themeId && <div className="theme-dot" data-theme={item.themeId} />}
                                                        {item.icon && <div className="item-icon">{item.icon}</div>}
                                                        <span className="item-label">{item.label}</span>
                                                    </div>
                                                    <div className="item-right">
                                                        {item.rightElement}
                                                        {item.children && <ChevronRight size={16} className="item-chevron" />}
                                                    </div>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
