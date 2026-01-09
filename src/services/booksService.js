// src/services/booksService.js
import { ref, get, child } from "firebase/database";
import { db } from "../firebase.js";

export async function fetchBooks() {
    try {
        const snapshot = await get(child(ref(db), "books"));
        if (snapshot.exists()) {
            const booksArray = Object.entries(snapshot.val()).map(([id, book]) => ({
                id,
                ...book,
                images: Array.isArray(book.images)
                    ? book.images
                    : book.images
                    ? Object.values(book.images)
                    : [],
                order: book.order || 3, // 👈 قيمة افتراضية 3 إذا لم تكن موجودة
            }));

            // 👈 الترتيب حسب: order (تنازلي)، ثم حالة (متاح أولاً)، ثم التاريخ
            return booksArray.sort((a, b) => {
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
        }
        return [];
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}

export async function fetchBookById(id) {
    const bookId = String(id)?.trim();
    if (!bookId || ["undefined", "null", "NaN"].includes(bookId)) {
        return null;
    }

    try {
        const snapshot = await get(child(ref(db), `books/${bookId}`));
        if (!snapshot.exists()) return null;

        const data = snapshot.val();
        const images = data.images
            ? Array.isArray(data.images)
                ? data.images
                : typeof data.images === "object"
                ? Object.values(data.images)
                : [data.images]
            : [];

        return { 
            id: bookId, 
            ...data, 
            images,
            order: data.order || 3 // 👈 إضافة order هنا أيضًا
        };
    } catch (error) {
        console.error("Error fetching book:", error);
        return null;
    }
}