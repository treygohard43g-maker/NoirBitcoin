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
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const db = getFirestore(auth.app);


const ADMIN_UID =
    "5jLniALGV6NvdsLSK43wON8upVj1";


// ========================================
// SUPPORT ELEMENTS
// ========================================

const customerList =
    document.getElementById("customerList");

const customerCount =
    document.getElementById("customerCount");

const adminMessages =
    document.getElementById("adminMessages");

const conversationHeader =
    document.getElementById("conversationHeader");

const adminReplyInput =
    document.getElementById("adminReplyInput");

const adminSendBtn =
    document.getElementById("adminSendBtn");

const adminLogoutBtn =
    document.getElementById("adminLogoutBtn");


// ========================================
// WITHDRAWAL VERIFICATION ELEMENTS
// ========================================

const withdrawalVerificationPanel =
    document.getElementById(
        "withdrawalVerificationPanel"
    );

const verificationAmount =
    document.getElementById(
        "verificationAmount"
    );

const verificationWallet =
    document.getElementById(
        "verificationWallet"
    );

const verificationTime =
    document.getElementById(
        "verificationTime"
    );

const verificationStatus =
    document.getElementById(
        "verificationStatus"
    );

const confirmPaymentBtn =
    document.getElementById(
        "confirmPaymentBtn"
    );

const rejectPaymentBtn =
    document.getElementById(
        "rejectPaymentBtn"
    );


// ========================================
// STATE
// ========================================

let selectedUserId =
    null;

let selectedWithdrawalId =
    null;

let unsubscribeConversation =
    null;

let unsubscribeWithdrawal =
    null;


// ========================================
// ADMIN AUTH
// ========================================

auth.onAuthStateChanged(
    (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        if (
            user.uid !==
            ADMIN_UID
        ) {

            alert(
                "Access denied."
            );

            window.location.href =
                "dashboard.html";

            return;
        }


        loadCustomers();

    }
);


// ========================================
// LOAD CUSTOMERS
//
// Customers can come from:
// 1. supportMessages
// 2. withdrawalVerifications
//
// This means a brand-new customer who
// submits a withdrawal verification will
// still appear in Admin Support.
// ========================================

function loadCustomers() {

    let supportCustomers =
        [];

    let withdrawalCustomers =
        [];


    // ====================================
    // SUPPORT MESSAGES LISTENER
    // ====================================

    const supportQuery =
        query(
            collection(
                db,
                "supportMessages"
            ),
            orderBy(
                "timestamp",
                "desc"
            )
        );


    onSnapshot(
        supportQuery,

        (snapshot) => {

            supportCustomers =
                [];


            snapshot.forEach(
                (messageDoc) => {

                    const message =
                        messageDoc.data();


                    if (
                        !message.userId
                    ) {
                        return;
                    }


                    supportCustomers.push(
                        message
                    );

                }
            );


            mergeCustomers();

        },

        (error) => {

            console.error(
                "Support customer error:",
                error
            );

        }
    );


    // ====================================
    // WITHDRAWAL VERIFICATION LISTENER
    // ====================================

    const withdrawalQuery =
        query(
            collection(
                db,
                "withdrawalVerifications"
            )
        );


    onSnapshot(
        withdrawalQuery,

        (snapshot) => {

            withdrawalCustomers =
                [];


            snapshot.forEach(
                (withdrawalDoc) => {

                    const withdrawal =
                        withdrawalDoc.data();


                    if (
                        !withdrawal.userId
                    ) {
                        return;
                    }


                    withdrawalCustomers.push(
                        {
                            id:
                                withdrawalDoc.id,

                            ...withdrawal
                        }
                    );

                }
            );


            mergeCustomers();

        },

        (error) => {

            console.error(
                "Withdrawal customer error:",
                error
            );

        }
    );


    // ====================================
    // MERGE CUSTOMER SOURCES
    // ====================================

    function mergeCustomers() {

        const customers =
            new Map();


        // --------------------------------
        // SUPPORT CUSTOMERS
        // --------------------------------

        supportCustomers.forEach(
            (message) => {

                if (
                    customers.has(
                        message.userId
                    )
                ) {
                    return;
                }


                customers.set(
                    message.userId,
                    {
                        userId:
                            message.userId,

                        userName:
                            message.userName ||
                            "Customer",

                        userEmail:
                            message.userEmail ||
                            "No email available",

                        lastMessage:
                            message.message ||
                            (
                                message.imageUrl
                                    ? "📷 Photo"
                                    : "No message"
                            ),

                        imageUrl:
                            message.imageUrl ||
                            "",

                        sender:
                            message.sender ||
                            "user",

                        timestamp:
                            message.timestamp
                    }
                );

            }
        );


        // --------------------------------
        // WITHDRAWAL CUSTOMERS
        // --------------------------------

        withdrawalCustomers.forEach(
            (withdrawal) => {

                const existingCustomer =
                    customers.get(
                        withdrawal.userId
                    );


                // Customer already exists
                // from support messages.
                if (
                    existingCustomer
                ) {

                    // If there is a pending
                    // withdrawal, show that
                    // as the preview.

                    if (
                        withdrawal.status ===
                        "pending"
                    ) {

                        existingCustomer.lastMessage =
                            "💳 Payment verification submitted";

                        existingCustomer.sender =
                            "user";

                        existingCustomer.timestamp =
                            withdrawal.createdAt;

                    }

                    return;
                }


                // Brand-new customer who
                // has no support message yet.

                customers.set(
                    withdrawal.userId,
                    {
                        userId:
                            withdrawal.userId,

                        userName:
                            withdrawal.userName ||
                            "Customer",

                        userEmail:
                            withdrawal.userEmail ||
                            "No email available",

                        lastMessage:
                            withdrawal.status ===
                            "pending"
                                ? "💳 Payment verification submitted"
                                : "Withdrawal verification",

                        imageUrl:
                            "",

                        sender:
                            "user",

                        timestamp:
                            withdrawal.createdAt
                    }
                );

            }
        );


        renderCustomers(
            Array.from(
                customers.values()
            )
        );

    }

}


// ========================================
// RENDER CUSTOMER LIST
// ========================================

function renderCustomers(
    customers
) {

    customerCount.textContent =
        customers.length;


    if (
        customers.length ===
        0
    ) {

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


    customerList.innerHTML =
        "";


    customers.forEach(
        (customer) => {

            const item =
                document.createElement(
                    "button"
                );


            item.className =
                "customer-item";


            item.type =
                "button";


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


            const preview =
                customer.lastMessage ||
                "No message";


            const messageTime =
                formatMessageTime(
                    customer.timestamp
                );


            const isUnread =
                customer.sender ===
                "user";


            item.innerHTML = `

                <div class="customer-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>


                <div class="customer-info">

                    <div class="customer-top-row">

                        <strong>
                            ${escapeHTML(
                                customerName
                            )}
                        </strong>

                        <small class="customer-time">
                            ${messageTime}
                        </small>

                    </div>


                    <small class="customer-email">

                        ${escapeHTML(
                            customerEmail
                        )}

                    </small>


                    <span class="customer-preview">

                        ${escapeHTML(
                            preview
                        )}

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


            customerList.appendChild(
                item
            );

        }
    );

}


// ========================================
// SELECT CUSTOMER
// ========================================

function selectCustomer(
    userId,
    customerName,
    customerEmail
) {

    selectedUserId =
        userId;


    conversationHeader.innerHTML = `

        <div>

            <h2>
                ${escapeHTML(
                    customerName
                )}
            </h2>

            <span>

                ${escapeHTML(
                    customerEmail ||
                    "No email available"
                )}

                · Live support conversation

            </span>

        </div>

    `;


    adminReplyInput.disabled =
        false;


    adminSendBtn.disabled =
        false;


    // ====================================
    // STOP PREVIOUS CONVERSATION LISTENER
    // ====================================

    if (
        unsubscribeConversation
    ) {

        unsubscribeConversation();

        unsubscribeConversation =
            null;

    }


    // ====================================
    // STOP PREVIOUS WITHDRAWAL LISTENER
    // ====================================

    if (
        unsubscribeWithdrawal
    ) {

        unsubscribeWithdrawal();

        unsubscribeWithdrawal =
            null;

    }


    // ====================================
    // CONVERSATION QUERY
    // ====================================

    const conversationQuery =
        query(

            collection(
                db,
                "supportMessages"
            ),

            where(
                "userId",
                "==",
                userId
            )

        );


    unsubscribeConversation =
        onSnapshot(

            conversationQuery,

            (snapshot) => {

                // Clear ONLY the chat area.
                adminMessages.innerHTML =
                    "";


                // Put verification card
                // back into the chat container.
                if (
                    withdrawalVerificationPanel
                ) {

                    adminMessages.appendChild(
                        withdrawalVerificationPanel
                    );


                    withdrawalVerificationPanel.style.display =
                        "none";

                }


                const messages =
                    [];


                snapshot.forEach(
                    (messageDoc) => {

                        const message =
                            messageDoc.data();


                        messages.push(
                            message
                        );

                    }
                );


                // Sort oldest → newest
                messages.sort(
                    (a, b) => {

                        const timeA =
                            a.timestamp
                                ?.toMillis?.() ||
                            0;

                        const timeB =
                            b.timestamp
                                ?.toMillis?.() ||
                            0;


                        return (
                            timeA -
                            timeB
                        );

                    }
                );


                // Render each message once.
                messages.forEach(
                    (message) => {

                        if (
                            message.imageUrl
                        ) {

                            addAdminPhoto(
                                message.imageUrl,

                                message.sender ===
                                    "support"
                            );

                        } else {

                            addAdminMessage(
                                message.message ||
                                    "",

                                message.sender ===
                                    "support"
                            );

                        }

                    }
                );


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


    // ====================================
    // LOAD VERIFICATION
    // ====================================

    loadWithdrawalVerification(
        userId
    );

}


// ========================================
// LOAD WITHDRAWAL VERIFICATION
// ========================================

function loadWithdrawalVerification(
    userId
) {

    if (
        unsubscribeWithdrawal
    ) {

        unsubscribeWithdrawal();

        unsubscribeWithdrawal =
            null;

    }


    selectedWithdrawalId =
        null;


    hideWithdrawalVerification();


    const withdrawalQuery =
        query(

            collection(
                db,
                "withdrawalVerifications"
            ),

            where(
                "userId",
                "==",
                userId
            )

        );


    unsubscribeWithdrawal =
        onSnapshot(

            withdrawalQuery,

            (snapshot) => {

                // --------------------------------
                // NO REQUESTS
                // --------------------------------

                if (
                    snapshot.empty
                ) {

                    hideWithdrawalVerification();

                    return;

                }


                const requests =
                    [];


                snapshot.forEach(
                    (withdrawalDoc) => {

                        requests.push({

                            id:
                                withdrawalDoc.id,

                            ...withdrawalDoc.data()

                        });

                    }
                );


                // --------------------------------
                // ONLY PENDING REQUESTS
                // --------------------------------

                const pendingRequests =
                    requests.filter(
                        (request) => {

                            return (
                                (
                                    request.status ||
                                    "pending"
                                ) ===
                                "pending"
                            );

                        }
                    );


                // --------------------------------
                // NO PENDING REQUEST
                // --------------------------------

                if (
                    pendingRequests.length ===
                    0
                ) {

                    hideWithdrawalVerification();

                    return;

                }


                // --------------------------------
                // NEWEST FIRST
                // --------------------------------

                pendingRequests.sort(
                    (a, b) => {

                        const timeA =
                            a.createdAt
                                ?.toMillis?.() ||
                            0;

                        const timeB =
                            b.createdAt
                                ?.toMillis?.() ||
                            0;


                        return (
                            timeB -
                            timeA
                        );

                    }
                );


                const request =
                    pendingRequests[0];


                if (!request) {

                    hideWithdrawalVerification();

                    return;

                }


                selectedWithdrawalId =
                    request.id;


                // --------------------------------
                // SHOW VERIFICATION CARD
                // --------------------------------

                if (
                    withdrawalVerificationPanel
                ) {

                    withdrawalVerificationPanel.style.display =
                        "block";

                }


                // --------------------------------
                // AMOUNT
                // --------------------------------

                if (
                    verificationAmount
                ) {

                    verificationAmount.textContent =
                        request.amount
                            ? `$${Number(
                                request.amount
                            ).toLocaleString(
                                "en-US",
                                {
                                    minimumFractionDigits:
                                        2,

                                    maximumFractionDigits:
                                        2
                                }
                            )}`
                            : "—";

                }


                // --------------------------------
                // WALLET
                // --------------------------------

                if (
                    verificationWallet
                ) {

                    verificationWallet.textContent =
                        request.wallet ||
                        "—";

                }


                // --------------------------------
                // TIME
                // --------------------------------

                if (
                    verificationTime
                ) {

                    verificationTime.textContent =
                        formatMessageTime(
                            request.createdAt
                        );

                }


                // --------------------------------
                // STATUS
                // --------------------------------

                updateVerificationUI(
                    "pending"
                );

            },

            (error) => {

                console.error(
                    "Withdrawal verification error:",
                    error
                );

            }

        );

}


// ========================================
// HIDE VERIFICATION
// ========================================

function hideWithdrawalVerification() {

    selectedWithdrawalId =
        null;


    if (
        withdrawalVerificationPanel
    ) {

        withdrawalVerificationPanel.style.display =
            "none";

    }

}


// ========================================
// VERIFICATION UI
// ========================================

function updateVerificationUI(
    status
) {

    if (
        !verificationStatus
    ) {
        return;
    }


    if (
        confirmPaymentBtn
    ) {

        confirmPaymentBtn.style.display =
            "none";

    }


    if (
        rejectPaymentBtn
    ) {

        rejectPaymentBtn.style.display =
            "none";

    }


    verificationStatus.className =
        "verification-status";


    // ------------------------------------
    // PENDING
    // ------------------------------------

    if (
        status ===
        "pending"
    ) {

        verificationStatus.textContent =
            "Pending";


        verificationStatus.classList.add(
            "pending"
        );


        if (
            confirmPaymentBtn
        ) {

            confirmPaymentBtn.style.display =
                "inline-flex";

        }


        if (
            rejectPaymentBtn
        ) {

            rejectPaymentBtn.style.display =
                "inline-flex";

        }


        return;
    }


    // ------------------------------------
    // CONFIRMED
    // ------------------------------------

    if (
        status ===
        "confirmed"
    ) {

        verificationStatus.textContent =
            "Payment Confirmed";


        verificationStatus.classList.add(
            "confirmed"
        );


        return;
    }


    // ------------------------------------
    // REJECTED
    // ------------------------------------

    if (
        status ===
        "rejected"
    ) {

        verificationStatus.textContent =
            "Payment Not Received";


        verificationStatus.classList.add(
            "rejected"
        );

    }

}


// ========================================
// ADD ADMIN MESSAGE
// ========================================

function addAdminMessage(
    text,
    isSupport
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        isSupport
            ? "admin-message-row support"
            : "admin-message-row customer";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "admin-message-bubble";


    bubble.textContent =
        text;


    row.appendChild(
        bubble
    );


    adminMessages.appendChild(
        row
    );

}


// ========================================
// ADD ADMIN PHOTO
// ========================================

function addAdminPhoto(
    imageUrl,
    isSupport
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        isSupport
            ? "admin-message-row support"
            : "admin-message-row customer";


    const image =
        document.createElement(
            "img"
        );


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


    row.appendChild(
        image
    );


    adminMessages.appendChild(
        row
    );

}


// ========================================
// SEND ADMIN REPLY
// ========================================

async function sendAdminReply() {

    const text =
        adminReplyInput.value.trim();


    if (
        !text ||
        !selectedUserId
    ) {

        return;

    }


    adminSendBtn.disabled =
        true;


    try {

        await addDoc(
            collection(
                db,
                "supportMessages"
            ),
            {

                userId:
                    selectedUserId,

                sender:
                    "support",

                message:
                    text,

                timestamp:
                    serverTimestamp()

            }
        );


        adminReplyInput.value =
            "";

    } catch (error) {

        console.error(
            "Unable to send reply:",
            error
        );


        alert(
            "Unable to send reply."
        );

    } finally {

        adminSendBtn.disabled =
            false;

    }

}


// ========================================
// SEND BUTTON
// ========================================

if (
    adminSendBtn
) {

    adminSendBtn.addEventListener(
        "click",
        sendAdminReply
    );

}


// ========================================
// ENTER TO SEND
// ========================================

if (
    adminReplyInput
) {

    adminReplyInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendAdminReply();

            }

        }
    );

}


// ========================================
// APPROVE PAYMENT
// ========================================

if (
    confirmPaymentBtn
) {

    confirmPaymentBtn.addEventListener(
        "click",
        async () => {

            if (
                !selectedWithdrawalId
            ) {

                alert(
                    "No withdrawal verification request selected."
                );

                return;

            }


            confirmPaymentBtn.disabled =
                true;


            if (
                rejectPaymentBtn
            ) {

                rejectPaymentBtn.disabled =
                    true;

            }


            try {

                await updateDoc(

                    doc(
                        db,
                        "withdrawalVerifications",
                        selectedWithdrawalId
                    ),

                    {

                        status:
                            "confirmed",

                        confirmedAt:
                            serverTimestamp(),

                        confirmedBy:
                            ADMIN_UID

                    }

                );


                // The Firestore listener will
                // automatically hide the card.

            } catch (error) {

                console.error(
                    "Unable to confirm payment:",
                    error
                );


                alert(
                    "Unable to confirm payment."
                );


            } finally {

                confirmPaymentBtn.disabled =
                    false;


                if (
                    rejectPaymentBtn
                ) {

                    rejectPaymentBtn.disabled =
                        false;

                }

            }

        }
    );

}


// ========================================
// REJECT PAYMENT
// ========================================

if (
    rejectPaymentBtn
) {

    rejectPaymentBtn.addEventListener(
        "click",
        async () => {

            if (
                !selectedWithdrawalId
            ) {

                alert(
                    "No withdrawal verification request selected."
                );

                return;

            }


            rejectPaymentBtn.disabled =
                true;


            if (
                confirmPaymentBtn
            ) {

                confirmPaymentBtn.disabled =
                    true;

            }


            try {

                await updateDoc(

                    doc(
                        db,
                        "withdrawalVerifications",
                        selectedWithdrawalId
                    ),

                    {

                        status:
                            "rejected",

                        rejectedAt:
                            serverTimestamp(),

                        rejectedBy:
                            ADMIN_UID

                    }

                );


                // The Firestore listener will
                // automatically hide the card.

            } catch (error) {

                console.error(
                    "Unable to reject payment:",
                    error
                );


                alert(
                    "Unable to update payment status."
                );


            } finally {

                rejectPaymentBtn.disabled =
                    false;


                if (
                    confirmPaymentBtn
                ) {

                    confirmPaymentBtn.disabled =
                        false;

                }

            }

        }
    );

}


// ========================================
// LOGOUT
// ========================================

if (
    adminLogoutBtn
) {

    adminLogoutBtn.addEventListener(
        "click",
        async () => {

            await auth.signOut();

            window.location.href =
                "login.html";

        }
    );

}


// ========================================
// FORMAT TIME
// ========================================

function formatMessageTime(
    timestamp
) {

    if (
        !timestamp
    ) {

        return "";

    }


    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}