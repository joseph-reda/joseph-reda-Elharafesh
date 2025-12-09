// src/pages/Category.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BookCard from "../components/BookCard";
import { ClipLoader } from "react-spinners";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "../firebase";

export default function Category() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    

    const FIXED_CATEGORIES = [
        "تاريخ وسياسة",
        "فلسفة وعلم نفس",
        "ادب",
        "شعر ومسرح"
    ];

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                setLoading(true);
                let booksRef = ref(db, "books");

                // إذا كان في تصنيف محدد
                if (name && name !== "all" && FIXED_CATEGORIES.includes(name)) {
                    booksRef = query(booksRef, orderByChild("category"), equalTo(name));
                }

                const snapshot = await get(booksRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const booksList = Object.entries(data).map(([id, value]) => ({
                        id,
                        ...value,
                    }));

                    // ترتيب حسب الأحدث
                    booksList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setBooks(booksList);
                } else {
                    setBooks([]);
                }
            } catch (error) {
                console.error("Error fetching books:", error);
                setBooks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, [name]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <ClipLoader size={70} color="#4F46E5" />
            </div>
        );
    }

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto" dir="rtl">
            {/* العنوان */}
            <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent"
            >
                {name && name !== "all" ? `تصنيف: ${name}` : "جميع الكتب"}
            </motion.h1>

            {/* أزرار التصنيفات الثابتة */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/category")}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                        !name || name === "all"
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    جميع الكتب
                </motion.button>

                {FIXED_CATEGORIES.map((cat) => (
                    <motion.button
                        key={cat}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/category/${cat}`)}
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                            name === cat
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        {cat}
                    </motion.button>
                ))}
            </div>

            {/* الكتب */}
            {books.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                >
                    <p className="text-3xl text-gray-500 font-medium">
                        لا توجد كتب في هذا التصنيف حاليًا
                    </p>
                    <p className="text-lg text-gray-400 mt-4">
                        تابعنا.. قريبًا جديد
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    {books.map((book) => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </motion.div>
            )}
        </div>
    );
}