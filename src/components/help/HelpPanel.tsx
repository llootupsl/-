import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useHelpStore,
  useSearchHelp,
  useArticlesByCategory,
  useArticleById,
  useContextualHelp,
  HELP_CATEGORIES,
  HELP_ARTICLES,
  type HelpCategory,
  type HelpArticle,
} from '../../stores/helpStore';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextPanel?: string | null;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  contextPanel,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    selectCategory,
    selectedArticle,
    selectArticle,
  } = useHelpStore();

  const [viewMode, setViewMode] = useState<'categories' | 'search' | 'article'>('categories');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const contextualHelp = useContextualHelp(contextPanel);
  const searchResults = useSearchHelp(searchQuery);
  const categoryArticles = useArticlesByCategory(selectedCategory);
  const currentArticle = useArticleById(selectedArticle);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedArticle) {
      setViewMode('article');
    }
  }, [selectedArticle]);

  useEffect(() => {
    if (searchQuery) {
      setViewMode('search');
    } else if (!selectedArticle) {
      setViewMode('categories');
    }
  }, [searchQuery, selectedArticle]);

  const handleCategoryClick = useCallback((category: HelpCategory) => {
    selectCategory(category);
    setSearchQuery('');
    setViewMode('categories');
  }, [selectCategory, setSearchQuery]);

  const handleArticleClick = useCallback((articleId: string) => {
    selectArticle(articleId);
  }, [selectArticle]);

  const handleBack = useCallback(() => {
    if (viewMode === 'article') {
      selectArticle(null);
      setViewMode(selectedCategory ? 'categories' : 'search');
    } else if (viewMode === 'search') {
      setSearchQuery('');
      setViewMode('categories');
    }
  }, [viewMode, selectedCategory, selectArticle, setSearchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (viewMode === 'article' || viewMode === 'search') {
        handleBack();
      } else {
        onClose();
      }
    }
  }, [viewMode, handleBack, onClose]);

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="help-article-h2">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="help-article-h3">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith('| ')) {
        return (
          <div key={index} className="help-table-row">
            {line.split('|').filter(Boolean).map((cell, cellIndex) => (
              <span key={cellIndex} className="help-table-cell">
                {cell.trim()}
              </span>
            ))}
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="help-list-item">
            {line.slice(2)}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={index} className="help-list-item ordered">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="help-paragraph">
          {line}
        </p>
      );
    });
  };

  if (!isOpen) return null;

  const content = (
    <div
      className="help-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="帮助面板"
    >
      <div className="help-panel" role="document">
        <div className="help-header">
          <div className="help-header-left">
            {(viewMode === 'article' || viewMode === 'search') && (
              <button
                className="help-back-btn"
                onClick={handleBack}
                aria-label="返回"
              >
                ←
              </button>
            )}
            <h2 className="help-title">
              {viewMode === 'article' && currentArticle
                ? currentArticle.title
                : '帮助中心'}
            </h2>
          </div>
          <button
            className="help-close-btn"
            onClick={onClose}
            aria-label="关闭帮助"
          >
            ✕
          </button>
        </div>

        <div className="help-search">
          <input
            ref={searchInputRef}
            type="text"
            className="help-search-input"
            placeholder="搜索帮助内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="搜索帮助"
          />
          <span className="help-search-icon">🔍</span>
        </div>

        {contextualHelp && viewMode === 'categories' && !searchQuery && (
          <div className="help-contextual-tips">
            <div className="help-contextual-header">
              <span className="help-contextual-icon">💡</span>
              <span>当前面板提示</span>
            </div>
            <ul className="help-tips-list">
              {contextualHelp.tips.map((tip, index) => (
                <li key={index} className="help-tip-item">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="help-content" ref={articleRef}>
          {viewMode === 'categories' && !searchQuery && (
            <>
              <div className="help-categories">
                {HELP_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className={`help-category-card ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategoryClick(category.id)}
                    aria-pressed={selectedCategory === category.id}
                  >
                    <span className="help-category-icon">{category.icon}</span>
                    <span className="help-category-name">{category.name}</span>
                    <span className="help-category-desc">{category.description}</span>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="help-article-list">
                  <h3 className="help-list-title">
                    {HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                  </h3>
                  {categoryArticles.map((article) => (
                    <button
                      key={article.id}
                      className="help-article-item"
                      onClick={() => handleArticleClick(article.id)}
                    >
                      <span className="help-article-icon">{article.icon}</span>
                      <span className="help-article-title">{article.title}</span>
                      <span className="help-article-arrow">→</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {viewMode === 'search' && searchQuery && (
            <div className="help-search-results">
              <p className="help-results-count">
                找到 {searchResults.length} 个相关结果
              </p>
              {searchResults.length === 0 ? (
                <div className="help-no-results">
                  <span className="help-no-results-icon">🔍</span>
                  <p>未找到相关内容</p>
                  <p className="help-no-results-hint">尝试使用其他关键词</p>
                </div>
              ) : (
                searchResults.map((article) => (
                  <button
                    key={article.id}
                    className="help-article-item"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <span className="help-article-icon">{article.icon}</span>
                    <div className="help-article-info">
                      <span className="help-article-title">{article.title}</span>
                      <span className="help-article-category">
                        {HELP_CATEGORIES.find((c) => c.id === article.category)?.name}
                      </span>
                    </div>
                    <span className="help-article-arrow">→</span>
                  </button>
                ))
              )}
            </div>
          )}

          {viewMode === 'article' && currentArticle && (
            <div className="help-article-content">
              <div className="help-article-header">
                <span className="help-article-main-icon">{currentArticle.icon}</span>
                <div className="help-article-meta">
                  <span className="help-article-category-badge">
                    {HELP_CATEGORIES.find((c) => c.id === currentArticle.category)?.icon}
                    {HELP_CATEGORIES.find((c) => c.id === currentArticle.category)?.name}
                  </span>
                </div>
              </div>
              <div className="help-article-body">
                {renderMarkdown(currentArticle.content)}
              </div>
              {currentArticle.relatedArticles && currentArticle.relatedArticles.length > 0 && (
                <div className="help-related">
                  <h4 className="help-related-title">相关文章</h4>
                  <div className="help-related-list">
                    {currentArticle.relatedArticles.map((articleId) => {
                      const related = HELP_ARTICLES.find((article) => article.id === articleId);
                      if (!related) return null;
                      return (
                        <button
                          key={articleId}
                          className="help-related-item"
                          onClick={() => handleArticleClick(articleId)}
                        >
                          <span>{related.icon}</span>
                          <span>{related.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="help-footer">
          <div className="help-shortcuts">
            <span className="help-shortcut">
              <kbd>ESC</kbd> 关闭
            </span>
            <span className="help-shortcut">
              <kbd>H</kbd> 切换帮助
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .help-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 12, 20, 0.9);
          backdrop-filter: blur(12px);
          z-index: var(--z-modal, 30);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: helpFadeIn 0.2s ease-out;
        }

        @keyframes helpFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .help-panel {
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          background: var(--bg-overlay, #0C2035);
          border: 1px solid var(--border-active, rgba(26, 239, 251, 0.5));
          border-radius: var(--radius-xl, 16px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 0 60px rgba(26, 239, 251, 0.15), var(--shadow-xl, 0 24px 80px rgba(0, 0, 0, 0.9));
          animation: helpSlideIn 0.3s ease-out;
        }

        @keyframes helpSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .help-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(26, 239, 251, 0.05);
          border-bottom: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
        }

        .help-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .help-back-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-md, 8px);
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          cursor: pointer;
          transition: all 0.2s;
        }

        .help-back-btn:hover {
          background: rgba(26, 239, 251, 0.1);
          border-color: var(--accent, #1AEFFB);
          color: var(--accent, #1AEFFB);
        }

        .help-title {
          font-family: var(--font-display, 'ZCOOL QingKe HuangYou', sans-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent, #1AEFFB);
          letter-spacing: 0.05em;
        }

        .help-close-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted, #3A6B80);
          font-size: 1.25rem;
          cursor: pointer;
          border-radius: var(--radius-md, 8px);
          transition: all 0.2s;
        }

        .help-close-btn:hover {
          background: rgba(255, 56, 103, 0.15);
          color: var(--color-unrest, #FF3867);
        }

        .help-search {
          position: relative;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
        }

        .help-search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          background: var(--bg-surface, #071525);
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-lg, 12px);
          color: var(--text-primary, #D6F8FF);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }

        .help-search-input::placeholder {
          color: var(--text-muted, #3A6B80);
        }

        .help-search-input:focus {
          border-color: var(--accent, #1AEFFB);
          box-shadow: 0 0 0 3px rgba(26, 239, 251, 0.15);
        }

        .help-search-icon {
          position: absolute;
          left: 2rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: var(--text-muted, #3A6B80);
        }

        .help-contextual-tips {
          padding: 1rem 1.5rem;
          background: rgba(26, 239, 251, 0.05);
          border-bottom: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
        }

        .help-contextual-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent, #1AEFFB);
          margin-bottom: 0.5rem;
        }

        .help-contextual-icon {
          font-size: 1rem;
        }

        .help-tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .help-tip-item {
          padding: 0.25rem 0;
          font-size: 0.8rem;
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          padding-left: 1rem;
          position: relative;
        }

        .help-tip-item::before {
          content: '•';
          position: absolute;
          left: 0;
          color: var(--accent, #1AEFFB);
        }

        .help-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .help-categories {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .help-category-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          background: var(--bg-surface, #071525);
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-lg, 12px);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .help-category-card:hover,
        .help-category-card.active {
          background: rgba(26, 239, 251, 0.08);
          border-color: var(--accent, #1AEFFB);
          box-shadow: 0 0 20px rgba(26, 239, 251, 0.15);
        }

        .help-category-card.active {
          background: rgba(26, 239, 251, 0.12);
        }

        .help-category-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .help-category-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary, #D6F8FF);
          margin-bottom: 0.25rem;
        }

        .help-category-desc {
          font-size: 0.75rem;
          color: var(--text-muted, #3A6B80);
        }

        .help-article-list {
          border-top: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          padding-top: 1.5rem;
        }

        .help-list-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #D6F8FF);
          margin-bottom: 1rem;
        }

        .help-article-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.875rem 1rem;
          background: transparent;
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-md, 8px);
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .help-article-item:hover {
          background: rgba(26, 239, 251, 0.08);
          border-color: var(--border-hover, rgba(26, 239, 251, 0.28));
        }

        .help-article-icon {
          font-size: 1.25rem;
          margin-right: 0.75rem;
        }

        .help-article-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .help-article-title {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary, #D6F8FF);
        }

        .help-article-category {
          font-size: 0.75rem;
          color: var(--text-muted, #3A6B80);
        }

        .help-article-arrow {
          color: var(--text-muted, #3A6B80);
          font-size: 1rem;
        }

        .help-search-results {
          animation: helpFadeIn 0.2s ease-out;
        }

        .help-results-count {
          font-size: 0.8rem;
          color: var(--text-muted, #3A6B80);
          margin-bottom: 1rem;
        }

        .help-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 3rem;
          color: var(--text-muted, #3A6B80);
        }

        .help-no-results-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .help-no-results-hint {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }

        .help-article-content {
          animation: helpFadeIn 0.2s ease-out;
        }

        .help-article-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .help-article-main-icon {
          font-size: 2.5rem;
        }

        .help-article-category-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          background: rgba(26, 239, 251, 0.1);
          border-radius: var(--radius-sm, 4px);
          font-size: 0.75rem;
          color: var(--accent, #1AEFFB);
        }

        .help-article-body {
          line-height: 1.8;
        }

        .help-article-h2 {
          font-family: var(--font-display, 'ZCOOL QingKe HuangYou', sans-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--accent, #1AEFFB);
          margin: 1.5rem 0 1rem;
          letter-spacing: 0.05em;
        }

        .help-article-h3 {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary, #D6F8FF);
          margin: 1rem 0 0.5rem;
        }

        .help-paragraph {
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          margin: 0.5rem 0;
        }

        .help-list-item {
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          margin: 0.25rem 0 0.25rem 1.5rem;
          list-style: disc;
        }

        .help-list-item.ordered {
          list-style: decimal;
        }

        .help-table-row {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(26, 239, 251, 0.03);
          border-radius: var(--radius-sm, 4px);
          margin: 0.25rem 0;
        }

        .help-table-cell {
          flex: 1;
          font-size: 0.85rem;
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
        }

        .help-related {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
        }

        .help-related-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted, #3A6B80);
          margin-bottom: 0.75rem;
        }

        .help-related-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .help-related-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-surface, #071525);
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-md, 8px);
          font-size: 0.8rem;
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          cursor: pointer;
          transition: all 0.2s;
        }

        .help-related-item:hover {
          background: rgba(26, 239, 251, 0.08);
          border-color: var(--accent, #1AEFFB);
          color: var(--accent, #1AEFFB);
        }

        .help-footer {
          padding: 0.75rem 1.5rem;
          background: rgba(26, 239, 251, 0.03);
          border-top: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
        }

        .help-shortcuts {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }

        .help-shortcut {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted, #3A6B80);
        }

        .help-shortcut kbd {
          padding: 0.15rem 0.5rem;
          background: var(--bg-surface, #071525);
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-sm, 4px);
          font-family: var(--font-mono, 'JetBrains Mono', monospace);
          font-size: 0.7rem;
        }

        @media (max-width: 600px) {
          .help-overlay {
            padding: 0;
          }

          .help-panel {
            max-height: 100vh;
            border-radius: 0;
          }

          .help-categories {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .help-overlay,
          .help-panel,
          .help-article-content,
          .help-search-results {
            animation: none;
          }
        }
      `}</style>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return null;
};

export const HelpButton: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  return (
    <button
      className={`help-trigger-btn ${className}`}
      onClick={onClick}
      aria-label="打开帮助"
      title="帮助 (H)"
    >
      <span className="help-trigger-icon">❓</span>
      <span className="help-trigger-text">帮助</span>
      <style>{`
        .help-trigger-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-surface, #071525);
          border: 1px solid var(--border-default, rgba(26, 239, 251, 0.12));
          border-radius: var(--radius-md, 8px);
          color: var(--text-secondary, rgba(214, 248, 255, 0.65));
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .help-trigger-btn:hover {
          background: rgba(26, 239, 251, 0.08);
          border-color: var(--accent, #1AEFFB);
          color: var(--accent, #1AEFFB);
          box-shadow: 0 0 15px rgba(26, 239, 251, 0.2);
        }

        .help-trigger-icon {
          font-size: 1rem;
        }

        .help-trigger-text {
          font-weight: 500;
        }
      `}</style>
    </button>
  );
};

export default HelpPanel;
