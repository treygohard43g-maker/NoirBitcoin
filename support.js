import { auth } from "./firebase.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(auth.app);

const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const chatMessages = document.getElementById("chatMessages");

let currentUser = null;
let unsubscribeMessages = null;


// ========================================
// WAIT FOR FIREBASE AUTH
// ========================================

auth.onAuthStateChanged(async (user) => {

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
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "asc")
    );

    unsubscribeMessages = onSnapshot(
        messagesQuery,
        (snapshot) => {

            chatMessages.innerHTML = "";

            if (snapshot.empty) {

                addSupportMessage(
                    "Hello! How can we help you today?"
                );

                return;
            }

            snapshot.forEach((messageDoc) => {

                const message = messageDoc.data();

                if (message.sender === "support") {

                    addSupportMessage(
                        message.message
                    );

                } else {

                    addUserMessage(
                        message.message
                    );

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

    const text = chatInput.value.trim();

    if (!text || !currentUser) return;

    sendMessageBtn.disabled = true;

    try {

        await addDoc(
            collection(db, "supportMessages"),
            {
                userId: currentUser.uid,
                sender: "user",
                message: text,
                timestamp: serverTimestamp()
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