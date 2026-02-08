import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "vi" | "en";

interface Translations {
  [key: string]: {
    vi: string;
    en: string;
  };
}

const translations: Translations = {
  // Navigation
  "nav.home": { vi: "Trang chủ", en: "Home" },
  "nav.project": { vi: "Phân tích dự án", en: "Project Analysis" },
  "nav.docs": { vi: "Tài liệu", en: "Documentation" },
  "nav.community": { vi: "Cộng đồng", en: "Community" },
  "nav.admin": { vi: "Quản trị", en: "Admin" },
  "nav.profile": { vi: "Hồ sơ", en: "Profile" },
  "nav.login": { vi: "Đăng nhập", en: "Login" },
  "nav.logout": { vi: "Đăng xuất", en: "Logout" },

  // Community
  "community.title": { vi: "Cộng đồng", en: "Community" },
  "community.posts": { vi: "Bài viết", en: "Posts" },
  "community.news": { vi: "Tin tức", en: "News" },
  "community.events": { vi: "Sự kiện", en: "Events" },
  "community.blogs": { vi: "Blog", en: "Blog" },
  "community.moderate": { vi: "Duyệt bài", en: "Moderate" },
  "community.newPost": { vi: "Đăng bài", en: "New Post" },

  // News
  "news.latest": { vi: "Tin tức mới nhất", en: "Latest News" },
  "news.latestEvents": { vi: "Sự kiện mới nhất", en: "Latest Events" },
  "news.latestBlogs": { vi: "Blog mới nhất", en: "Latest Blogs" },
  "news.refresh": { vi: "Cập nhật", en: "Refresh" },
  "news.readMore": { vi: "Đọc tiếp", en: "Read more" },
  "news.noArticles": { vi: "Chưa có tin tức", en: "No articles yet" },
  "news.noArticlesDesc": { vi: "Nhấn nút bên dưới để tải tin tức mới nhất", en: "Click the button below to fetch latest news" },
  "news.loadNews": { vi: "Tải tin tức", en: "Load News" },
  "news.noResults": { vi: "Không tìm thấy kết quả", en: "No results found" },
  "news.tryDifferent": { vi: "Thử thay đổi từ khóa hoặc bộ lọc", en: "Try different keywords or filters" },
  "news.clearFilters": { vi: "Xóa bộ lọc", en: "Clear filters" },
  "news.showing": { vi: "Đang hiển thị", en: "Showing" },
  "news.results": { vi: "kết quả", en: "results" },
  "news.for": { vi: "cho", en: "for" },
  "news.from": { vi: "từ", en: "from" },
  "news.in": { vi: "trong", en: "in" },
  "news.today": { vi: "hôm nay", en: "today" },
  "news.thisWeek": { vi: "tuần này", en: "this week" },
  "news.thisMonth": { vi: "tháng này", en: "this month" },
  "news.page": { vi: "Trang", en: "Page" },
  "news.articles": { vi: "bài viết", en: "articles" },
  "news.prev": { vi: "Trước", en: "Previous" },
  "news.next": { vi: "Sau", en: "Next" },
  "news.updated": { vi: "Đã cập nhật", en: "Updated" },
  "news.newArticles": { vi: "bài viết mới", en: "new articles" },
  "news.updateFailed": { vi: "Không thể cập nhật tin tức", en: "Failed to update news" },
  "news.searchPlaceholder": { vi: "Tìm kiếm theo từ khóa...", en: "Search by keywords..." },
  "news.allSources": { vi: "Tất cả nguồn", en: "All sources" },
  "news.allTime": { vi: "Mọi lúc", en: "All time" },

  // News Detail
  "news.backToList": { vi: "Quay lại danh sách", en: "Back to list" },
  "news.share": { vi: "Chia sẻ", en: "Share" },
  "news.viewOriginal": { vi: "Xem gốc", en: "View original" },
  "news.minRead": { vi: "phút đọc", en: "min read" },
  "news.noContent": { vi: "Nội dung đầy đủ không có sẵn. Vui lòng xem bài viết gốc.", en: "Full content not available. Please view the original article." },
  "news.readFullArticle": { vi: "Đọc bài viết đầy đủ tại", en: "Read full article at" },
  "news.relatedArticles": { vi: "Bài viết liên quan", en: "Related Articles" },
  "news.noRelatedArticles": { vi: "Không có bài viết liên quan", en: "No related articles" },
  "news.notFound": { vi: "Không tìm thấy bài viết", en: "Article not found" },
  "news.notFoundDesc": { vi: "Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.", en: "The article you're looking for doesn't exist or has been removed." },
  "news.loadError": { vi: "Không thể tải bài viết", en: "Failed to load article" },
  "news.linkCopied": { vi: "Đã sao chép liên kết!", en: "Link copied!" },

  // Filters
  "filter.search": { vi: "Tìm kiếm", en: "Search" },
  "filter.source": { vi: "Nguồn", en: "Source" },
  "filter.time": { vi: "Thời gian", en: "Time" },

  // General
  "general.loading": { vi: "Đang tải...", en: "Loading..." },
  "general.error": { vi: "Đã xảy ra lỗi", en: "An error occurred" },
  "general.success": { vi: "Thành công", en: "Success" },
  "general.cancel": { vi: "Hủy", en: "Cancel" },
  "general.save": { vi: "Lưu", en: "Save" },
  "general.delete": { vi: "Xóa", en: "Delete" },
  "general.edit": { vi: "Chỉnh sửa", en: "Edit" },
  "general.submit": { vi: "Gửi", en: "Submit" },

  // Language Switcher
  "language.vietnamese": { vi: "Tiếng Việt", en: "Vietnamese" },
  "language.english": { vi: "Tiếng Anh", en: "English" },
  "language.switch": { vi: "Ngôn ngữ", en: "Language" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("preferred-language");
    return (saved as Language) || "vi";
  });

  useEffect(() => {
    localStorage.setItem("preferred-language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
