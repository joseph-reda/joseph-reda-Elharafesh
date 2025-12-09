// src/services/booksService.js
import { ref, get, child } from "firebase/database";
import { db } from "../firebase.js";

// جلب كل الكتب (للـ Home و Category و Search)
export async function fetchBooks() {
    try {
        const snapshot = await get(child(ref(db), "books"));
        if (snapshot.exists()) {
            return Object.entries(snapshot.val()).map(([id, book]) => {
                // ضمان إن images دايمًا مصفوفة (حتى لو null أو object أو undefined)
                const images = Array.isArray(book.images)
                    ? book.images
                    : book.images
                    ? Object.values(book.images)
                    : [];

                return {
                    id,
                    ...book,
                    images, // مصفوفة مضمونة
                };
            });
        }
        return [];
    } catch (error) {
        console.error("Error fetching all books:", error);
        throw error;
    }
}

// جلب كتاب واحد بالـ ID (للـ BookDetails) - مع الحماية الكاملة
export async function fetchBookById(id) {
    if (!id || typeof id !== "string") {
        console.warn("Invalid book ID:", id);
        return null;
    }

    try {
        const snapshot = await get(child(ref(db), `books/${id}`));
        if (snapshot.exists()) {
            const data = snapshot.val();

            // الحل السحري: تحويل images إلى array مهما كان شكلها
            const images = Array.isArray(data.images)
                ? data.images
                : data.images && typeof data.images === "object"
                ? Object.values(data.images)
                : [];

            return {
                id,
                ...data,
                images, // دايمًا array (حتى لو فاضية)
            };
        } else {
            console.log(`Book with ID ${id} not found in database`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching book by ID:", id, error);
        throw error;
    }
}