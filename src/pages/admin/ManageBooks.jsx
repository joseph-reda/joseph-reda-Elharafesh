// src/pages/admin/ManageBooks.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update, remove, push } from "firebase/database";
import { db } from "../../firebase";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { uploadToCloudinary } from "../../services/cloudinary";
import { FiEdit, FiTrash2, FiPlus, FiX, FiSearch, FiCheck, FiXCircle } from "react-icons/fi";

export default function ManageBooks() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const FIXED_CATEGORIES = ["تاريخ وسياسة", "فلسفة وعلم نفس", "ادب", "شعر ومسرح"];

    const [formData, setFormData] = useState({
        title: "", author: "", transl: "", type: "عربي",
        category: FIXED_CATEGORIES[0], price: "", HPaper: "", description: "", status: "available",
    });

    // التحقق من صلاحية الإدارة
    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin") === "true" || sessionStorage.getItem("isAdmin") === "true";
        if (!isAdmin) navigate("/admin/login");
    }, [navigate]);

    // جلب الكتب مرة واحدة فقط
    const fetchBooksData = async () => {
        setLoading(true);
        try {
            const snap = await get(ref(db, "books"));
            if (snap.exists()) {
                const data = Object.entries(snap.val()).map(([id, value]) => ({
                    id,
                    ...value,
                    createdAt: value.createdAt || Date.now(),
                }));
                const sorted = data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setBooks(sorted);
                setFiltered(sorted);
            } else {
                setBooks([]);
                setFiltered([]);
            }
        } catch (err) {
            toast.error("فشل تحميل الكتب");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooksData();
    }, []);

    // البحث
    // البحث - الحل الآمن 100%
    useEffect(() => {
        if (!search.trim()) {
            setFiltered(books);
            return;
        }
        const term = search.toLowerCase();
        setFiltered(books.filter(b => {
            const title = b.title ? b.title.toLowerCase() : "";
            const author = b.author ? b.author.toLowerCase() : "";
            const id = b.id ? String(b.id) : ""; // ← الحل السحري: نحوّل id إلى string دائمًا

            return title.includes(term) || author.includes(term) || id.includes(term);
        }));
    }, [search, books]);

    // تحديث محلي (بدون reload)
    const updateBookLocally = (updatedBook) => {
        setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
        setFiltered(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    };

    const addBookLocally = (newBook) => {
        setBooks(prev => [newBook, ...prev]);
        setFiltered(prev => [newBook, ...prev]);
    };

    const deleteBookLocally = (bookId) => {
        setBooks(prev => prev.filter(b => b.id !== bookId));
        setFiltered(prev => prev.filter(b => b.id !== bookId));
    };

    // فتح/إغلاق المودال
    const openModal = (book = null) => {
        if (book) {
            setEditingBook(book);
            setFormData({
                title: book.title || "",
                author: book.author || "",
                transl: book.transl || "",
                type: book.type || "عربي",
                category: book.category || FIXED_CATEGORIES[0],
                price: book.price || "",
                HPaper: book.HPaper || "",
                description: book.description || "",
                status: book.status || "available",
            });
            setImagePreviews(book.images || []);
        } else {
            setEditingBook(null);
            setFormData({
                title: "", author: "", transl: "", type: "عربي",
                category: FIXED_CATEGORIES[0], price: "", HPaper: "", description: "", status: "available",
            });
            setImagePreviews([]);
        }
        setImageFiles([]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setImageFiles([]);
        setImagePreviews([]);
        setEditingBook(null);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(files);
        const previews = files.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...previews]);
    };

    const removeImage = (index) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (editingBook) {
            const newImages = [...editingBook.images];
            newImages.splice(index, 1);
            setEditingBook({ ...editingBook, images: newImages });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.author || !formData.price) {
            toast.error("العنوان والمؤلف والسعر مطلوبة");
            return;
        }

        setUploading(true);
        try {
            let imageUrls = editingBook ? [...(editingBook.images || [])] : [];

            if (imageFiles.length > 0) {
                const uploaded = await uploadToCloudinary(imageFiles);
                imageUrls = [...imageUrls, ...uploaded];
            }

            const bookData = {
                ...formData,
                price: Number(formData.price),
                images: imageUrls,
                createdAt: editingBook ? editingBook.createdAt : Date.now(),
                updatedAt: Date.now(),
            };

            if (editingBook) {
                await update(ref(db, `books/${editingBook.id}`), bookData);
                toast.success("تم التعديل بنجاح");
                updateBookLocally({ ...editingBook, ...bookData });
            } else {
                const newRef = await push(ref(db, "books"), bookData);
                const newBook = { ...bookData, id: newRef.key };
                toast.success("تم الإضافة بنجاح");
                addBookLocally(newBook);
            }
            closeModal();
        } catch (err) {
            console.error(err);
            toast.error("حدث خطأ");
        } finally {
            setUploading(false);
        }
    };

   const handleDelete = async (book) => {
    if (!window.confirm(`حذف "${book.title}" نهائيًا؟`)) return;

    try {
        // 1. احذف من Firebase أولاً
        await remove(ref(db, `books/${book.id}`));

        // 2. لو نجح الحذف، احذف محليًا
        deleteBookLocally(book.id);

        toast.success("تم حذف الكتاب بنجاح");
    } catch (err) {
        console.error("خطأ في الحذف:", err);
        toast.error("فشل حذف الكتاب، حاول مرة أخرى");
    }
};
    const toggleStatus = async (book) => {
        const newStatus = book.status === "sold" ? "available" : "sold";
        try {
            await update(ref(db, `books/${book.id}`), { status: newStatus });
            toast.success(newStatus === "sold" ? "تم البيع" : "أصبح متاحًا");
            updateBookLocally({ ...book, status: newStatus });
        } catch {
            toast.error("فشل التغيير");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <ClipLoader size={80} color="#4F46E5" />
            </div>
        );
    }

    return (
        <>
            <Toaster position="top-center" />
            <div className="min-h-screen bg-gray-50 py-12 px-6" dir="rtl">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl font-bold text-center text-indigo-700 mb-12">لوحة تحكم الكتب</h1>

                    {/* شريط البحث + زر الإضافة */}
                    <div className="flex flex-col md:flex-row gap-6 mb-12">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                            <input
                                type="text"
                                placeholder="ابحث بالعنوان أو المؤلف أو الكود..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-300 focus:border-indigo-500 focus:outline-none text-lg shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition"
                        >
                            <FiPlus size={28} /> إضافة كتاب جديد
                        </button>
                    </div>

                    {/* قائمة الكتب - تصميم مريح وبسيط */}
                    <div className="space-y-8">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20 text-gray-500 text-2xl">لا توجد كتب متطابقة</div>
                        ) : (
                            filtered.map((book) => (
                                <motion.div
                                    key={book.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-3xl shadow-md p-8 border border-gray-200 hover:shadow-xl transition"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h3>
                                            <p className="text-lg text-gray-600 mb-4">المؤلف: {book.author}</p>
                                            <div className="grid grid-cols-2 gap-4 text-gray-700">
                                                <p><strong>التصنيف:</strong> {book.category}</p>
                                                <p><strong>السعر:</strong> {book.price} ج.م</p>
                                                <p><strong>الكود:</strong> {book.id}</p>
                                                <p><strong>الحالة:</strong> {book.status === "sold" ? "تم البيع" : "متاح"}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            {/* زر الحالة - كبير وواضح جدًا */}
                                            <button
                                                onClick={() => toggleStatus(book)}
                                                className={`w-full py-4 px-8 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all ${book.status === "sold"
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-green-500 hover:bg-green-600 text-white"
                                                    }`}
                                            >
                                                {book.status === "sold" ? (
                                                    <>
                                                        <FiXCircle size={28} /> تم البيع
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCheck size={28} /> متاح للبيع
                                                    </>
                                                )}
                                            </button>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => openModal(book)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                                >
                                                    <FiEdit size={22} /> تعديل
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(book)}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                                                >
                                                    <FiTrash2 size={22} /> حذف
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* الصور */}
                                    {book.images && book.images.length > 0 && (
                                        <div className="flex flex-wrap gap-4 mt-8">
                                            {book.images.map((url, i) => (
                                                <img key={i} src={url} alt={`صورة ${i + 1}`} className="w-32 h-44 object-cover rounded-xl shadow-md" />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Modal - تصميم مريح وبسيط */}
                <AnimatePresence>
                    {showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                            onClick={closeModal}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto p-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-3xl font-bold text-indigo-700">
                                        {editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}
                                    </h2>
                                    <button onClick={closeModal} className="text-gray-500 hover:text-red-600 transition">
                                        <FiX size={36} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <input type="text" placeholder="العنوان *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg" />
                                        <input type="text" placeholder="المؤلف *" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} required className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg" />
                                        <input type="text" placeholder="المترجم (اختياري)" value={formData.transl} onChange={(e) => setFormData({ ...formData, transl: e.target.value })} className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg" />
                                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg">
                                            <option>عربي</option>
                                            <option>مترجم</option>
                                        </select>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg">
                                            {FIXED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <input type="number" placeholder="السعر (ج.م) *" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg" />
                                        <input type="text" placeholder="حالة الورق (مثال: ممتازة)" value={formData.HPaper} onChange={(e) => setFormData({ ...formData, HPaper: e.target.value })} className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg" />
                                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg">
                                            <option value="available">متاح</option>
                                            <option value="sold">تم البيع</option>
                                        </select>
                                    </div>

                                    <textarea
                                        placeholder="وصف الكتاب (اختياري)"
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none text-lg"
                                    />

                                    <div className="space-y-6">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="block w-full text-lg text-gray-700 file:mr-6 file:py-4 file:px-8 file:rounded-2xl file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                                        />
                                        {imagePreviews.length > 0 && (
                                            <div className="grid grid-cols-3 md:grid-cols-5 gap-6">
                                                {imagePreviews.map((src, i) => (
                                                    <div key={i} className="relative group">
                                                        <img src={src} alt="" className="w-full h-48 object-cover rounded-2xl shadow-lg" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(i)}
                                                            className="absolute top-3 right-3 bg-red-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            <FiX size={20} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-6 pt-6">
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-bold text-xl transition flex items-center justify-center gap-3"
                                        >
                                            {uploading ? "جاري الرفع..." : editingBook ? "حفظ التعديلات" : "إضافة الكتاب"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-5 rounded-2xl font-bold text-xl transition"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}