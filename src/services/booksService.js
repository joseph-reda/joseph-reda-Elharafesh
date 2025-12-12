// src/services/booksService.js
import { ref, get, child } from "firebase/database";
import { db } from "../firebase.js"; // تأكد من المسار صحيح

export async function fetchBooks() {
    try {
        const snapshot = await get(child(ref(db), "books"));
        if (snapshot.exists()) {
            return Object.entries(snapshot.val()).map(([id, book]) => ({
                id,
                ...book,
                images: Array.isArray(book.images)
                    ? book.images
                    : book.images
                    ? Object.values(book.images)
                    : [],
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching books:", error);
        return []; // مهم: لا ترجع throw
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

        return { id: bookId, ...data, images };
    } catch (error) {
        console.error("Error fetching book:", error);
        return null;
    }
}