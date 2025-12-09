// src/pages/BookDetails.jsx
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import BookImage from "../components/BookImage";
import { useQuery } from "@tanstack/react-query";
import { FiShoppingCart, FiTrash2, FiMessageSquare } from "react-icons/fi";
import { fetchBookById } from "../services/booksService"; // ← الخدمة الجديدة

export default function BookDetails() {
    const { id } = useParams();
    const { addToCart, removeFromCart, isInCart } = useCart();

    const {
        data: book,
        isLoading,
        error,
        isError,
    } = useQuery({
        queryKey: ["book", id],           // ← كاش لكل كتاب على حدة
        queryFn: () => fetchBookById(id),
        retry: 1,
        staleTime: 1000 * 60 * 10,        // 10 دقايق كاش
    });

    // تحويل الصور إلى مصفوفة (لأن Firebase بيخزنها أحيانًا كـ object)
    const imageArray = book
        ? Array.isArray(book.images)
            ? book.images
            : Object.values(book.images || {})
        : [];

    const isSold = book?.status === "sold";
    const inCart = book ? isInCart(book.id) : false;

    const whatsappUrl = book
        ? `https://wa.me/201034345458?text=${encodeURIComponent(
            `مرحبًا، أود حجز الكتاب التالي:\n\n` +
            `العنوان: ${book.title}\n` +
            `المؤلف: ${book.author || "غير محدد"}\n` +
            `السعر: ${book.price} ج.م\n` +
            `الكود: ${book.id}\n\n` +
            `شكرًا `
        )}`
        : "#";

    // حالات التحميل والأخطاء
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl text-gray-600">جاري تحميل تفاصيل الكتاب...</p>
            </div>
        );
    }

    if (isError || !book) {
        return (
            <div className="max-w-4xl mx-auto p-6 text-center py-20">
                <h2 className="text-2xl text-gray-700 mb-4">الكتاب غير موجود</h2>
                <p className="text-gray-500 mb-8">
                    قد يكون تم حذفه أو تغيير رابطه
                </p>
                <Link
                    to="/category"
                    className="inline-block px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
                >
                    العودة للتسوق
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto px-6 py-12 font-sans"
        >
            <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* قسم الصور */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-6"
                >
                    <div className="w-full max-w-sm mx-auto drop-shadow-lg rounded-xl overflow-hidden border border-gray-100">
                        <BookImage
                            images={imageArray}
                            alt={book.title}
                            ratio="aspect-[3/4]"
                            fit="contain"
                            className="rounded-xl"
                        />
                    </div>

                    {book.isNew && (
                        <span className="absolute top-5 right-5 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-md z-10">
                            جديد
                        </span>
                    )}

                    {isSold && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                            <span className="text-white text-4xl font-bold drop-shadow-2xl">
                                تم الحجز
                            </span>
                        </div>
                    )}
                </motion.div>

                {/* تفاصيل الكتاب */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="p-8 text-right flex flex-col justify-center space-y-6"
                >
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-blue-900 leading-snug">
                            {book.title}
                        </h1>
                        {book.author && (
                            <p className="text-gray-600 text-lg mt-2">
                                ✍️ <span className="font-medium">المؤلف:</span> {book.author}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        {book.price && (
                            <p className="text-green-700 text-2xl font-bold">
                                السعر: {book.price} ج.م
                            </p>
                        )}

                        {book.HPaper && (
                            <p className="text-gray-600">
                                عدد الصفحات: {book.HPaper}
                            </p>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                            <span
                                className={`inline-block px-5 py-2 rounded-full text-sm font-bold shadow-lg ${isSold
                                        ? "bg-gray-600 text-white"
                                        : "bg-green-600 text-white"
                                    }`}
                            >
                                {isSold ? "تم الحجز" : "متوفر"}
                            </span>
                        </div>
                    </div>

                    {book.description && (
                        <p className="text-gray-700 leading-relaxed text-base bg-gray-50 p-5 rounded-xl">
                            {book.description}
                        </p>
                    )}

                    {/* أزرار التفاعل */}
                    <div className="pt-8 flex flex-col sm:flex-row gap-4">
                        {!isSold && (
                            <button
                                onClick={() => (inCart ? removeFromCart(book.id) : addToCart(book))}
                                className={`flex items-center justify-center gap-3 flex-1 text-lg font-bold rounded-xl py-4 transition-all duration-300 shadow-lg ${inCart
                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                        : "bg-blue-700 text-white hover:bg-blue-800"
                                    }`}
                            >
                                {inCart ? (
                                    <>
                                        <FiTrash2 size={22} /> إزالة من السلة
                                    </>
                                ) : (
                                    <>
                                        <FiShoppingCart size={22} /> أضف إلى السلة
                                    </>
                                )}
                            </button>
                        )}

                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 flex-1 bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition"
                        >
                            <FiMessageSquare size={22} />
                            حجز عبر واتساب
                        </a>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}