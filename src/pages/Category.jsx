// src/pages/Category.jsx ← الكود النهائي الصحيح

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InfiniteBookGrid from "../components/InfiniteBookGrid";
import { ClipLoader } from "react-spinners";
import { fetchBooks } from "../services/booksService";

const FIXED_CATEGORIES = [
    "تاريخ وسياسة",
    "فلسفة وعلم نفس",
    "ادب",
    "شعر ومسرح"
];

export default function Category() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [filteredBooks, setFilteredBooks] = useState(null); // null = لسه ما اتحملش
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAndFilter = async () => {
            try {
                setLoading(true);
                const books = await fetchBooks(); // 👈 سيأتي الكتب مرتّبة من fetchBooks

                if (name && name !== "all" && FIXED_CATEGORIES.includes(name)) {
                    const filtered = books.filter(book => book.category === name);
                    setFilteredBooks(filtered);
                } else {
                    setFilteredBooks(books);
                }
            } catch (error) {
                console.error(error);
                setFilteredBooks([]);
            } finally {
                setLoading(false);
            }
        };

        loadAndFilter();
    }, [name]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <ClipLoader size={70} color="#4F46E5" />
            </div>
        );
    }

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto" dir="rtl">
            <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent"
            >
                {name && name !== "all" ? `تصنيف: ${name}` : "جميع الكتب"}
            </motion.h1>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/category")}
                    className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${!name || name === "all"
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
                        className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${name === cat
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        {cat}
                    </motion.button>
                ))}
            </div>

            {/* هنا المفتاح: نبعت الكتب المفلترة للـ Grid */}
            <InfiniteBookGrid filteredBooks={filteredBooks} />
        </div>
    );
}