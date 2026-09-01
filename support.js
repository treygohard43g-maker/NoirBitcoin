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

let selectedPhoto = null;

const supportImageViewer =
    document.getElementById("supportImageViewer");

const supportFullImage =
    document.getElementById("supportFullImage");

const closeSupportImage =
    document.getElementById("closeSupportImage");


let currentUser = null;
let unsubscribeMessages = null;


// ========================================
// AUTH
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


            snapshot.forEach((messageDoc) => {

                const message =
                    messageDoc.data();

                messages.push(message);

            });


            // Sort locally so no Firestore index is required

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

                    // SUPPORT MESSAGE

                    if (message.sender === "support") {

                        if (message.imageUrl) {

                            addSupportPhoto(
                                message.imageUrl
                            );

                        } else {

                            addSupportMessage(
                                message.message || ""
                            );

                        }

                    }

                    // USER MESSAGE

                    else {

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
// SEND MESSAGE
// ========================================

async function sendMessage() {

    const text =
        chatInput.value.trim();

    // Nothing to send
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
        // SEND PHOTO
        // ==================================

        if (selectedPhoto) {

    alert("Photo send started");

    console.log(
        "PHOTO SEND STARTED",
        selectedPhoto
    );
            const fileName =
                `${Date.now()}_${selectedPhoto.name}`;

            const storageRef =
                ref(
                    storage,
                    `supportPhotos/${currentUser.uid}/${fileName}`
                );

            console.log(
                "Uploading photo..."
            );

            await uploadBytes(
                storageRef,
                selectedPhoto
            );

            console.log(
                "Photo uploaded successfully."
            );

            const photoURL =
                await getDownloadURL(storageRef);

            console.log(
                "Photo URL:",
                photoURL
            );

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
                "Photo message saved successfully."
            );

            clearPhotoPreview();

            chatInput.value = "";

        }

        // ==================================
        // SEND TEXT
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
            "ERROR CODE:",
            error.code
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        alert(
            "Unable to send. Check the browser console for the exact error."
        );

    } finally {

        sendMessageBtn.disabled = false;

    }

}

// ========================================
// DISPLAY SUPPORT MESSAGE
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
// DISPLAY USER MESSAGE
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
// DISPLAY SUPPORT PHOTO
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
// DISPLAY USER PHOTO
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
// EVENTS
// ========================================

sendMessageBtn.addEventListener(
    "click",
    sendMessage
);


chatInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


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
                photoInput.files[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {

                alert(
                    "Please select an image."
                );

                photoInput.value = "";

                return;
            }

            selectedPhoto = file;

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
// REMOVE SELECTED PHOTO
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
// IMAGE VIEWER
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