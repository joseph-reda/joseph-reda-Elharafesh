// src/pages/BookDetails.jsx - النسخة المصححة
import { useParams, Link } from "react-router-dom";
import { useState } from "react"; // استيراد useState فقط من react
import { motion } from "framer-motion"; // استيراد motion بشكل منفصل
import { useCart } from "../context/CartContext";
import BookImage from "../components/BookImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiXCircle, FiEdit3 } from "react-icons/fi";
import { fetchBookById } from "../services/booksService";
import toast from "react-hot-toast";
import { ref, update } from "firebase/database";
import { db } from "../firebase";

export default function BookDetails() {
    const { id } = useParams();
    const bookId = String(id).trim();
    const { isInCart } = useCart();
    const queryClient = useQueryClient();
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [tempOrder, setTempOrder] = useState(3);

    // تحقق من صلاحية الإدارة
    const isAdmin = localStorage.getItem("isAdmin") === "true" ||
        sessionStorage.getItem("isAdmin") === "true";

    const { data: book, isLoading, error } = useQuery({
        queryKey: ["book", bookId],
        queryFn: () => fetchBookById(bookId),
        enabled: !!bookId && !["undefined", "null", "NaN"].includes(bookId),
        retry: 1,
    });

    // رابط واتساب
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

        const confirmed = window.confirm(
            `هل تريد تغيير حالة الكتاب إلى "${book.status === "sold" ? "متاح" : "تم البيع"}"؟`
        );

        if (!confirmed) return;

        const newStatus = book.status === "sold" ? "available" : "sold";

        try {
            await update(ref(db, `books/${book.id}`), {
                status: newStatus,
                updatedAt: Date.now(),
                order: newStatus === "sold" ? 0 : 3,
            });

            toast.success(`تم تحديث الحالة إلى: ${newStatus === "sold" ? "تم البيع" : "متاح"}`);
            queryClient.invalidateQueries(["book", bookId]);
        } catch (err) {
            console.error(err);
            toast.error("فشل تحديث الحالة");
        }
    };

    // دالة فتح مودال الترتيب
    const openOrderModal = () => {
        if (!isAdmin) {
            toast.error("غير مسموح لك بتعديل الترتيب");
            return;
        }
        if (book) {
            setTempOrder(book.order || 3);
            setShowOrderModal(true);
        }
    };

    // دالة حفظ الترتيب الجديد
    const saveOrder = async () => {
        if (!isAdmin || !book) return;

        const newOrder = parseInt(tempOrder, 10);
        if (newOrder < 0 || newOrder > 5) {
            toast.error("الترتيب يجب أن يكون بين 0 و 5");
            return;
        }

        try {
            await update(ref(db, `books/${book.id}`), {
                order: newOrder,
                updatedAt: Date.now(),
            });

            toast.success(`تم تحديث الترتيب إلى ${newOrder}`);
            queryClient.invalidateQueries(["book", bookId]);
            setShowOrderModal(false);
        } catch (err) {
            console.error(err);
            toast.error("فشل تحديث الترتيب");
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
                    <div className="text-6xl mb-4">📚</div>
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

    const isSold = book.status === "sold";

    return (
        <>
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

                        {/* أزرار الإدارة */}
                        {isAdmin && (
                            <div className="space-y-4 mt-6">
                                <button
                                    onClick={toggleStatus}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isSold
                                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                        }`}
                                >
                                    {isSold ? <FiXCircle size={24} /> : <FiCheckCircle size={24} />}
                                    {isSold ? "تم البيع - اضغط لإتاحته" : "متاح - اضغط لتعليم بيع"}
                                </button>

                                <button
                                    onClick={openOrderModal}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
                                >
                                    <FiEdit3 size={24} />
                                    تعديل الترتيب: {book.order || 3}
                                </button>
                            </div>
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

                        {/* زر واتساب */}
                        <div className="pt-8">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg transition w-full"
                            >
                                <span className="text-2xl">💬</span> حجز عبر واتساب
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* مودال تعديل الترتيب */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" dir="rtl">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                            تعديل ترتيب الكتاب
                        </h3>
                        
                        <div className="mb-8">
                            <p className="text-gray-600 mb-2">
                                <strong>الكتاب:</strong> {book.title}
                            </p>
                            <p className="text-gray-600 mb-6">
                                <strong>الترتيب الحالي:</strong> {book.order || 3}
                            </p>
                            
                            <div className="space-y-4">
                                <label className="block text-gray-700 font-semibold">
                                    اختر الترتيب الجديد (0-5):
                                </label>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    {[0, 1, 2, 3, 4, 5].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setTempOrder(num)}
                                            className={`py-3 rounded-lg font-bold transition ${
                                                tempOrder === num
                                                    ? num === 0
                                                        ? "bg-red-600 text-white"
                                                        : "bg-blue-600 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="mt-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        value={tempOrder}
                                        onChange={(e) => setTempOrder(parseInt(e.target.value, 10))}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                                        <span>0 (أدنى)</span>
                                        <span className="font-bold text-lg">{tempOrder}</span>
                                        <span>5 (أعلى)</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                    <p><strong>0:</strong> أدنى ترتيب (للكتب المباعة)</p>
                                    <p><strong>1-2:</strong> ترتيب منخفض</p>
                                    <p><strong>3:</strong> متوسط (افتراضي)</p>
                                    <p><strong>4-5:</strong> ترتيب عالي (يظهر أولاً)</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={saveOrder}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition"
                            >
                                حفظ التغييرات
                            </button>
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-bold transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}