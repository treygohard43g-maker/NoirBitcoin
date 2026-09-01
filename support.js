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

const storage =
    getStorage(auth.app);

let currentUser = null;

let unsubscribeMessages = null;


// ========================================
// WAIT FOR FIREBASE AUTH
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
// LOAD USER'S MESSAGES
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

                const message = messageDoc.data();

                messages.push(message);

            });


            // Sort messages by timestamp
            // without requiring a Firestore index.

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

    if (message.sender === "support") {

        if (message.imageUrl) {

            addSupportPhoto(
                message.imageUrl
            );

        } else {

            addSupportMessage(
                message.message
            );

        }

    } else {

        if (message.imageUrl) {

            addUserPhoto(
                message.imageUrl
            );

        } else {

            addUserMessage(
                message.message
            );

        }

    }

});


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


    if (!text) return;


    if (!currentUser) {

        alert(
            "Please wait for your account to load."
        );

        return;
    }


    sendMessageBtn.disabled = true;


    try {

        await addDoc(

    collection(
        db,
        "supportMessages"
    ),

    {

        userId:
            currentUser.uid,

        userName:
            currentUser.displayName || "Customer",

        userEmail:
            currentUser.email || "",

        sender:
            "user",

        message:
            text,

        timestamp:
            serverTimestamp()

    }

);


        chatInput.value = "";


    } catch (error) {

        console.error(
            "Unable to send support message:",
            error
        );


        alert(
            "Unable to send your message. Please try again."
        );

    } finally {

        sendMessageBtn.disabled = false;

    }

}

// ========================================
// SEND PHOTO
// ========================================

async function sendPhoto(file) {

    if (!file) return;

    if (!currentUser) {

        alert(
            "Please wait for your account to load."
        );

        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select an image.");

        return;
    }

    photoBtn.disabled = true;

    try {

        const fileName =
            `${Date.now()}_${file.name}`;

        const storageRef =
            ref(
                storage,
                `supportPhotos/${currentUser.uid}/${fileName}`
            );

        await uploadBytes(
            storageRef,
            file
        );

        const photoURL =
            await getDownloadURL(storageRef);

        await addDoc(
            collection(
                db,
                "supportMessages"
            ),
            {

                userId:
                    currentUser.uid,

                userName:
                    currentUser.displayName || "Customer",

                userEmail:
                    currentUser.email || "",

                sender:
                    "user",

                message:
                    "",

                imageUrl:
                    photoURL,

                timestamp:
                    serverTimestamp()

            }
        );

        photoInput.value = "";

    } catch (error) {

        console.error(
            "Photo upload error:",
            error
        );

        alert(
            "Unable to send photo. Please try again."
        );

    } finally {

        photoBtn.disabled = false;

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
        document.createElement("img");

    image.className =
        "support-chat-image";

    image.src =
        imageUrl;

    image.alt =
        "Support photo";

    image.loading =
        "lazy";

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
        document.createElement("img");

    image.className =
        "support-chat-image";

    image.src =
        imageUrl;

    image.alt =
        "Photo";

    image.loading =
        "lazy";

    content.appendChild(image);

    messageRow.appendChild(content);

    chatMessages.appendChild(messageRow);
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

        if (file) {

            sendPhoto(file);

        }

    }
);