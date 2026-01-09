// src/components/BookCard.jsx - النسخة المحسنة
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { FiShoppingCart, FiTrash2, FiImage } from "react-icons/fi";
import { useCart } from "../context/CartContext";
import { useState } from "react";

export default function BookCard({ book }) {
    const { addToCart, removeFromCart, isInCart } = useCart();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!book || !book.id) {
        console.warn("BookCard: كتاب بدون id", book);
        return null;
    }

    const inCart = isInCart(book.id);

    // تأكد من أن images هي array
    const images = Array.isArray(book.images) 
        ? book.images.filter(img => img && img.trim() !== "")
        : book.images 
            ? [book.images].filter(img => img && img.trim() !== "")
            : [];

    // الصورة الحالية
    const currentImage = images.length > 0 
        ? images[currentImageIndex] 
        : "/placeholder.jpg";

    // التالي والصورة السابقة
    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
        >
            {/* صورة الكتاب مع إمكانية التنقل */}
            <Link to={`/book/${book.id}`} className="block">
                <div className="relative overflow-hidden bg-gray-100 aspect-[3/4] group">
                    <LazyLoadImage
                        src={currentImage}
                        alt={book.title}
                        effect="blur"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        wrapperClassName="w-full h-full"
                    />
                    
                    {/* مؤشر الصور إذا كان هناك أكثر من صورة */}
                    {images.length > 1 && (
                        <>
                            {/* أزرار التنقل */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md hover:bg-white"
                            >
                                ◀
                            </button>
                            
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 text-gray-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md hover:bg-white"
                            >
                                ▶
                            </button>
                            
                            {/* مؤشر النقاط */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            idx === currentImageIndex 
                                                ? "bg-blue-600 scale-125" 
                                                : "bg-white/70"
                                        }`}
                                    />
                                ))}
                            </div>
                            
                            {/* شارة عدد الصور */}
                            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <FiImage size={10} />
                                <span>{images.length}</span>
                            </div>
                        </>
                    )}
                    
                    {book.status === "sold" && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <span className="text-white text-3xl font-bold drop-shadow-2xl">
                                تم البيع
                            </span>
                        </div>
                    )}
                </div>
            </Link>

            <div className="p-5">
                <Link to={`/book/${book.id}`} className="block">
                    <h3 className="font-bold text-lg text-gray-800 hover:text-blue-600 transition line-clamp-2 min-h-14">
                        {book.title}
                    </h3>
                </Link>

                <p className="text-gray-600 text-sm mt-1">{book.author || "غير معروف"}</p>

                <div className="flex items-center justify-between mt-5">
                    <span className="text-2xl font-bold text-indigo-600">
                        {book.price ? `${book.price} ج.م` : "غير محدد"}
                    </span>

                    {book.id && book.status !== "sold" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                inCart ? removeFromCart(book.id) : addToCart(book);
                            }}
                            className={`p-3.5 rounded-full transition-all duration-200 ${
                                inCart
                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                        >
                            {inCart ? <FiTrash2 size={23} /> : <FiShoppingCart size={23} />}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}   