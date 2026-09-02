import { auth } from "./firebase.js";

import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(auth.app);

const ADMIN_UID = "5jLniALGV6NvdsLSK43wON8upVj1";

const customerList = document.getElementById("customerList");
const customerCount = document.getElementById("customerCount");
const adminMessages = document.getElementById("adminMessages");
const conversationHeader =
    document.getElementById("conversationHeader");

const adminReplyInput =
    document.getElementById("adminReplyInput");

const adminSendBtn =
    document.getElementById("adminSendBtn");

const adminLogoutBtn =
    document.getElementById("adminLogoutBtn");

let selectedUserId = null;
let unsubscribeConversation = null;


// ========================================
// AUTHENTICATION
// ========================================

auth.onAuthStateChanged((user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    if (user.uid !== ADMIN_UID) {

        alert("Access denied.");

        window.location.href = "dashboard.html";

        return;
    }

    loadCustomers();
});


// ========================================
// LOAD CUSTOMERS
// ========================================

function loadCustomers() {

    const messagesQuery = query(
        collection(db, "supportMessages"),
        orderBy("timestamp", "desc")
    );

    onSnapshot(
        messagesQuery,
        (snapshot) => {

            const customers = new Map();

            snapshot.forEach((messageDoc) => {

                const message =
                    messageDoc.data();

                if (!message.userId) return;

                if (!customers.has(message.userId)) {

                    customers.set(
    message.userId,
    {
        userId:
            message.userId,

        userName:
            message.userName || "",

        userEmail:
            message.userEmail || "",

        lastMessage:
            message.message || "",

        imageUrl:
            message.imageUrl || "",

        sender:
            message.sender || "user",

        timestamp:
            message.timestamp
    }
);

 }

});

            renderCustomers(
                Array.from(customers.values())
            );
        },
        (error) => {

            console.error(
                "Unable to load customers:",
                error
            );

            customerList.innerHTML = `
                <div class="empty-customers">
                    Unable to load conversations.
                </div>
            `;
        }
    );
}


// ========================================
// RENDER CUSTOMER LIST
// ========================================

function renderCustomers(customers) {

    customerCount.textContent =
        customers.length;

    if (customers.length === 0) {

        customerList.innerHTML = `
            <div class="empty-customers">

                <i class="fa-regular fa-comments"></i>

                <p>
                    No support conversations yet.
                </p>

            </div>
        `;

        return;
    }

    customerList.innerHTML = "";

    customers.forEach((customer) => {

        const item =
            document.createElement("button");

        item.className =
            "customer-item";

        item.type = "button";


        // Highlight currently selected customer

        if (
            selectedUserId ===
            customer.userId
        ) {

            item.classList.add(
                "active"
            );

        }


        const customerName =
            customer.userName ||
            "Customer";

        const customerEmail =
            customer.userEmail ||
            "No email available";


        // Show "Photo" instead of an empty
        // preview when the latest message
        // contains an image.

        const preview =
            customer.imageUrl
                ? "📷 Photo"
                : (
                    customer.lastMessage ||
                    "No message"
                );


        const messageTime =
            formatMessageTime(
                customer.timestamp
            );


        // Customer's latest message is
        // considered unread when it was
        // sent by the customer.

        const isUnread =
            customer.sender === "user";


        if (isUnread) {

            item.classList.add(
                "unread"
            );

        }


        item.innerHTML = `

            <div class="customer-avatar">
                <i class="fa-solid fa-user"></i>
            </div>

            <div class="customer-info">

                <div class="customer-top-row">

                    <strong>
                        ${escapeHTML(customerName)}
                    </strong>

                    <small class="customer-time">
                        ${messageTime}
                    </small>

                </div>

                <small class="customer-email">
                    ${escapeHTML(customerEmail)}
                </small>

                <span class="customer-preview">
                    ${escapeHTML(preview)}
                </span>

            </div>

            ${
                isUnread
                    ? `
                        <span
                            class="unread-dot"
                            aria-label="Unread message">
                        </span>
                      `
                    : ""
            }

        `;


        item.addEventListener(
            "click",
            () => {

                selectCustomer(
                    customer.userId,
                    customerName,
                    customerEmail
                );

            }
        );


        customerList.appendChild(item);

    });

}

// ========================================
// SELECT CUSTOMER
// ========================================

function selectCustomer(
    userId,
    customerName,
    customerEmail
) {

    selectedUserId = userId;

    conversationHeader.innerHTML = `

    <div>

        <h2>
            ${escapeHTML(customerName)}
        </h2>

        <span>
            ${escapeHTML(customerEmail || "No email available")}
            · Live support conversation
        </span>

    </div>

`;

    adminReplyInput.disabled = false;
    adminSendBtn.disabled = false;


    if (unsubscribeConversation) {

        unsubscribeConversation();

    }


    const conversationQuery = query(

        collection(db, "supportMessages"),

        where(
            "userId",
            "==",
            userId
        )

    );


    unsubscribeConversation = onSnapshot(

        conversationQuery,

        (snapshot) => {

            adminMessages.innerHTML = "";

            const messages = [];


            snapshot.forEach((messageDoc) => {

                const message =
                    messageDoc.data();

                messages.push(message);

            });


            // Sort messages locally by timestamp

            messages.sort((a, b) => {

                const timeA =
                    a.timestamp?.toMillis?.() || 0;

                const timeB =
                    b.timestamp?.toMillis?.() || 0;

                return timeA - timeB;

            });


            messages.forEach((message) => {

    if (message.imageUrl) {

        addAdminPhoto(
            message.imageUrl,
            message.sender === "support"
        );

    } else {

        addAdminMessage(

            message.message || "",

            message.sender === "support"

        );

    }

});

            adminMessages.scrollTop =
                adminMessages.scrollHeight;

        },

        (error) => {

            console.error(
                "Conversation error:",
                error
            );

        }

    );

}


// ========================================
// DISPLAY MESSAGE
// ========================================
function addAdminMessage(text, isSupport) {

    const row =
        document.createElement("div");

    row.className =
        isSupport
            ? "admin-message-row support"
            : "admin-message-row customer";

    const bubble =
        document.createElement("div");

    bubble.className =
        "admin-message-bubble";

    bubble.textContent =
        text;

    row.appendChild(bubble);

    adminMessages.appendChild(row);
}

// ========================================
// DISPLAY ADMIN PHOTO
// ========================================

function addAdminPhoto(
    imageUrl,
    isSupport
) {

    const row =
        document.createElement("div");

    row.className =
        isSupport
            ? "admin-message-row support"
            : "admin-message-row customer";


    const image =
        document.createElement("img");

    image.className =
        "admin-chat-image";

    image.src =
        imageUrl;

    image.alt =
        "Support photo";

    image.loading =
        "lazy";


    image.addEventListener(
        "click",
        () => {

            openAdminImage(
                imageUrl
            );

        }
    );


    row.appendChild(image);

    adminMessages.appendChild(row);

}

// ========================================
// SEND ADMIN REPLY
// ========================================

async function sendAdminReply() {

    const text =
        adminReplyInput.value.trim();

    if (!text || !selectedUserId) return;

    adminSendBtn.disabled = true;

    try {

        await addDoc(
            collection(db, "supportMessages"),
            {
                userId: selectedUserId,
                sender: "support",
                message: text,
                timestamp: serverTimestamp()
            }
        );

        adminReplyInput.value = "";

    } catch (error) {

        console.error(
            "Unable to send reply:",
            error
        );

        alert(
            "Unable to send reply."
        );

    } finally {

        adminSendBtn.disabled = false;
    }
}


// ========================================
// EVENTS
// ========================================

adminSendBtn.addEventListener(
    "click",
    sendAdminReply
);


adminReplyInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendAdminReply();
        }

    }
);


// ========================================
// LOGOUT
// ========================================

adminLogoutBtn.addEventListener(
    "click",
    async () => {

        await auth.signOut();

        window.location.href =
            "login.html";
    }
);

// ========================================
// FORMAT MESSAGE TIME
// ========================================

function formatMessageTime(timestamp) {

    if (!timestamp) {
        return "";
    }

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}

// ========================================
// HTML ESCAPE
// ========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}