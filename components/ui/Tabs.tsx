'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type ReactNode } from 'react';

/**
 * Accessible Tab Panel component.
 *
 * Client Component.
 * Requirements: 14.3
 *
 * Implements:
 * - role="tablist", role="tab", role="tabpanel"
 * - aria-selected on active tab
 * - aria-controls / aria-labelledby linking tabs to panels
 * - Keyboard ← → arrow navigation between tabs
 * - Home/End key support
 */

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  children: (activeTabId: string) => ReactNode;
  defaultTabId?: string;
  className?: string;
  tabListClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  panelClassName?: string;
}

export default function Tabs({
  tabs,
  children,
  defaultTabId,
  className = '',
  tabListClassName = '',
  tabClassName = '',
  activeTabClassName = '',
  panelClassName = '',
}: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId ?? tabs[0]?.id ?? '');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let newIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        newIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        newIndex = 0;
      } else if (e.key === 'End') {
        newIndex = tabs.length - 1;
      }

      if (newIndex !== null) {
        e.preventDefault();
        setActiveTabId(tabs[newIndex].id);
        tabRefs.current[newIndex]?.focus();
      }
    },
    [tabs],
  );

  return (
    <div className={className}>
      {/* Tab list */}
      <div
        role="tablist"
        aria-label="Tab navigation"
        className={tabListClassName}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                tabClassName,
                isActive ? activeTabClassName : '',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5C518]',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={!isActive}
            tabIndex={0}
            className={panelClassName}
          >
            {isActive && children(tab.id)}
          </div>
        );
      })}
    </div>
  );
}
