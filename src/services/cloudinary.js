// src/services/cloudinary.js
const CLOUD_NAME = "dpulqwe4z";
const UPLOAD_PRESET = "book_store";

export async function uploadToCloudinary(files) {
    const urls = [];
    for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await res.json();
        if (data.secure_url) urls.push(data.secure_url);
    }
    return urls;
}