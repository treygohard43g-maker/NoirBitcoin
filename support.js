import { auth } from "./firebase.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const db = getFirestore(auth.app);
const storage = getStorage(auth.app);


// ========================================
// ELEMENTS
// ========================================

const chatInput =
    document.getElementById("chatInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const chatMessages =
    document.getElementById("chatMessages");

const photoBtn =
    document.getElementById("photoBtn");

const photoInput =
    document.getElementById("photoInput");

const photoPreview =
    document.getElementById("photoPreview");

const photoPreviewImage =
    document.getElementById("photoPreviewImage");

const removePhotoBtn =
    document.getElementById("removePhotoBtn");

const supportImageViewer =
    document.getElementById("supportImageViewer");

const supportFullImage =
    document.getElementById("supportFullImage");

const closeSupportImage =
    document.getElementById("closeSupportImage");


let currentUser = null;
let selectedPhoto = null;
let unsubscribeMessages = null;


// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    currentUser = user;

    loadMessages();

});


// ========================================
// LOAD MESSAGES
// ========================================

function loadMessages() {

    if (!currentUser) return;

    if (unsubscribeMessages) {
        unsubscribeMessages();
    }


    const messagesQuery = query(
        collection(db, "supportMessages"),
        where(
            "userId",
            "==",
            currentUser.uid
        )
    );


    unsubscribeMessages = onSnapshot(
        messagesQuery,

        (snapshot) => {

            chatMessages.innerHTML = "";

            const messages = [];


            snapshot.forEach((doc) => {

                messages.push(doc.data());

            });


            // Sort locally by timestamp

            messages.sort((a, b) => {

                const timeA =
                    a.timestamp?.toMillis?.() || 0;

                const timeB =
                    b.timestamp?.toMillis?.() || 0;

                return timeA - timeB;

            });


            if (messages.length === 0) {

                addSupportMessage(
                    "Hello! How can we help you today?"
                );

            } else {

                messages.forEach((message) => {

                    if (
                        message.sender === "support"
                    ) {

                        if (message.imageUrl) {

                            addSupportPhoto(
                                message.imageUrl
                            );

                        } else {

                            addSupportMessage(
                                message.message || ""
                            );

                        }

                    } else {

                        if (message.imageUrl) {

                            addUserPhoto(
                                message.imageUrl
                            );

                        } else {

                            addUserMessage(
                                message.message || ""
                            );

                        }

                    }

                });

            }


            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        },

        (error) => {

            console.error(
                "Support chat error:",
                error
            );

        }

    );

}


// ========================================
// SEND MESSAGE / PHOTO
// ========================================

async function sendMessage() {

    const text =
        chatInput.value.trim();


    if (!text && !selectedPhoto) {
        return;
    }


    if (!currentUser) {

        alert(
            "Please wait for your account to load."
        );

        return;
    }


    sendMessageBtn.disabled = true;


    try {

        // ==================================
        // PHOTO MESSAGE
        // ==================================

        if (selectedPhoto) {

            const file =
                selectedPhoto;


            const safeFileName =
                file.name.replace(
                    /[^a-zA-Z0-9._-]/g,
                    "_"
                );


            const fileName =
                `${Date.now()}_${safeFileName}`;


            const storageRef =
                ref(
                    storage,
                    `supportPhotos/${currentUser.uid}/${fileName}`
                );


            // Upload the selected photo once

            await uploadBytes(
                storageRef,
                file,
                {
                    contentType:
                        file.type
                }
            );


            // Get the uploaded photo URL

            const photoURL =
                await getDownloadURL(
                    storageRef
                );


            // Save message in Firestore

            await addDoc(
                collection(
                    db,
                    "supportMessages"
                ),
                {

                    userId:
                        currentUser.uid,

                    userName:
                        currentUser.displayName ||
                        "Customer",

                    userEmail:
                        currentUser.email ||
                        "",

                    sender:
                        "user",

                    message:
                        text,

                    imageUrl:
                        photoURL,

                    timestamp:
                        serverTimestamp()

                }
            );


            // Clear everything only
            // after successful Firestore save

            clearPhotoPreview();

            chatInput.value = "";

        }


        // ==================================
        // TEXT MESSAGE
        // ==================================

        else {

            await addDoc(
                collection(
                    db,
                    "supportMessages"
                ),
                {

                    userId:
                        currentUser.uid,

                    userName:
                        currentUser.displayName ||
                        "Customer",

                    userEmail:
                        currentUser.email ||
                        "",

                    sender:
                        "user",

                    message:
                        text,

                    timestamp:
                        serverTimestamp()

                }
            );


            chatInput.value = "";

        }


    } catch (error) {

        console.error(
            "SEND MESSAGE ERROR:",
            error
        );


        console.error(
            "Firebase error code:",
            error.code
        );


        console.error(
            "Firebase error message:",
            error.message
        );


        alert(
            "Unable to send. Please try again."
        );


    } finally {

        sendMessageBtn.disabled = false;

    }

}


// ========================================
// SUPPORT TEXT MESSAGE
// ========================================

function addSupportMessage(text) {

    const row =
        document.createElement("div");

    row.className =
        "message-row support-message";


    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.innerHTML =
        '<i class="fa-solid fa-headset"></i>';


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("span");

    name.className =
        "message-name";

    name.textContent =
        "NoirBitcoin Support";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        text;


    content.appendChild(name);
    content.appendChild(bubble);

    row.appendChild(avatar);
    row.appendChild(content);

    chatMessages.appendChild(row);

}


// ========================================
// USER TEXT MESSAGE
// ========================================

function addUserMessage(text) {

    const row =
        document.createElement("div");

    row.className =
        "message-row user-message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        text;


    content.appendChild(bubble);

    row.appendChild(content);

    chatMessages.appendChild(row);

}


// ========================================
// SUPPORT PHOTO
// ========================================

function addSupportPhoto(imageUrl) {

    const row =
        document.createElement("div");

    row.className =
        "message-row support-message";


    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.innerHTML =
        '<i class="fa-solid fa-headset"></i>';


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const name =
        document.createElement("span");

    name.className =
        "message-name";

    name.textContent =
        "NoirBitcoin Support";


    const image =
        createChatImage(
            imageUrl,
            "Support photo"
        );


    content.appendChild(name);
    content.appendChild(image);

    row.appendChild(avatar);
    row.appendChild(content);

    chatMessages.appendChild(row);

}


// ========================================
// USER PHOTO
// ========================================

function addUserPhoto(imageUrl) {

    const row =
        document.createElement("div");

    row.className =
        "message-row user-message";


    const content =
        document.createElement("div");

    content.className =
        "message-content";


    const image =
        createChatImage(
            imageUrl,
            "Photo"
        );


    content.appendChild(image);

    row.appendChild(content);

    chatMessages.appendChild(row);

}


// ========================================
// CREATE CHAT IMAGE
// ========================================

function createChatImage(
    imageUrl,
    altText
) {

    const image =
        document.createElement("img");


    image.className =
        "support-chat-image";


    image.src =
        imageUrl;


    image.alt =
        altText;


    image.loading =
        "lazy";


    image.addEventListener(
        "click",
        () => {

            openSupportImage(
                imageUrl
            );

        }
    );


    return image;

}


// ========================================
// PHOTO BUTTON
// ========================================

if (photoBtn && photoInput) {

    photoBtn.addEventListener(
        "click",
        () => {

            photoInput.click();

        }
    );


    photoInput.addEventListener(
        "change",
        () => {

            const file =
                photoInput.files?.[0];


            if (!file) {
                return;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "Please select an image."
                );

                photoInput.value = "";

                return;

            }


            selectedPhoto =
                file;


            const imageURL =
                URL.createObjectURL(file);


            photoPreviewImage.src =
                imageURL;


            photoPreview.style.display =
                "flex";

        }
    );

}


// ========================================
// REMOVE PHOTO
// ========================================

if (removePhotoBtn) {

    removePhotoBtn.addEventListener(
        "click",
        clearPhotoPreview
    );

}


// ========================================
// CLEAR PHOTO PREVIEW
// ========================================

function clearPhotoPreview() {

    if (
        photoPreviewImage &&
        photoPreviewImage.src
    ) {

        URL.revokeObjectURL(
            photoPreviewImage.src
        );

    }


    selectedPhoto = null;


    if (photoInput) {
        photoInput.value = "";
    }


    if (photoPreviewImage) {
        photoPreviewImage.src = "";
    }


    if (photoPreview) {

        photoPreview.style.display =
            "none";

    }

}


// ========================================
// SEND BUTTON
// ========================================

if (sendMessageBtn) {

    sendMessageBtn.addEventListener(
        "click",
        sendMessage
    );

}


// ========================================
// ENTER TO SEND
// ========================================

if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// ========================================
// FULL IMAGE VIEWER
// ========================================

function openSupportImage(imageUrl) {

    if (
        !supportImageViewer ||
        !supportFullImage
    ) {
        return;
    }


    supportFullImage.src =
        imageUrl;


    supportImageViewer.classList.add(
        "active"
    );

}


function closeSupportImageViewer() {

    if (
        !supportImageViewer ||
        !supportFullImage
    ) {
        return;
    }


    supportImageViewer.classList.remove(
        "active"
    );


    supportFullImage.src = "";

}


if (closeSupportImage) {

    closeSupportImage.addEventListener(
        "click",
        closeSupportImageViewer
    );

}


if (supportImageViewer) {

    supportImageViewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                supportImageViewer
            ) {

                closeSupportImageViewer();

            }

        }
    );

}