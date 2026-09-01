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
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const db = getFirestore(auth.app);


// ========================================
// CLOUDINARY
// ========================================

const CLOUDINARY_CLOUD_NAME = "ca44wizk";

const CLOUDINARY_UPLOAD_PRESET =
    "noirbitcoin_support";


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


let selectedPhoto = null;

let currentUser = null;

let unsubscribeMessages = null;


// ========================================
// AUTH
// ========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href =
            "login.html";

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


    const messagesQuery =
        query(
            collection(
                db,
                "supportMessages"
            ),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );


    unsubscribeMessages =
        onSnapshot(

            messagesQuery,

            (snapshot) => {

                chatMessages.innerHTML = "";

                const messages = [];


                snapshot.forEach(
                    (messageDoc) => {

                        messages.push(
                            messageDoc.data()
                        );

                    }
                );


                // Sort oldest → newest

                messages.sort(
                    (a, b) => {

                        const timeA =
                            a.timestamp
                                ?.toMillis?.() || 0;

                        const timeB =
                            b.timestamp
                                ?.toMillis?.() || 0;

                        return timeA - timeB;

                    }
                );


                if (
                    messages.length === 0
                ) {

                    addSupportMessage(
                        "Hello! How can we help you today?"
                    );

                } else {

                    messages.forEach(
                        (message) => {

                            if (
                                message.sender ===
                                "support"
                            ) {

                                if (
                                    message.imageUrl
                                ) {

                                    addSupportPhoto(
                                        message.imageUrl
                                    );

                                } else {

                                    addSupportMessage(
                                        message.message ||
                                        ""
                                    );

                                }

                            } else {

                                if (
                                    message.imageUrl
                                ) {

                                    addUserPhoto(
                                        message.imageUrl
                                    );

                                } else {

                                    addUserMessage(
                                        message.message ||
                                        ""
                                    );

                                }

                            }

                        }
                    );

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
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text =
        chatInput.value.trim();


    if (
        !text &&
        !selectedPhoto
    ) {

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
        // PHOTO
        // ==================================

        if (selectedPhoto) {

            console.log(
                "Starting Cloudinary upload..."
            );


            // Safety limit matching
            // your current Cloudinary plan

            if (
                selectedPhoto.size >
                10 * 1024 * 1024
            ) {

                alert(
                    "This photo is larger than 10 MB. Please choose a smaller photo."
                );

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "file",
                selectedPhoto
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            console.log(
                "Uploading photo to Cloudinary..."
            );


            const response =
                await fetch(

                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

                    {
                        method: "POST",

                        body: formData

                    }

                );


            const result =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Cloudinary error:",
                    result
                );

                throw new Error(
                    result.error?.message ||
                    "Cloudinary upload failed."
                );

            }


            const photoURL =
                result.secure_url;


            console.log(
                "Cloudinary upload successful:",
                photoURL
            );


            // ==================================
            // SAVE MESSAGE TO FIRESTORE
            // ==================================

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


            console.log(
                "Photo message saved to Firestore."
            );


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


        alert(
            "Unable to send. Please try again."
        );


    } finally {

        sendMessageBtn.disabled =
            false;

    }

}


// ========================================
// SUPPORT MESSAGE
// ========================================

function addSupportMessage(text) {

    const messageRow =
        document.createElement("div");

    messageRow.className =
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

    messageRow.appendChild(avatar);

    messageRow.appendChild(content);

    chatMessages.appendChild(messageRow);

}


// ========================================
// USER MESSAGE
// ========================================

function addUserMessage(text) {

    const messageRow =
        document.createElement("div");

    messageRow.className =
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

    messageRow.appendChild(content);

    chatMessages.appendChild(messageRow);

}


// ========================================
// SUPPORT PHOTO
// ========================================

function addSupportPhoto(imageUrl) {

    const messageRow =
        document.createElement("div");

    messageRow.className =
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

    messageRow.appendChild(avatar);

    messageRow.appendChild(content);

    chatMessages.appendChild(messageRow);

}


// ========================================
// USER PHOTO
// ========================================

function addUserPhoto(imageUrl) {

    const messageRow =
        document.createElement("div");

    messageRow.className =
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

    messageRow.appendChild(content);

    chatMessages.appendChild(messageRow);

}


// ========================================
// CHAT IMAGE
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

if (
    photoBtn &&
    photoInput
) {

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
                photoInput.files[0];


            if (!file) return;


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


            if (
                file.size >
                10 * 1024 * 1024
            ) {

                alert(
                    "This photo is larger than 10 MB."
                );

                photoInput.value = "";

                return;

            }


            selectedPhoto = file;


            const imageURL =
                URL.createObjectURL(
                    file
                );


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

    selectedPhoto = null;


    photoInput.value = "";


    photoPreviewImage.src = "";


    photoPreview.style.display =
        "none";

}


// ========================================
// TEXT SEND EVENTS
// ========================================

sendMessageBtn.addEventListener(
    "click",
    sendMessage
);


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


// ========================================
// FULL IMAGE VIEWER
// ========================================

function openSupportImage(
    imageUrl
) {

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