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

  // Hero Section
  "hero.badge": { vi: "Mô phỏng Monte Carlo", en: "Monte Carlo Simulation" },
  "hero.subtitle": { vi: "Phân tích rủi ro", en: "Risk Analysis" },
  "hero.description": { vi: "Công cụ mô phỏng Monte Carlo giúp bạn dự báo kết quả, phân tích rủi ro và đưa ra quyết định chính xác với độ tin cậy cao.", en: "Monte Carlo simulation tool that helps you forecast outcomes, analyze risks, and make accurate decisions with high confidence." },
  "hero.feature1": { vi: "Dự báo chính xác", en: "Accurate Forecasting" },
  "hero.feature2": { vi: "Phân tích rủi ro", en: "Risk Analysis" },
  "hero.feature3": { vi: "Ra quyết định tự tin", en: "Confident Decisions" },

  // Index Page Tabs
  "tab.simulation": { vi: "Mô phỏng Monte Carlo", en: "Monte Carlo Simulation" },
  "tab.sensitivity": { vi: "Phân tích độ nhạy", en: "Sensitivity Analysis" },
  "simulation.title": { vi: "Mô phỏng Monte Carlo", en: "Monte Carlo Simulation" },
  "simulation.description": { vi: "Chọn loại phân phối phù hợp và chạy mô phỏng để xem phân phối xác suất của các kết quả có thể xảy ra.", en: "Choose the appropriate distribution and run a simulation to view the probability distribution of possible outcomes." },
  "sensitivity.title": { vi: "Phân tích độ nhạy", en: "Sensitivity Analysis" },
  "sensitivity.description": { vi: "Xác định các yếu tố ảnh hưởng nhiều nhất đến kết quả dự báo thông qua phân tích tương quan và biểu đồ Tornado.", en: "Identify the factors that most influence forecast results through correlation analysis and Tornado charts." },

  // Simulation Form
  "form.params": { vi: "Thông số mô phỏng", en: "Simulation Parameters" },
  "form.iterations": { vi: "Số lần mô phỏng", en: "Number of Iterations" },
  "form.run": { vi: "Chạy mô phỏng", en: "Run Simulation" },
  "form.running": { vi: "Đang chạy...", en: "Running..." },

  // Footer
  "footer.tagline": { vi: "Công cụ phân tích rủi ro và dự báo Monte Carlo", en: "Risk analysis and Monte Carlo forecasting tool" },
  "footer.projects": { vi: "Dự án khác", en: "Other Projects" },
  "footer.contact": { vi: "Liên hệ", en: "Contact" },

  // Chatbot
  "chatbot.welcome": { vi: "Xin chào! 👋 Tôi là Crystal Ball AI. Hỏi tôi về phân tích dự án đầu tư, Monte Carlo, hoặc bất cứ điều gì! ✨", en: "Hello! 👋 I'm Crystal Ball AI. Ask me about investment project analysis, Monte Carlo, or anything! ✨" },
  "chatbot.thinking": { vi: "Đang suy nghĩ...", en: "Thinking..." },
  "chatbot.placeholder": { vi: "Nhập câu hỏi...", en: "Type a question..." },
  "chatbot.error": { vi: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau! 🙏", en: "Sorry, an error occurred. Please try again later! 🙏" },
  "chatbot.fallback": { vi: "Xin lỗi, tôi không thể trả lời lúc này.", en: "Sorry, I can't answer right now." },

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

  // Stats
  "stats.min": { vi: "Giá trị nhỏ nhất", en: "Minimum" },
  "stats.max": { vi: "Giá trị lớn nhất", en: "Maximum" },
  "stats.mean": { vi: "Trung bình", en: "Mean" },
  "stats.stdDev": { vi: "Độ lệch chuẩn", en: "Std. Deviation" },
  "stats.median": { vi: "Trung vị (P50)", en: "Median (P50)" },
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
