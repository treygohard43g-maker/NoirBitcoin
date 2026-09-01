import { auth } from "./firebase.js";

import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp
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
        userId: message.userId,

        userName:
            message.userName || "",

        userEmail:
            message.userEmail || "",

        lastMessage:
            message.message || "",

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


        const customerName =
            customer.userName ||
            "Customer";

        const customerEmail =
            customer.userEmail ||
            "No email available";


        item.innerHTML = `

            <div class="customer-avatar">
                <i class="fa-solid fa-user"></i>
            </div>

            <div class="customer-info">

                <strong>
                    ${escapeHTML(customerName)}
                </strong>

                <small>
                    ${escapeHTML(customerEmail)}
                </small>

                <span>
                    ${escapeHTML(customer.lastMessage)}
                </span>

            </div>

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

function selectCustomer(userId, customerName) {

    selectedUserId = userId;

    conversationHeader.innerHTML = `

        <div>

            <h2>
                ${customerName}
            </h2>

            <span>
                Live support conversation
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

                addAdminMessage(

                    message.message || "",

                    message.sender === "support"

                );

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

    bubble.textContent = text;

    row.appendChild(bubble);

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