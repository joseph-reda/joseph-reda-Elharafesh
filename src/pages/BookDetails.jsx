// src/pages/BookDetails.jsx
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import BookImage from "../components/BookImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiShoppingCart, FiTrash2, FiMessageSquare, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { fetchBookById } from "../services/booksService";
import toast from "react-hot-toast";
import { ref, update } from "firebase/database"; // ← أضفنا update
import { db } from "../firebase";

export default function BookDetails() {
    const { id } = useParams();
    const bookId = String(id).trim();
    const { addToCart, removeFromCart, isInCart } = useCart();
    const queryClient = useQueryClient();

    // تحقق من صلاحية الإدارة
    const isAdmin = localStorage.getItem("isAdmin") === "true" ||
        sessionStorage.getItem("isAdmin") === "true";

    const { data: book, isLoading, error } = useQuery({
        queryKey: ["book", bookId],
        queryFn: () => fetchBookById(bookId),
        enabled: !!bookId && !["undefined", "null", "NaN"].includes(bookId),
        retry: 1,
    });

    // رابط واتساب احترافي
    const whatsappUrl = book
        ? `https://wa.me/201034345458?text=${encodeURIComponent(
            `مرحباً مكتبة الحرافيش\nأريد حجز الكتاب:\n\n📚 ${book.title}\n✍️ ${book.author}\n💰 ${book.price} ج.م\n🔗 ${window.location.href}`
        )}`
        : "";

    // تبديل الحالة (متاح / تم البيع) - للإدارة فقط
    const toggleStatus = async () => {
        if (!isAdmin) {
            toast.error("غير مسموح لك بتغيير الحالة");
            return;
        }

        if (!book) return;

        // استخدمنا window.confirm بدل confirm مباشرة عشان ESLint
        const confirmed = window.confirm(
            `هل تريد تغيير حالة الكتاب إلى "${book.status === "sold" ? "متاح" : "تم البيع"}"؟`
        );

        if (!confirmed) return;

        const newStatus = book.status === "sold" ? "available" : "sold";

        try {
            await update(ref(db, `books/${book.id}`), {
                status: newStatus,
                updatedAt: Date.now(),
            });

            toast.success(`تم تحديث الحالة إلى: ${newStatus === "sold" ? "تم البيع" : "متاح"}`);
            queryClient.invalidateQueries(["book", bookId]);
        } catch (err) {
            console.error(err);
            toast.error("فشل تحديث الحالة");
        }
    };

    // حماية من ID غير صالح
    if (!bookId || ["undefined", "null", "NaN"].includes(bookId)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-10 bg-white rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">رابط غير صالح</h1>
                    <p className="text-xl text-gray-600 mb-8">المعرف غير موجود أو تم حذفه</p>
                    <Link
                        to="/category"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
                    >
                        العودة للتسوق
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">Loading...</div>
                    <p className="text-xl text-gray-600">جاري تحميل تفاصيل الكتاب...</p>
                </div>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-10 bg-white rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">الكتاب غير موجود</h1>
                    <p className="text-xl text-gray-600 mb-8">ربما تم حذفه أو الرابط غير صحيح</p>
                    <Link
                        to="/category"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
                    >
                        تصفح الكتب
                    </Link>
                </div>
            </div>
        );
    }

    const inCart = isInCart(book.id);
    const isSold = book.status === "sold";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-4 py-8"
            dir="rtl"
        >
            <div className="grid md:grid-cols-2 gap-10">
                {/* الصور */}
                <div>
                    <BookImage
                        images={book.images}
                        alt={book.title}
                        className="rounded-2xl shadow-xl"
                        ratio="aspect-[3/4]"
                    />

                    {/* زر تبديل الحالة - للإدارة فقط */}
                    {isAdmin && (
                        <button
                            onClick={toggleStatus}
                            className={`mt-6 w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isSold
                                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                        >
                            {isSold ? <FiXCircle size={24} /> : <FiCheckCircle size={24} />}
                            {isSold ? "تم البيع - اضغط لإتاحته" : "متاح - اضغط لتعليم بيع"}
                        </button>
                    )}
                </div>

                {/* التفاصيل */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-3">
                            {book.title}
                        </h1>
                        <p className="text-2xl text-gray-600">✍️ {book.author || "غير معروف"}</p>
                        {book.transl && (
                            <p className="text-lg text-gray-500 mt-1">ترجمة: {book.transl}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-6 text-lg">
                        <span className="text-4xl font-extrabold text-indigo-600">
                            {book.price} ج.م
                        </span>
                        <span className={`px-5 py-2 rounded-full font-bold ${isSold ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                            }`}>
                            {isSold ? "تم البيع" : "متوفر"}
                        </span>
                    </div>

                    {book.HPaper && (
                        <p className="text-gray-600">
                            <strong>عدد الصفحات:</strong> {book.HPaper}
                        </p>
                    )}

                    {book.category && (
                        <p className="text-gray-600">
                            <strong>التصنيف:</strong> {book.category}
                        </p>
                    )}

                    {book.description && (
                        <div className="description bg-gray-50 p-6 rounded-xl text-gray-700 leading-relaxed">
                            <strong className="block mb-2 text-lg">وصف الكتاب:</strong>
                            {book.description}
                        </div>
                    )}

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
                                    <> <FiTrash2 size={22} /> إزالة من السلة</>
                                ) : (
                                    <> <FiShoppingCart size={22} /> أضف إلى السلة</>
                                )}
                            </button>
                        )}

                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 flex-1 bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition"
                        >
                            <FiMessageSquare size={22} /> حجز عبر واتساب
                        </a>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}