// src/components/InfiniteBookGrid.jsx ← النسخة النهائية المثالية مع الترتيب
import { useState, useEffect, useRef } from "react";
import BookCard from "./BookCard";
import { motion } from "framer-motion";
import { fetchBooks } from "../services/booksService";

const BOOKS_PER_LOAD = 16;

export default function InfiniteBookGrid({ filteredBooks = null }) {
    const [displayedBooks, setDisplayedBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [allSortedBooks, setAllSortedBooks] = useState([]);
    const lastBookRef = useRef();

    // لو جالك كتب مفلترة من بره (مثل من Category.jsx)، استخدمها
    // لو مفيش، جيب كل الكتب بنفسك
    useEffect(() => {
        let isMounted = true;

        const loadBooks = async () => {
            let books = [];

            if (filteredBooks) {
                // استخدم الكتب المفلترة اللي جت من Category.jsx
                books = filteredBooks;
            } else {
                // جيب كل الكتب من Firebase
                books = await fetchBooks();
            }

            // ترتيب ذكي: أولاً حسب order (تنازلي)، ثم المتاحة أولًا، ثم الأحدث
            const sorted = books.sort((a, b) => {
                // أولاً: حسب order (تنازلي - الأعلى أولاً)
                const orderDiff = (b.order || 3) - (a.order || 3);
                if (orderDiff !== 0) return orderDiff;
                
                // ثانيًا: المتاح أولاً
                if (a.status !== b.status) {
                    return a.status === "available" ? -1 : 1;
                }
                
                // ثالثًا: الأحدث أولاً
                return (b.createdAt || 0) - (a.createdAt || 0);
            });

            if (isMounted) {
                setAllSortedBooks(sorted);
                setDisplayedBooks(sorted.slice(0, BOOKS_PER_LOAD));
                setHasMore(sorted.length > BOOKS_PER_LOAD);
            }
        };

        loadBooks();

        return () => { isMounted = false; };
    }, [filteredBooks]);

    // Infinite Scroll
    useEffect(() => {
        if (loading || !hasMore || allSortedBooks.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading) {
                setLoading(true);
                setTimeout(() => {
                    const next = allSortedBooks.slice(0, displayedBooks.length + BOOKS_PER_LOAD);
                    setDisplayedBooks(next);
                    setHasMore(next.length < allSortedBooks.length);
                    setLoading(false);
                }, 600);
            }
        }, { threshold: 0.1 });

        if (lastBookRef.current) {
            observer.observe(lastBookRef.current);
        }

        return () => observer.disconnect();
    }, [displayedBooks, loading, hasMore, allSortedBooks]);

    if (allSortedBooks.length === 0) {
        return (
            <div className="text-center py-20 text-2xl text-gray-500">
                لا توجد كتب في هذا التصنيف حاليًا
            </div>
        );
    }

    return (
        <>
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {displayedBooks.map((book, index) => (
                    <motion.div
                        key={`${book.id}-${book.createdAt || index}`}
                        ref={index === displayedBooks.length - 1 ? lastBookRef : null}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative"
                    >
                        {book.status === "sold" && (
                            <div className="absolute inset-0 bg-black/60 rounded-2xl z-10 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold bg-red-600 px-6 py-3 rounded-full">
                                    تم البيع
                                </span>
                            </div>
                        )}
                        <BookCard book={book} />
                    </motion.div>
                ))}
            </motion.div>

            {loading && (
                <div className="col-span-full text-center py-12">
                    <span className="text-xl text-blue-600 animate-pulse">
                        جاري تحميل المزيد...
                    </span>
                </div>
            )}

            {!hasMore && (
                <div className="col-span-full text-center py-12 text-gray-500 text-lg">
                    تم عرض جميع الكتب في هذا التصنيف
                </div>
            )}
        </>
    );
}