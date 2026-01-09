// src/components/ScrollManager.jsx
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
    const location = useLocation();
    const prevPathRef = useRef("");

    useEffect(() => {
        const currentPath = location.pathname;
        const prevPath = prevPathRef.current;
        prevPathRef.current = currentPath;

        // صفحات نريد التمرير للأعلى فيها دائمًا
        const scrollToTopPaths = [
            "/",
            "/admin/login",
            "/admin/manage-books",
            "/cart",
            "/contact",
            "/search"
        ];

        // التحقق إذا كنا في صفحة فئة
        const isCategoryPage = currentPath.startsWith("/category");
        const wasCategoryPage = prevPath.startsWith("/category");

        // إذا كنا ننتقل من صفحة فئة إلى صفحة فئة أخرى (تغيير التصنيف)
        const isCategoryToCategory = isCategoryPage && wasCategoryPage && currentPath !== prevPath;

        if (scrollToTopPaths.includes(currentPath)) {
            // تمرير سلس للأعلى
            window.scrollTo({ top: 0, behavior: "smooth" });
            sessionStorage.removeItem(`scrollPos_${prevPath}`); // تنظيف القديم
        } else if (isCategoryPage) {
            if (isCategoryToCategory) {
                // عند تغيير التصنيف، نعود للأعلى
                window.scrollTo({ top: 0, behavior: "smooth" });
                sessionStorage.removeItem(`scrollPos_${prevPath}`);
            } else {
                // استرجاع موضع التمرير المحفوظ
                const savedScroll = sessionStorage.getItem(`scrollPos_${currentPath}`);
                if (savedScroll) {
                    // تأخير مناسب لضمان تحميل المحتوى
                    setTimeout(() => {
                        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "auto" });
                    }, 150); // زيادة التأخير قليلاً
                }
            }
        } else if (wasCategoryPage && !isCategoryPage) {
            // إذا كنا نغادر صفحة فئة لصفحة أخرى، نحفظ التمرير
            sessionStorage.setItem(`scrollPos_${prevPath}`, window.scrollY.toString());
        }
    }, [location]);

    // تأثير منفصل لحفظ التمرير قبل مغادرة الصفحة
    useEffect(() => {
        const handleBeforeUnload = () => {
            const currentPath = location.pathname;
            if (currentPath.startsWith("/category")) {
                sessionStorage.setItem(`scrollPos_${currentPath}`, window.scrollY.toString());
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [location]);

    return null;
}