// src/pages/admin/ManageBooks.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, get, update, remove, push } from "firebase/database";
import { db } from "../../firebase";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";
import { uploadToCloudinary } from "../../services/cloudinary";
import { FiEdit, FiTrash2, FiPlus, FiX, FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function ManageBooks() {
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const FIXED_CATEGORIES = ["تاريخ وسياسة", "فلسفة وعلم نفس", "ادب", "شعر ومسرح"];

    const [newBook, setNewBook] = useState({
        title: "", author: "", transl: "", type: "عربي",
        category: "", price: "", HPaper: "", description: "", status: "available",
    });

    // التحقق من صلاحية الإدارة
    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin") || sessionStorage.getItem("isAdmin");
        if (!isAdmin) navigate("/admin/login");
    }, [navigate]);

    // جلب الكتب
    useEffect(() => {
        fetchBooksData();
    }, []);

    const fetchBooksData = async () => {
        setLoading(true);
        try {
            const snap = await get(ref(db, "books"));
            if (snap.exists()) {
                const data = Object.entries(snap.val()).map(([id, value]) => ({ id, ...value }));
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

    // البحث
    useEffect(() => {
        const term = search.toLowerCase();
        setFiltered(books.filter(b =>
            b.title?.toLowerCase().includes(term) ||
            b.author?.toLowerCase().includes(term)
        ));
    }, [search, books]);

    // تغيير حالة الكتاب (متاح ↔ تم البيع)
    const toggleStatus = async (bookId, currentStatus) => {
        const newStatus = currentStatus === "sold" ? "available" : "sold";

        try {
            await update(ref(db, `books/${bookId}`), { status: newStatus });

            setBooks(prev => prev.map(book =>
                book.id === bookId ? { ...book, status: newStatus } : book
            ));
            setFiltered(prev => prev.map(book =>
                book.id === bookId ? { ...book, status: newStatus } : book
            ));

            toast.success(
                newStatus === "sold"
                    ? "تم تحويل الكتاب إلى «تم البيع»"
                    : "تم تحويل الكتاب إلى «متاح»"
            );
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("فشل تغيير الحالة");
        }
    };

    // باقي الدوال (إضافة، تعديل، حذف، رفع صور...)
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const handleRemoveImage = (index) => {
        if (editingBook) {
            const newImages = [...editingBook.images];
            newImages.splice(index, 1);
            setEditingBook({ ...editingBook, images: newImages });
        } else {
            const newFiles = [...imageFiles];
            newFiles.splice(index, 1);
            setImageFiles(newFiles);
            const newPreviews = [...imagePreviews];
            newPreviews.splice(index, 1);
            setImagePreviews(newPreviews);
        }
    };

    const handleAddBook = async (e) => {
        e.preventDefault();
        if (!newBook.title || !newBook.author || !newBook.price || (imageFiles.length === 0 && !editingBook)) {
            toast.error("املأ جميع الحقول المطلوبة واختر صورة واحدة على الأقل");
            return;
        }

        setUploading(true);
        try {
            let imageUrls = editingBook ? [...(editingBook.images || [])] : [];
            if (imageFiles.length > 0) {
                const newUrls = await uploadToCloudinary(imageFiles);
                imageUrls = [...imageUrls, ...newUrls];
            }

            const bookData = {
                ...newBook,
                price: Number(newBook.price),
                images: imageUrls,
                createdAt: editingBook ? editingBook.createdAt : Date.now(),
            };

            const bookRef = editingBook
                ? ref(db, `books/${editingBook.id}`)
                : push(ref(db, "books"));

            await update(bookRef, bookData);

            toast.success(editingBook ? "تم تعديل الكتاب بنجاح!" : "تم إضافة الكتاب بنجاح!");
            resetForm();
            setShowAddForm(false);
            setEditingBook(null);
            fetchBooksData();
        } catch (error) {
            console.error("Error:", error);
            toast.error("فشل العملية");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setNewBook({
            title: "", author: "", transl: "", type: "عربي",
            category: "", price: "", HPaper: "", description: "", status: "available",
        });
        setImageFiles([]);
        setImagePreviews([]);
    };

    const startEditing = (book) => {
        setNewBook({
            title: book.title || "", author: book.author || "", transl: book.transl || "",
            type: book.type || "عربي", category: book.category || "", price: book.price || "",
            HPaper: book.HPaper || "", description: book.description || "", status: book.status || "available",
        });
        setEditingBook(book);
        setImageFiles([]);
        setImagePreviews([]);
        setShowAddForm(true);
    };

    const handleDelete = async (book) => {
        if (!window.confirm(`هل أنت متأكد من حذف "${book.title}"؟`)) return;
        try {
            await remove(ref(db, `books/${book.id}`));
            toast.success("تم الحذف بنجاح");
            fetchBooksData();
        } catch {
            toast.error("فشل الحذف");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("isAdmin");
        sessionStorage.removeItem("isAdmin");
        navigate("/admin/login");
        toast.success("تم تسجيل الخروج");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <Toaster position="top-center" />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">لوحة تحكم المكتبة</h1>
                    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition">
                        تسجيل الخروج
                    </button>
                </div>

                <button
                    onClick={() => { setShowAddForm(true); setEditingBook(null); resetForm(); }}
                    className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
                >
                    <FiPlus size={20} /> إضافة كتاب جديد
                </button>

                {/* نموذج الإضافة / التعديل */}
                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white p-8 rounded-xl shadow-lg mb-8"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                {editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}
                            </h2>
                            {/* ... باقي النموذج زي ما هو ... */}
                            {/* (مش هأكرره هنا عشان الطول، لكن كله شغال زي ما كان) */}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* شريط البحث */}
                <input
                    type="text"
                    placeholder="ابحث بالعنوان أو المؤلف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md mb-8 px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />

                {/* قائمة الكتب */}
                {loading ? (
                    <div className="text-center py-10">
                        <ClipLoader size={50} color="#3B82F6" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-gray-600 text-xl">لا توجد كتب</p>
                ) : (
                    <div className="space-y-6">
                        {filtered.map((book) => (
                            <motion.div
                                key={book.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white p-6 rounded-xl shadow-md border border-gray-200"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{book.title}</h3>
                                        <p className="text-sm text-gray-600">الكود: {book.id}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* زر تغيير الحالة */}
                                        <button
                                            onClick={() => toggleStatus(book.id, book.status)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                                book.status === "sold"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            {book.status === "sold" ? (
                                                <>تم البيع <FiCheckCircle size={18} /></>
                                            ) : (
                                                <>متاح <FiXCircle size={18} /></>
                                            )}
                                        </button>

                                        {/* تعديل */}
                                        <button onClick={() => startEditing(book)} className="text-blue-600 hover:text-blue-800 transition" title="تعديل">
                                            <FiEdit size={24} />
                                        </button>

                                        {/* حذف */}
                                        <button onClick={() => handleDelete(book)} className="text-red-600 hover:text-red-800 transition" title="حذف">
                                            <FiTrash2 size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <p><strong>المؤلف:</strong> {book.author}</p>
                                    <p><strong>التصنيف:</strong> {book.category}</p>
                                    <p><strong>السعر:</strong> {book.price} ج.م</p>
                                    <p><strong>الحالة:</strong> <span className={book.status === "sold" ? "text-red-600" : "text-green-600"}>{book.status === "sold" ? "تم البيع" : "متاح"}</span></p>
                                    <p><strong>عدد الصفحات:</strong> {book.HPaper || "غير محدد"}</p>
                                    <p><strong>التاريخ:</strong> {new Date(book.createdAt).toLocaleDateString("ar-EG")}</p>
                                </div>

                                {book.description && (
                                    <p className="mt-3 text-gray-700 border-t pt-3"><strong>الوصف:</strong> {book.description}</p>
                                )}

                                <div className="flex flex-wrap gap-3 mt-4">
                                    {book.images?.map((url, i) => (
                                        <img key={i} src={url} alt={`صورة ${i + 1}`} className="w-20 h-28 object-cover rounded border" />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}