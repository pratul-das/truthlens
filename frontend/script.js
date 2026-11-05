/* =========================================================
   TRUTHLENS - MAIN JAVASCRIPT
   Home + Settings + Login + Theme + Language
   Profile + Analysis Notifications + Security Notifications
   Support Modals
========================================================= */

"use strict";


/* =========================================================
   BASIC HELPERS
========================================================= */

function getCurrentLanguage() {

    return localStorage.getItem("language") || "English";

}


function getSavedBoolean(key, defaultValue = true) {

    const value =
        localStorage.getItem(key);

    if (value === null) {

        return defaultValue;

    }

    return value === "true";

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
/* =========================================================
   BACKEND AUTHENTICATION
========================================================= */

async function verifyBackendSession() {

    const accessToken =
        sessionStorage.getItem(
            "truthlensAccessToken"
        ) ||
        localStorage.getItem(
            "truthlensAccessToken"
        );

    /* -----------------------------------------
       No backend token
       Guest users can continue normally
    ----------------------------------------- */

    if (!accessToken) {

        return null;

    }

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/me",
                {
                    method: "GET",
                    headers: {
                        "Authorization":
                            "Bearer " +
                            accessToken
                    }
                }
            );

        if (!response.ok) {

    localStorage.removeItem(
        "truthlensAccessToken"
    );

    sessionStorage.removeItem(
        "truthlensAccessToken"
    );

    localStorage.removeItem(
        "truthlensUser"
    );

    sessionStorage.removeItem(
        "truthlensUser"
    );

    localStorage.setItem(
        "truthlensLoggedOut",
        "true"
    );

    return null;
}

        const data =
            await response.json();

        if (!data.user) {

            return null;

        }

       const existingUser =
    getSavedUser();

const verifiedUser = {

    id:
        data.user.id,

    name:
        data.user.name,

    email:
        data.user.email,

    isGuest:
        false,

    profilePicture:
        existingUser &&
        existingUser.profilePicture
            ? existingUser.profilePicture
            : null
};
        /* -----------------------------------------
           Keep profile data synchronized
        ----------------------------------------- */

        if (
            sessionStorage.getItem(
                "truthlensAccessToken"
            )
        ) {

            sessionStorage.setItem(
                "truthlensUser",
                JSON.stringify(
                    verifiedUser
                )
            );

        } else {

            localStorage.setItem(
                "truthlensUser",
                JSON.stringify(
                    verifiedUser
                )
            );

        }

        return verifiedUser;

    } catch (error) {

        console.error(
            "Authentication verification failed:",
            error
        );

        return null;

    }

}

/* =========================================================
   NOTIFICATION STORAGE
========================================================= */

function getSavedTruthLensNotifications() {

    try {

        const saved =
            localStorage.getItem(
                "truthlensNotifications"
            );

        if (!saved) {

            return [];

        }

        const notifications =
            JSON.parse(saved);

        return Array.isArray(notifications)
            ? notifications
            : [];

    } catch (error) {

        console.error(
            "Unable to read notifications:",
            error
        );

        return [];

    }

}


function saveTruthLensNotifications(
    notifications
) {

    localStorage.setItem(
        "truthlensNotifications",
        JSON.stringify(
            notifications.slice(0, 30)
        )
    );

}


/* =========================================================
   NOTIFICATION TRANSLATIONS
========================================================= */

function getNotificationPanelText() {

    const translations = {

        English: {

            title:
                "Notifications",

            markAll:
                "Mark all as read",

            clear:
                "Clear all",

            empty:
                "No notifications yet.",

            analysis:
                "Analysis",

            security:
                "Security"

        },


        Hindi: {

            title:
                "सूचनाएं",

            markAll:
                "सभी को पढ़ा हुआ चिह्नित करें",

            clear:
                "सभी साफ़ करें",

            empty:
                "अभी कोई सूचना नहीं है।",

            analysis:
                "विश्लेषण",

            security:
                "सुरक्षा"

        },


        Bengali: {

            title:
                "বিজ্ঞপ্তি",

            markAll:
                "সবগুলো পড়া হিসেবে চিহ্নিত করুন",

            clear:
                "সব মুছে ফেলুন",

            empty:
                "এখনও কোনো বিজ্ঞপ্তি নেই।",

            analysis:
                "বিশ্লেষণ",

            security:
                "নিরাপত্তা"

        }

    };


    return (
        translations[getCurrentLanguage()] ||
        translations.English
    );

}


/* =========================================================
   ADD NOTIFICATION
========================================================= */

function addTruthLensNotification(
    title,
    message,
    type = "analysis"
) {

    const notifications =
        getSavedTruthLensNotifications();


    notifications.unshift({

        id:
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2),

        title:
            title,

        message:
            message,

        type:
            type,

        time:
            new Date().toISOString(),

        read:
            false

    });


    saveTruthLensNotifications(
        notifications
    );


    renderTruthLensNotifications();

}


/* =========================================================
   BROWSER NOTIFICATIONS
========================================================= */

function sendBrowserNotification(
    title,
    message
) {

    if (!("Notification" in window)) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    try {

        new Notification(
            "TruthLens • " + title,
            {
                body:
                    message
            }
        );

    } catch (error) {

        console.error(
            "Browser notification error:",
            error
        );

    }

}


async function requestBrowserNotificationPermission() {

    if (!("Notification" in window)) {

        return false;

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return true;

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        return false;

    }


    try {

        const permission =
            await Notification.requestPermission();

        return permission === "granted";

    } catch (error) {

        console.error(
            "Notification permission error:",
            error
        );

        return false;

    }

}


/* =========================================================
   ANALYSIS NOTIFICATIONS
========================================================= */

function getAnalysisNotificationText(
    prediction,
    confidence
) {

    const languages = {

        English: {

            title:
                "Analysis Complete",

            message:
                prediction +
                " • Model confidence: " +
                (
                    confidence !== null &&
                    confidence !== undefined
                        ? confidence + "%"
                        : "Not available"
                )

        },


        Hindi: {

            title:
                "विश्लेषण पूरा हुआ",

            message:
                prediction +
                " • मॉडल का विश्वास: " +
                (
                    confidence !== null &&
                    confidence !== undefined
                        ? confidence + "%"
                        : "उपलब्ध नहीं"
                )

        },


        Bengali: {

            title:
                "বিশ্লেষণ সম্পন্ন হয়েছে",

            message:
                prediction +
                " • মডেলের আত্মবিশ্বাস: " +
                (
                    confidence !== null &&
                    confidence !== undefined
                        ? confidence + "%"
                        : "উপলব্ধ নয়"
                )

        }

    };


    return (
        languages[getCurrentLanguage()] ||
        languages.English
    );

}


function showAnalysisNotification(
    prediction,
    confidence
) {

    if (
        !getSavedBoolean(
            "analysisNotifications",
            true
        )
    ) {

        return;

    }


    const notification =
        getAnalysisNotificationText(
            prediction,
            confidence
        );


    addTruthLensNotification(
        notification.title,
        notification.message,
        "analysis"
    );


    sendBrowserNotification(
        notification.title,
        notification.message
    );

}


/* =========================================================
   SECURITY NOTIFICATIONS
========================================================= */

function showSecurityNotification(
    title,
    message
) {

    if (
        !getSavedBoolean(
            "securityNotifications",
            true
        )
    ) {

        return;

    }


    addTruthLensNotification(
        title,
        message,
        "security"
    );


    sendBrowserNotification(
        title,
        message
    );

}


/* =========================================================
   NOTIFICATION UI
========================================================= */

function createTruthLensNotificationUI() {

    if (!document.body) {

        return;

    }


    if (
        document.getElementById(
            "truthlensNotificationUI"
        )
    ) {

        return;

    }


    const wrapper =
        document.createElement("div");


    wrapper.id =
        "truthlensNotificationUI";


    wrapper.innerHTML = `

        <div
            id="truthlensNotificationBell"
            title="Notifications"
            aria-label="Notifications"
            role="button"
            tabindex="0"
            style="
                position:fixed;
                right:24px;
                bottom:24px;
                width:52px;
                height:52px;
                border-radius:50%;
                background:#2563eb;
                color:white;
                display:flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                z-index:9998;
                box-shadow:
                    0 8px 24px rgba(0,0,0,.18);
                font-size:23px;
                user-select:none;
            "
        >

            🔔

            <span
                id="truthlensNotificationBadge"
                style="
                    position:absolute;
                    top:-4px;
                    right:-4px;
                    min-width:20px;
                    height:20px;
                    padding:0 5px;
                    border-radius:10px;
                    background:#dc2626;
                    color:white;
                    display:none;
                    align-items:center;
                    justify-content:center;
                    font-size:11px;
                    font-weight:700;
                    box-sizing:border-box;
                "
            ></span>

        </div>


        <div
            id="truthlensNotificationPanel"
            style="
                position:fixed;
                right:24px;
                bottom:88px;
                width:340px;
                max-width:calc(100vw - 32px);
                max-height:460px;
                background:#ffffff;
                color:#111827;
                border:1px solid #e5e7eb;
                border-radius:16px;
                box-shadow:
                    0 18px 50px rgba(0,0,0,.20);
                z-index:9999;
                display:none;
                overflow:hidden;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                    padding:15px 16px;
                    border-bottom:
                        1px solid #e5e7eb;
                "
            >

                <strong
                    id="truthlensNotificationTitle"
                >
                    Notifications
                </strong>


                <button
                    id="truthlensMarkAllRead"
                    type="button"
                    style="
                        border:0;
                        background:transparent;
                        color:#2563eb;
                        cursor:pointer;
                        font-size:12px;
                        padding:4px;
                    "
                >
                    Mark all as read
                </button>

            </div>


            <div
                id="truthlensNotificationList"
                style="
                    max-height:340px;
                    overflow-y:auto;
                "
            ></div>


            <div
                style="
                    padding:10px 16px;
                    border-top:
                        1px solid #e5e7eb;
                    text-align:right;
                "
            >

                <button
                    id="truthlensClearNotifications"
                    type="button"
                    style="
                        border:0;
                        background:transparent;
                        color:#dc2626;
                        cursor:pointer;
                        font-size:12px;
                        padding:4px;
                    "
                >
                    Clear all
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(wrapper);


    const bell =
        document.getElementById(
            "truthlensNotificationBell"
        );


    const panel =
        document.getElementById(
            "truthlensNotificationPanel"
        );


    const markAllRead =
        document.getElementById(
            "truthlensMarkAllRead"
        );


    const clearNotifications =
        document.getElementById(
            "truthlensClearNotifications"
        );


    function toggleNotificationPanel() {

        if (!panel) {

            return;

        }


        panel.style.display =
            panel.style.display === "block"
                ? "none"
                : "block";

    }


    if (bell) {

        bell.addEventListener(
            "click",
            toggleNotificationPanel
        );


        bell.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    toggleNotificationPanel();

                }

            }
        );

    }


    if (markAllRead) {

        markAllRead.addEventListener(
            "click",
            function () {

                const notifications =
                    getSavedTruthLensNotifications();


                notifications.forEach(
                    function (notification) {

                        notification.read =
                            true;

                    }
                );


                saveTruthLensNotifications(
                    notifications
                );


                renderTruthLensNotifications();

            }
        );

    }


    if (clearNotifications) {

        clearNotifications.addEventListener(
            "click",
            function () {

                localStorage.removeItem(
                    "truthlensNotifications"
                );


                renderTruthLensNotifications();

            }
        );

    }


    document.addEventListener(
        "click",
        function (event) {

            if (
                panel &&
                panel.style.display === "block" &&
                !panel.contains(event.target) &&
                bell &&
                !bell.contains(event.target)
            ) {

                panel.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   NOTIFICATION TIME
========================================================= */

function formatNotificationTime(value) {

    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

        return "";

    }


    const language =
        getCurrentLanguage();


    let locale =
        "en-IN";


    if (language === "Hindi") {

        locale =
            "hi-IN";

    }


    if (language === "Bengali") {

        locale =
            "bn-IN";

    }


    return date.toLocaleString(
        locale,
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   RENDER NOTIFICATIONS
========================================================= */

function renderTruthLensNotifications() {

    const list =
        document.getElementById(
            "truthlensNotificationList"
        );


    const badge =
        document.getElementById(
            "truthlensNotificationBadge"
        );


    const title =
        document.getElementById(
            "truthlensNotificationTitle"
        );


    const markAllRead =
        document.getElementById(
            "truthlensMarkAllRead"
        );


    const clearNotifications =
        document.getElementById(
            "truthlensClearNotifications"
        );


    if (
        !list ||
        !badge ||
        !title ||
        !markAllRead ||
        !clearNotifications
    ) {

        return;

    }


    const labels =
        getNotificationPanelText();


    title.textContent =
        labels.title;


    markAllRead.textContent =
        labels.markAll;


    clearNotifications.textContent =
        labels.clear;


    const notifications =
        getSavedTruthLensNotifications();


    const unreadCount =
        notifications.filter(
            notification =>
                !notification.read
        ).length;


    if (unreadCount > 0) {

        badge.style.display =
            "flex";


        badge.textContent =
            unreadCount > 99
                ? "99+"
                : String(unreadCount);

    } else {

        badge.style.display =
            "none";

        badge.textContent =
            "";

    }


    if (notifications.length === 0) {

        list.innerHTML = `

            <div
                style="
                    padding:28px 18px;
                    text-align:center;
                    color:#6b7280;
                    font-size:14px;
                "
            >

                ${labels.empty}

            </div>

        `;

        return;

    }


    list.innerHTML =
        "";


    notifications.forEach(
        function (notification) {

            const item =
                document.createElement("div");


            const background =
                notification.read
                    ? "#ffffff"
                    : "#eff6ff";


            item.style.cssText =
                "padding:13px 15px;" +
                "border-bottom:1px solid #e5e7eb;" +
                "cursor:pointer;" +
                "background:" +
                background +
                ";";


            const icon =
                notification.type ===
                "security"
                    ? "🔐"
                    : "🔎";


            item.innerHTML = `

                <div
                    style="
                        display:flex;
                        align-items:flex-start;
                        justify-content:
                            space-between;
                        gap:10px;
                    "
                >

                    <strong
                        style="
                            font-size:13px;
                            line-height:1.4;
                        "
                    >

                        ${icon}

                        ${escapeHTML(
                            notification.title
                        )}

                    </strong>


                    ${
                        notification.read
                            ? ""
                            : `
                                <span
                                    style="
                                        width:7px;
                                        height:7px;
                                        flex:0 0 7px;
                                        border-radius:50%;
                                        background:#2563eb;
                                        margin-top:5px;
                                    "
                                ></span>
                            `
                    }

                </div>


                <div
                    style="
                        margin-top:5px;
                        font-size:12px;
                        line-height:1.5;
                        color:#4b5563;
                    "
                >

                    ${escapeHTML(
                        notification.message
                    )}

                </div>


                <div
                    style="
                        margin-top:6px;
                        font-size:10px;
                        color:#9ca3af;
                    "
                >

                    ${formatNotificationTime(
                        notification.time
                    )}

                </div>

            `;


            item.addEventListener(
                "click",
                function () {

                    const updated =
                        getSavedTruthLensNotifications();


                    const target =
                        updated.find(
                            entry =>
                                entry.id ===
                                notification.id
                        );


                    if (target) {

                        target.read =
                            true;

                    }


                    saveTruthLensNotifications(
                        updated
                    );


                    renderTruthLensNotifications();

                }
            );


            list.appendChild(item);

        }
    );

}


/* =========================================================
   START NOTIFICATION UI
========================================================= */

createTruthLensNotificationUI();

renderTruthLensNotifications();


/* =========================================================
   HOME PAGE - TEXT / LINK TOGGLE
========================================================= */

const checkButton =
    document.getElementById(
        "checkButton"
    );


const newsText =
    document.getElementById(
        "newsText"
    );


const newsLink =
    document.getElementById(
        "newsLink"
    );


const textOption =
    document.getElementById(
        "textOption"
    );


const linkOption =
    document.getElementById(
        "linkOption"
    );


const result =
    document.getElementById(
        "result"
    );


if (
    textOption &&
    linkOption &&
    newsText &&
    newsLink
) {

    textOption.addEventListener(
        "click",
        function () {

            textOption.classList.add(
                "active"
            );


            linkOption.classList.remove(
                "active"
            );


            newsText.style.display =
                "block";


            newsLink.style.display =
                "none";

        }
    );


    linkOption.addEventListener(
        "click",
        function () {

            linkOption.classList.add(
                "active"
            );


            textOption.classList.remove(
                "active"
            );


            newsLink.style.display =
                "block";


            newsText.style.display =
                "none";

        }
    );

}


/* =========================================================
   HOME PAGE - NEWS ANALYSIS
========================================================= */

if (checkButton) {

    checkButton.addEventListener(
        "click",
        async function () {

            let input =
                "";


            if (
                textOption &&
                textOption.classList.contains(
                    "active"
                ) &&
                newsText
            ) {

                input =
                    newsText.value.trim();

            } else if (newsLink) {

                input =
                    newsLink.value.trim();

            }


            if (!input) {

                if (result) {

                    result.innerHTML = `

                        <div
                            class="result-warning"
                        >
                            ⚠️ Please enter some
                            news first.
                        </div>

                    `;

                }

                return;

            }


            if (result) {

                result.innerHTML = `

                    <div
                        class="result-title"
                    >
                        🔍 Analyzing...
                    </div>

                    <p>
                        Please wait while
                        TruthLens analyzes
                        the news.
                    </p>

                `;

            }


            try {

                const isLinkMode =
                    linkOption &&
                    linkOption.classList.contains(
                        "active"
                    );


                const endpoint =
                    isLinkMode
                        ? "http://127.0.0.1:8000/predict-url"
                        : "http://127.0.0.1:8000/predict";


                const requestBody =
                    isLinkMode
                        ? {
                            url:
                                input
                        }
                        : {
                            text:
                                input
                        };


                const response =
                    await fetch(
                        endpoint,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    requestBody
                                )

                        }
                    );


                if (!response.ok) {

                    const errorData =
                        await response
                            .json()
                            .catch(
                                () => null
                            );


                    throw new Error(
                        errorData?.detail ||
                        "Server returned an error."
                    );

                }


                const data =
                    await response.json();


                const prediction =
                    data.prediction;


                const confidence =
                    data.confidence;


                /* -------------------------
                   CONFIDENCE
                ------------------------- */

                let confidenceMessage =
                    "";


                if (
                    confidence === null ||
                    confidence === undefined
                ) {

                    confidenceMessage = `

                        <div
                            class="result-warning"
                        >

                            ⚠️ Confidence could
                            not be calculated.

                        </div>

                    `;

                } else if (
                    confidence < 60
                ) {

                    confidenceMessage = `

                        <div
                            class="result-warning"
                        >

                            ⚠️ Low confidence
                            <br>

                            The model is uncertain
                            about this
                            classification.

                        </div>

                    `;

                } else if (
                    confidence < 80
                ) {

                    confidenceMessage = `

                        <div
                            class="result-warning"
                        >

                            ⚠️ Moderate confidence
                            <br>

                            Consider checking
                            this information
                            with reliable
                            sources.

                        </div>

                    `;

                } else {

                    confidenceMessage = `

                        <div
                            class="result-success"
                        >

                            ✓ High model
                            confidence

                        </div>

                    `;

                }


                /* -------------------------
                   PREDICTION
                ------------------------- */

                let statusText =
                    "";


                let disclaimer =
                    "";


                if (
                    prediction === "Fake"
                ) {

                    statusText =
                        "⚠️ FAKE NEWS";


                    disclaimer = `

                        <p>

                            <strong>
                                Important:
                            </strong>

                            This is an ML
                            classification,
                            not a factual
                            verification.

                        </p>

                    `;

                } else if (
                    prediction === "Real"
                ) {

                    statusText =
                        "✅ REAL NEWS";


                    disclaimer = `

                        <p>

                            <strong>
                                Important:
                            </strong>

                            This is an ML
                            classification,
                            not a factual
                            verification.

                        </p>

                    `;

                } else {

                    statusText =
                        "🔍 UNKNOWN";


                    disclaimer = `

                        <p>

                            The model returned
                            an unexpected
                            classification.

                        </p>

                    `;

                }


                const confidenceValue =
                    confidence !== null &&
                    confidence !== undefined
                        ? confidence + "%"
                        : "Not available";


                const resultClass =
                    prediction === "Fake"
                        ? "fake-result"
                        : prediction === "Real"
                            ? "real-result"
                            : "unknown-result";


                if (result) {

                    result.innerHTML = `

                        <div
                            class="
                                result-card
                                ${resultClass}
                            "
                        >

                            <div
                                class="result-header"
                            >

                                <div
                                    class="result-title"
                                >

                                    🔍 Analysis Complete

                                </div>


                                <div
                                    class="result-status"
                                >

                                    ${escapeHTML(
                                        statusText
                                    )}

                                </div>

                            </div>


                            <div
                                class="result-details"
                            >

                                <div
                                    class="result-detail"
                                >

                                    <span>
                                        Prediction
                                    </span>


                                    <strong>

                                        ${escapeHTML(
                                            prediction
                                        )}

                                    </strong>

                                </div>


                                <div
                                    class="result-detail"
                                >

                                    <span>
                                        Model Confidence
                                    </span>


                                    <strong>

                                        ${escapeHTML(
                                            confidenceValue
                                        )}

                                    </strong>

                                </div>

                            </div>


                            ${confidenceMessage}


                            <div
                                class="result-message"
                            >

                                ${escapeHTML(
                                    data.message ||
                                    ""
                                )}

                            </div>


                            <div
                                class="
                                    result-disclaimer
                                "
                            >

                                ${disclaimer}

                            </div>

                        </div>

                    `;

                }


                showAnalysisNotification(
                    prediction,
                    confidence
                );


            } catch (error) {

                console.error(error);


                if (result) {

                    result.innerHTML = `

                        <div
                            class="result-warning"
                        >

                            ❌ Unable to connect
                            to the TruthLens
                            server.

                        </div>


                        <p>

                            ${escapeHTML(
                                error.message
                            )}

                        </p>


                        <p>

                            Please make sure
                            the FastAPI backend
                            is running.

                        </p>

                    `;

                }

            }

        }
    );

}


/* =========================================================
   THEME
========================================================= */

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


function applyTheme(theme) {

    if (!document.body) {

        return;

    }


    document.body.classList.toggle(
        "dark-mode",
        theme === "dark"
    );

}


const savedTheme =
    localStorage.getItem("theme") ||
    "light";


applyTheme(
    savedTheme
);


if (themeToggle) {

    themeToggle.checked =
        savedTheme === "dark";


    themeToggle.addEventListener(
        "change",
        function () {

            const newTheme =
                this.checked
                    ? "dark"
                    : "light";


            localStorage.setItem(
                "theme",
                newTheme
            );


            applyTheme(
                newTheme
            );

        }
    );

}


/* =========================================================
   LANGUAGE SYSTEM
========================================================= */

const languageSelect =
    document.getElementById(
        "languageSelect"
    );

const registerLanguage =
    document.getElementById(
        "registerLanguage"
    );

const translations = {

    /* =====================================================
       ENGLISH
    ===================================================== */

    English: {

        /* -------------------------
           LOGIN PAGE
        ------------------------- */

        loginBrandBadge:
            "🛡️ Trusted AI Verification",

        loginBrandTitle:
            "Welcome back to TruthLens",

        loginBrandDescription:
            "Verify information, explore the facts, and stay informed with confidence.",

        loginFeature1:
            "✓ AI-powered news analysis",

        loginFeature2:
            "✓ Fast and simple verification",

        loginFeature3:
            "✓ Designed for trustworthy information",

        loginWelcome:
            "Welcome Back 👋",

        loginSubtitle:
            "Sign in to continue to your account",

        loginNameLabel:
            "Full Name",

        loginNamePlaceholder:
            "Enter your full name",

        loginEmailLabel:
            "Email Address",

        loginEmailPlaceholder:
            "you@example.com",

        loginPasswordLabel:
            "Password",

        loginPasswordPlaceholder:
            "Enter your password",

        loginForgotPassword:
            "Forgot password?",

        loginRememberMe:
            "Remember me",

        loginSignIn:
            "Sign In",

        loginOr:
            "OR",

        loginGuest:
            "Continue as Guest",

        loginAgreement:
            "By continuing, you agree to our",

        loginTerms:
            "Terms",

        loginAnd:
            "and",

        loginFooter:
            "© 2026 TruthLens. All rights reserved.",


        /* -------------------------
           NAVIGATION
        ------------------------- */

        navHome:
            "Home",

        navSettings:
            "Settings",

        navLogin:
            "Login",

navRegister: "Register",

        /* -------------------------
           SETTINGS
        ------------------------- */

        settingsTitle:
            "Settings",

        settingsSubtitle:
            "Manage your account and preferences",

        profile:
            "Profile",

        editProfile:
            "Edit Profile",

        notifications:
            "Notifications",

        analysisNotifications:
            "Analysis Notifications",

        analysisDescription:
            "Receive notifications about your verification results.",

        securityNotifications:
            "Security Notifications",

        securityDescription:
            "Receive important security alerts.",

        appearance:
            "Appearance",

        themeTitle:
            "Light / Dark Mode",

        themeDescription:
            "Switch between light and dark mode.",

        languageTitle:
            "Language",

        languageDescription:
            "Choose your preferred language.",

        support:
            "Support & Information",

        helpFaq:
            "Help & FAQ",

        aboutTruthLens:
            "About TruthLens",

        privacyPolicy:
            "Privacy Policy",


        /* -------------------------
           HOME PAGE
        ------------------------- */

        aiBadge:
            "🛡️ AI-Powered News Verification",

        heroTitle:
            "See the truth",

        heroTitleSpan:
            "behind the news.",

        heroDescription:
            "TruthLens helps you identify potentially misleading or fake news using intelligent analysis.",

        checkNewsLabel:
            "Check a news article or message",

        newsText:
            "📝 News Text",

        newsLink:
            "🔗 News Link",

        newsTextPlaceholder:
            "Paste your news article, message, or claim here...",

        newsLinkPlaceholder:
            "Paste the news article link here...",

        checkNews:
            "🔍 Check News",

        resultPlaceholder:
            "Your verification result will appear here.",

        footer:
    "© 2026 TruthLens • Helping you verify before you trust.",


/* =====================================================
   REGISTER PAGE
===================================================== */

registerIntroTitle:
    "Welcome to TruthLens",

registerBrandBadge:
    "Trusted AI Verification",

registerBrandDescription:
    "Verify information, explore the facts, and stay informed with confidence.",

registerFeature1:
    "✓ AI-powered news analysis",

registerFeature2:
    "✓ Fast and simple verification",

registerFeature3:
    "✓ Designed for trustworthy information",

registerTitle:
    "Create Account",

registerSubtitle:
    "Create your TruthLens account",

fullName:
    "Full Name",

emailAddress:
    "Email Address",

password:
    "Password",

confirmPassword:
    "Confirm Password",

registerButton:
    "Create Account",

alreadyHaveAccount:
    "Already have an account?",

login:
    "Login",

registerFullNamePlaceholder:
    "Enter your full name",

registerEmailPlaceholder:
    "you@example.com",

registerPasswordPlaceholder:
    "Create a password",

registerConfirmPasswordPlaceholder:
    "Confirm your password",

registerLanguageLabel:
    "Language"

    },


    /* =====================================================
       HINDI
    ===================================================== */

    Hindi: {

        /* -------------------------
           LOGIN PAGE
        ------------------------- */

        loginBrandBadge:
            "🛡️ विश्वसनीय AI सत्यापन",

        loginBrandTitle:
            "TruthLens में आपका फिर से स्वागत है",

        loginBrandDescription:
            "जानकारी सत्यापित करें, तथ्यों को जानें और विश्वास के साथ सूचित रहें।",

        loginFeature1:
            "✓ AI-संचालित समाचार विश्लेषण",

        loginFeature2:
            "✓ तेज़ और आसान सत्यापन",

        loginFeature3:
            "✓ विश्वसनीय जानकारी के लिए डिज़ाइन किया गया",

        loginWelcome:
            "वापसी पर स्वागत है 👋",

        loginSubtitle:
            "अपने खाते में जारी रखने के लिए साइन इन करें",

        loginNameLabel:
            "पूरा नाम",

        loginNamePlaceholder:
            "अपना पूरा नाम दर्ज करें",

        loginEmailLabel:
            "ईमेल पता",

        loginEmailPlaceholder:
            "you@example.com",

        loginPasswordLabel:
            "पासवर्ड",

        loginPasswordPlaceholder:
            "अपना पासवर्ड दर्ज करें",

        loginForgotPassword:
            "पासवर्ड भूल गए?",

        loginRememberMe:
            "मुझे याद रखें",

        loginSignIn:
            "साइन इन करें",

        loginOr:
            "या",

        loginGuest:
            "अतिथि के रूप में जारी रखें",

        loginAgreement:
            "जारी रखते हुए, आप हमारी",

        loginTerms:
            "शर्तों",

        loginAnd:
            "और",

        loginFooter:
            "© 2026 TruthLens. सर्वाधिकार सुरक्षित।",


        /* -------------------------
           NAVIGATION
        ------------------------- */

        navHome:
            "होम",

        navSettings:
            "सेटिंग्स",

        navLogin:
            "लॉगिन",

navRegister: "रजिस्टर",

        /* -------------------------
           SETTINGS
        ------------------------- */

        settingsTitle:
            "सेटिंग्स",

        settingsSubtitle:
            "अपने खाते और प्राथमिकताओं को प्रबंधित करें",

        profile:
            "प्रोफ़ाइल",

        editProfile:
            "प्रोफ़ाइल संपादित करें",

        notifications:
            "सूचनाएं",

        analysisNotifications:
            "विश्लेषण सूचनाएं",

        analysisDescription:
            "अपने सत्यापन परिणामों के बारे में सूचनाएं प्राप्त करें।",

        securityNotifications:
            "सुरक्षा सूचनाएं",

        securityDescription:
            "महत्वपूर्ण सुरक्षा अलर्ट प्राप्त करें।",

        appearance:
            "दिखावट",

        themeTitle:
            "लाइट / डार्क मोड",

        themeDescription:
            "लाइट और डार्क मोड के बीच बदलें।",

        languageTitle:
            "भाषा",

        languageDescription:
            "अपनी पसंदीदा भाषा चुनें।",

        support:
            "सहायता और जानकारी",

        helpFaq:
            "सहायता और सामान्य प्रश्न",

        aboutTruthLens:
            "TruthLens के बारे में",

        privacyPolicy:
            "गोपनीयता नीति",


        /* -------------------------
           HOME PAGE
        ------------------------- */

        aiBadge:
            "🛡️ AI-संचालित समाचार सत्यापन",

        heroTitle:
            "समाचार के",

        heroTitleSpan:
            "पीछे की सच्चाई देखें।",

        heroDescription:
            "TruthLens बुद्धिमान विश्लेषण का उपयोग करके संभावित रूप से भ्रामक या नकली समाचारों की पहचान करने में आपकी सहायता करता है।",

        checkNewsLabel:
            "समाचार लेख या संदेश की जांच करें",

        newsText:
            "📝 समाचार टेक्स्ट",

        newsLink:
            "🔗 समाचार लिंक",

        newsTextPlaceholder:
            "अपना समाचार लेख, संदेश या दावा यहां पेस्ट करें...",

        newsLinkPlaceholder:
            "समाचार लेख का लिंक यहां पेस्ट करें...",

        checkNews:
            "🔍 समाचार जांचें",

        resultPlaceholder:
            "आपका सत्यापन परिणाम यहां दिखाई देगा।",

        footer:
    "© 2026 TruthLens • भरोसा करने से पहले सत्यापित करें。",


/* =====================================================
   REGISTER PAGE
===================================================== */

registerIntroTitle:
    "TruthLens में आपका स्वागत है",

registerBrandBadge:
    "विश्वसनीय AI सत्यापन",

registerBrandDescription:
    "जानकारी सत्यापित करें, तथ्यों को जानें और विश्वास के साथ सूचित रहें।",

registerFeature1:
    "✓ AI-संचालित समाचार विश्लेषण",

registerFeature2:
    "✓ तेज़ और आसान सत्यापन",

registerFeature3:
    "✓ विश्वसनीय जानकारी के लिए डिज़ाइन किया गया",

registerTitle:
    "खाता बनाएँ",

registerSubtitle:
    "अपना TruthLens खाता बनाएँ",

fullName:
    "पूरा नाम",

emailAddress:
    "ईमेल पता",

password:
    "पासवर्ड",

confirmPassword:
    "पासवर्ड की पुष्टि करें",

registerButton:
    "खाता बनाएँ",

alreadyHaveAccount:
    "क्या आपके पास पहले से खाता है?",

login:
    "लॉगिन",

registerFullNamePlaceholder:
    "अपना पूरा नाम दर्ज करें",

registerEmailPlaceholder:
    "you@example.com",

registerPasswordPlaceholder:
    "पासवर्ड बनाएँ",

registerConfirmPasswordPlaceholder:
    "अपना पासवर्ड दोबारा दर्ज करें",

registerLanguageLabel:
    "भाषा"

    },


    /* =====================================================
       BENGALI
    ===================================================== */

    Bengali: {

        /* -------------------------
           LOGIN PAGE
        ------------------------- */

        loginBrandBadge:
            "🛡️ বিশ্বস্ত AI যাচাইকরণ",

        loginBrandTitle:
            "TruthLens-এ আপনাকে আবার স্বাগতম",

        loginBrandDescription:
            "তথ্য যাচাই করুন, তথ্য অনুসন্ধান করুন এবং আত্মবিশ্বাসের সাথে অবগত থাকুন।",

        loginFeature1:
            "✓ AI-চালিত সংবাদ বিশ্লেষণ",

        loginFeature2:
            "✓ দ্রুত এবং সহজ যাচাইকরণ",

        loginFeature3:
            "✓ বিশ্বস্ত তথ্যের জন্য ডিজাইন করা",

        loginWelcome:
            "আবার স্বাগতম 👋",

        loginSubtitle:
            "আপনার অ্যাকাউন্টে চালিয়ে যেতে সাইন ইন করুন",

        loginNameLabel:
            "পুরো নাম",

        loginNamePlaceholder:
            "আপনার পুরো নাম লিখুন",

        loginEmailLabel:
            "ইমেল ঠিকানা",

        loginEmailPlaceholder:
            "you@example.com",

        loginPasswordLabel:
            "পাসওয়ার্ড",

        loginPasswordPlaceholder:
            "আপনার পাসওয়ার্ড লিখুন",

        loginForgotPassword:
            "পাসওয়ার্ড ভুলে গেছেন?",

        loginRememberMe:
            "আমাকে মনে রাখুন",

        loginSignIn:
            "সাইন ইন করুন",

        loginOr:
            "অথবা",

        loginGuest:
            "অতিথি হিসেবে চালিয়ে যান",

        loginAgreement:
            "চালিয়ে যাওয়ার মাধ্যমে আপনি আমাদের",

        loginTerms:
            "শর্তাবলীতে",

        loginAnd:
            "এবং",

        loginFooter:
            "© 2026 TruthLens. সর্বস্বত্ব সংরক্ষিত।",


        /* -------------------------
           NAVIGATION
        ------------------------- */

        navHome:
            "হোম",

        navSettings:
            "সেটিংস",

        navLogin:
            "লগইন",

navRegister: "রেজিস্টার",

        /* -------------------------
           SETTINGS
        ------------------------- */

        settingsTitle:
            "সেটিংস",

        settingsSubtitle:
            "আপনার অ্যাকাউন্ট এবং পছন্দগুলি পরিচালনা করুন",

        profile:
            "প্রোফাইল",

        editProfile:
            "প্রোফাইল সম্পাদনা করুন",

        notifications:
            "বিজ্ঞপ্তি",

        analysisNotifications:
            "বিশ্লেষণ বিজ্ঞপ্তি",

        analysisDescription:
            "আপনার যাচাইয়ের ফলাফল সম্পর্কে বিজ্ঞপ্তি পান।",

        securityNotifications:
            "নিরাপত্তা বিজ্ঞপ্তি",

        securityDescription:
            "গুরুত্বপূর্ণ নিরাপত্তা সতর্কতা পান।",

        appearance:
            "চেহারা",

        themeTitle:
            "লাইট / ডার্ক মোড",

        themeDescription:
            "লাইট এবং ডার্ক মোডের মধ্যে পরিবর্তন করুন।",

        languageTitle:
            "ভাষা",

        languageDescription:
            "আপনার পছন্দের ভাষা নির্বাচন করুন।",

        support:
            "সহায়তা ও তথ্য",

        helpFaq:
            "সহায়তা ও সাধারণ প্রশ্ন",

        aboutTruthLens:
            "TruthLens সম্পর্কে",

        privacyPolicy:
            "গোপনীয়তা নীতি",


        /* -------------------------
           HOME PAGE
        ------------------------- */

        aiBadge:
            "🛡️ AI-চালিত সংবাদ যাচাইকরণ",

        heroTitle:
            "সংবাদের",

        heroTitleSpan:
            "পেছনের সত্যটি দেখুন।",

        heroDescription:
            "TruthLens বুদ্ধিমান বিশ্লেষণের মাধ্যমে সম্ভাব্য বিভ্রান্তিকর বা ভুয়া সংবাদ শনাক্ত করতে সাহায্য করে।",

        checkNewsLabel:
            "একটি সংবাদ নিবন্ধ বা বার্তা যাচাই করুন",

        newsText:
            "📝 সংবাদ টেক্সট",

        newsLink:
            "🔗 সংবাদ লিংক",

        newsTextPlaceholder:
            "আপনার সংবাদ নিবন্ধ, বার্তা বা দাবি এখানে পেস্ট করুন...",

        newsLinkPlaceholder:
            "সংবাদ নিবন্ধের লিংক এখানে পেস্ট করুন...",

        checkNews:
            "🔍 সংবাদ যাচাই করুন",

        resultPlaceholder:
            "আপনার যাচাইয়ের ফলাফল এখানে প্রদর্শিত হবে।",

        footer:
    "© 2026 TruthLens • বিশ্বাস করার আগে যাচাই করতে সহায়তা করে।",


/* =====================================================
   REGISTER PAGE
===================================================== */

registerIntroTitle:
    "TruthLens-এ আপনাকে স্বাগতম",

registerBrandBadge:
    "বিশ্বস্ত AI যাচাইকরণ",

registerBrandDescription:
    "তথ্য যাচাই করুন, তথ্য অনুসন্ধান করুন এবং আত্মবিশ্বাসের সাথে অবগত থাকুন।",

registerFeature1:
    "✓ AI-চালিত সংবাদ বিশ্লেষণ",

registerFeature2:
    "✓ দ্রুত এবং সহজ যাচাইকরণ",

registerFeature3:
    "✓ বিশ্বস্ত তথ্যের জন্য ডিজাইন করা",

registerTitle:
    "অ্যাকাউন্ট তৈরি করুন",

registerSubtitle:
    "আপনার TruthLens অ্যাকাউন্ট তৈরি করুন",

fullName:
    "পুরো নাম",

emailAddress:
    "ইমেল ঠিকানা",

password:
    "পাসওয়ার্ড",

confirmPassword:
    "পাসওয়ার্ড নিশ্চিত করুন",

registerButton:
    "অ্যাকাউন্ট তৈরি করুন",

alreadyHaveAccount:
    "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",

login:
    "লগইন",

registerFullNamePlaceholder:
    "আপনার পুরো নাম লিখুন",

registerEmailPlaceholder:
    "you@example.com",

registerPasswordPlaceholder:
    "একটি পাসওয়ার্ড তৈরি করুন",

registerConfirmPasswordPlaceholder:
    "আপনার পাসওয়ার্ড নিশ্চিত করুন",

registerLanguageLabel:
    "ভাষা"

    },


};


/* =========================================================
   SUPPORT TRANSLATIONS
========================================================= */

const supportTranslations = {

    English: {

        help: {

            title:
                "Help & FAQ",

            intro:
                "Find answers to common questions about TruthLens.",

            items: [

                [
                    "What is TruthLens?",
                    "TruthLens is an AI-powered news verification tool that analyzes news text and links and provides a model-based classification."
                ],

                [
                    "How do I check a news article?",
                    "Go to the Home page, choose News Text or News Link, enter the information, and click Check News."
                ],

                [
                    "Is the result always correct?",
                    "No. TruthLens provides an AI/ML classification and should not be treated as absolute proof of whether information is true or false."
                ],

                [
                    "Can I change my profile information?",
                    "Yes. Use Edit Profile in the Settings page to update your name and email information."
                ],

                [
                    "Can I use TruthLens as a guest?",
                    "Yes. Select Continue as Guest on the Login page to use TruthLens without signing in."
                ]

            ]

        },


        about: {

            title:
                "About TruthLens",

            intro:
                "TruthLens is designed to help users examine news before trusting or sharing it.",

            items: [

                [
                    "What technology does TruthLens use?",
                    "TruthLens uses a web frontend, a FastAPI backend and a machine-learning news classification system."
                ],

                [
                    "Can TruthLens be wrong?",
                    "Yes. The system may provide incorrect or uncertain classifications. Important information should always be independently verified."
                ],

                [
                    "What is the goal of TruthLens?",
                    "The goal is to make information checking simple, accessible, and easy to understand."
                ],

                [
                    "Version",
                    "TruthLens • 2026"
                ]

            ]

        },


        privacy: {

            title:
                "Privacy Policy",

            intro:
                "This section explains how the current TruthLens application handles information.",

            items: [

                [
                    "Does TruthLens store my news text?",
                    "The current frontend sends submitted content to the configured TruthLens backend for analysis. Browser local storage is used for selected application preferences."
                ],

                [
                    "What is stored in my browser?",
                    "Theme, language, notification preferences, notification history and demo profile information may be stored in localStorage."
                ],

                [
                    "Is my login a real account?",
                    "The current login is a frontend demonstration. User profile information is stored locally in the browser and is not a complete server-side authentication system."
                ],

                [
                    "Does TruthLens use browser notifications?",
                    "If notifications are enabled and browser permission is granted, TruthLens can show browser notifications after analysis or security events."
                ],

                [
                    "Important Notice",
                    "TruthLens provides machine-learning based analysis. Results should not be considered absolute proof of whether information is true or false."
                ],

                [
                    "Privacy Updates",
                    "This privacy information may be updated as TruthLens develops new features and functionality."
                ]

            ]

        }

    },


    Hindi: {

        help: {

            title:
                "सहायता और सामान्य प्रश्न",

            intro:
                "TruthLens के बारे में सामान्य प्रश्नों के उत्तर यहां देखें।",

            items: [

                [
                    "TruthLens क्या है?",
                    "TruthLens एक AI-powered news verification tool है जो समाचार टेक्स्ट और लिंक का विश्लेषण करके model-based classification प्रदान करता है।"
                ],

                [
                    "मैं किसी समाचार लेख की जांच कैसे कर सकता हूं?",
                    "Home पेज पर जाएं, News Text या News Link चुनें, जानकारी दर्ज करें और Check News पर क्लिक करें।"
                ],

                [
                    "क्या परिणाम हमेशा सही होता है?",
                    "नहीं। TruthLens AI/ML classification प्रदान करता है और इसे किसी जानकारी के सही या गलत होने का पूर्ण प्रमाण नहीं माना जाना चाहिए।"
                ],

                [
                    "क्या मैं अपनी profile information बदल सकता हूं?",
                    "हां। Settings पेज में Edit Profile का उपयोग करके अपना नाम और email information अपडेट कर सकते हैं।"
                ],

                [
                    "क्या मैं TruthLens को Guest के रूप में उपयोग कर सकता हूं?",
                    "हां। Login पेज पर Continue as Guest चुनकर आप बिना sign in किए TruthLens का उपयोग कर सकते हैं।"
                ]

            ]

        },


        about: {

            title:
                "TruthLens के बारे में",

            intro:
                "TruthLens को समाचार पर भरोसा करने या उसे साझा करने से पहले जांच में सहायता करने के लिए बनाया गया है।",

            items: [

                [
                    "TruthLens किस तकनीक का उपयोग करता है?",
                    "TruthLens वेब फ्रंटएंड, FastAPI बैकएंड और मशीन लर्निंग आधारित समाचार वर्गीकरण प्रणाली का उपयोग करता है।"
                ],

                [
                    "क्या TruthLens गलत हो सकता है?",
                    "हां। सिस्टम गलत या अनिश्चित वर्गीकरण दे सकता है। महत्वपूर्ण जानकारी को स्वतंत्र रूप से सत्यापित करना चाहिए।"
                ],

                [
                    "TruthLens का उद्देश्य क्या है?",
                    "TruthLens का उद्देश्य जानकारी की जांच को सरल, सुलभ और आसानी से समझने योग्य बनाना है।"
                ],

                [
                    "संस्करण",
                    "TruthLens • 2026"
                ]

            ]

        },


        privacy: {

            title:
                "गोपनीयता नीति",

            intro:
                "यह भाग बताता है कि वर्तमान TruthLens एप्लिकेशन जानकारी को कैसे संभालता है।",

            items: [

                [
                    "क्या TruthLens मेरा समाचार टेक्स्ट सुरक्षित रखता है?",
                    "वर्तमान फ्रंटएंड विश्लेषण के लिए सामग्री को configured TruthLens backend पर भेजता है। कुछ preferences browser localStorage में रखी जाती हैं।"
                ],

                [
                    "मेरे browser में क्या save होता है?",
                    "Theme, language, notification preferences, notification history और demo profile जैसी जानकारी localStorage में रखी जा सकती है।"
                ],

                [
                    "क्या मेरा login एक वास्तविक account है?",
                    "वर्तमान login एक frontend demonstration है। Profile information browser में locally save होती है और यह पूर्ण server-side authentication system नहीं है।"
                ],

                [
                    "क्या TruthLens browser notifications इस्तेमाल करता है?",
                    "यदि notifications चालू हैं और browser permission दी गई है, तो TruthLens analysis या security events के बाद notification दिखा सकता है।"
                ],

                [
                    "महत्वपूर्ण सूचना",
                    "TruthLens मशीन-लर्निंग आधारित विश्लेषण प्रदान करता है। परिणामों को किसी जानकारी के सत्य या असत्य होने का पूर्ण प्रमाण नहीं माना जाना चाहिए।"
                ],

                [
                    "गोपनीयता अपडेट",
                    "जैसे-जैसे TruthLens में नए features और functionality विकसित होंगे, यह privacy information अपडेट की जा सकती है।"
                ]

            ]

        }

    },


    Bengali: {

        help: {

            title:
                "সহায়তা ও সাধারণ প্রশ্ন",

            intro:
                "TruthLens সম্পর্কে সাধারণ প্রশ্নের উত্তর এখানে দেখুন।",

            items: [

                [
                    "TruthLens কী?",
                    "TruthLens একটি AI-powered news verification tool যা সংবাদ টেক্সট এবং লিংক বিশ্লেষণ করে model-based classification প্রদান করে।"
                ],

                [
                    "আমি কীভাবে একটি সংবাদ নিবন্ধ পরীক্ষা করব?",
                    "Home পেজে যান, News Text অথবা News Link নির্বাচন করুন, তথ্য লিখুন এবং Check News-এ ক্লিক করুন।"
                ],

                [
                    "ফলাফল কি সবসময় সঠিক হয়?",
                    "না। TruthLens AI/ML classification প্রদান করে এবং কোনো তথ্য সত্য বা মিথ্যা হওয়ার চূড়ান্ত প্রমাণ হিসেবে এটিকে বিবেচনা করা উচিত নয়।"
                ],

                [
                    "আমি কি আমার profile information পরিবর্তন করতে পারি?",
                    "হ্যাঁ। Settings পেজে Edit Profile ব্যবহার করে আপনার নাম এবং email information আপডেট করতে পারেন।"
                ],

                [
                    "আমি কি Guest হিসেবে TruthLens ব্যবহার করতে পারি?",
                    "হ্যাঁ। Login পেজে Continue as Guest নির্বাচন করে sign in না করেই TruthLens ব্যবহার করতে পারেন।"
                ]

            ]

        },


        about: {

            title:
                "TruthLens সম্পর্কে",

            intro:
                "TruthLens তৈরি করা হয়েছে সংবাদে বিশ্বাস বা শেয়ার করার আগে তা পরীক্ষা করতে সাহায্য করার জন্য।",

            items: [

                [
                    "TruthLens কোন প্রযুক্তি ব্যবহার করে?",
                    "TruthLens web frontend, FastAPI backend এবং machine-learning news classification system ব্যবহার করে।"
                ],

                [
                    "TruthLens কি ভুল করতে পারে?",
                    "হ্যাঁ। সিস্টেম ভুল বা অনিশ্চিত classification দিতে পারে। গুরুত্বপূর্ণ তথ্য স্বাধীনভাবে যাচাই করা উচিত।"
                ],

                [
                    "TruthLens-এর উদ্দেশ্য কী?",
                    "TruthLens-এর লক্ষ্য হলো তথ্য যাচাইকে সহজ, সবার জন্য ব্যবহারযোগ্য এবং সহজে বোঝার মতো করা।"
                ],

                [
                    "সংস্করণ",
                    "TruthLens • 2026"
                ]

            ]

        },


        privacy: {

            title:
                "গোপনীয়তা নীতি",

            intro:
                "বর্তমান TruthLens application কীভাবে তথ্য পরিচালনা করে তা এখানে ব্যাখ্যা করা হয়েছে।",

            items: [

                [
                    "TruthLens কি আমার সংবাদ টেক্সট সংরক্ষণ করে?",
                    "বর্তমান frontend বিশ্লেষণের জন্য submitted content configured TruthLens backend-এ পাঠায়। কিছু preference browser localStorage-এ রাখা হয়।"
                ],

                [
                    "আমার browser-এ কী সংরক্ষণ করা হয়?",
                    "Theme, language, notification preferences, notification history এবং demo profile information localStorage-এ সংরক্ষণ করা হতে পারে।"
                ],

                [
                    "আমার login কি একটি আসল account?",
                    "বর্তমান login একটি frontend demonstration। Profile information browser-এ locally সংরক্ষণ করা হয় এবং এটি সম্পূর্ণ server-side authentication system নয়।"
                ],

                [
                    "TruthLens কি browser notifications ব্যবহার করে?",
                    "Notifications চালু এবং browser permission দেওয়া থাকলে TruthLens analysis বা security event-এর পরে notification দেখাতে পারে।"
                ],

                [
                    "গুরুত্বপূর্ণ বিজ্ঞপ্তি",
                    "TruthLens machine-learning ভিত্তিক analysis প্রদান করে। ফলাফলকে কোনো তথ্য সত্য বা মিথ্যা হওয়ার চূড়ান্ত প্রমাণ হিসেবে বিবেচনা করা উচিত নয়।"
                ],

                [
                    "গোপনীয়তা আপডেট",
                    "TruthLens নতুন features এবং functionality তৈরি করার সাথে সাথে এই privacy information আপডেট করা হতে পারে।"
                ]

            ]

        }

    }

};

/* =========================================================
   SUPPORT LANGUAGE
========================================================= */

function applySupportLanguage(language) {

    const selected =
        supportTranslations[language] ||
        supportTranslations.English;


    /* =====================================================
       HELP, ABOUT AND PRIVACY MODALS
    ===================================================== */

    [
        ["helpModal", selected.help],
        ["aboutModal", selected.about],
        ["privacyModal", selected.privacy]

    ].forEach(function ([modalId, data]) {

        const modal =
            document.getElementById(modalId);


        if (!modal || !data) {
            return;
        }


        /* =================================================
           MODAL TITLE
        ================================================= */

        const heading =
            modal.querySelector("h2");

        if (heading && data.title) {
            heading.textContent =
                data.title;
        }


        /* =================================================
           MODAL INTRODUCTION
        ================================================= */

        const intro =
            modal.querySelector(
                ".support-modal-intro"
            );

        if (intro && data.intro) {
            intro.textContent =
                data.intro;
        }


        /* =================================================
           FAQ ITEMS
        ================================================= */

        const faqItems =
            modal.querySelectorAll(
                ".faq-item"
            );


        faqItems.forEach(function (item, index) {

            const itemData =
                data.items &&
                data.items[index];


            if (!itemData) {
                return;
            }


            const question =
                item.querySelector("h3");


            const answer =
                item.querySelector("p");


            if (question) {

                question.textContent =
                    itemData[0];

            }


            if (answer) {

                answer.textContent =
                    itemData[1];

            }

        });


        /* =================================================
           IF A TRANSLATION HAS MORE FAQ ITEMS THAN THE HTML,
           CREATE THE MISSING ITEMS AUTOMATICALLY
        ================================================= */

        const existingCount =
            faqItems.length;


        const translatedItems =
            data.items || [];


        if (
            translatedItems.length >
            existingCount
        ) {

            const content =
                modal.querySelector(
                    ".support-modal-content"
                );


            if (content) {

                for (
                    let i = existingCount;
                    i < translatedItems.length;
                    i++
                ) {

                    const itemData =
                        translatedItems[i];


                    const faqItem =
                        document.createElement("div");

                    faqItem.className =
                        "faq-item";


                    const question =
                        document.createElement("h3");

                    question.textContent =
                        itemData[0];


                    const answer =
                        document.createElement("p");

                    answer.textContent =
                        itemData[1];


                    faqItem.appendChild(
                        question
                    );

                    faqItem.appendChild(
                        answer
                    );


                    content.appendChild(
                        faqItem
                    );

                }

            }

        }

    });

}

/* =========================================================
   APPLY LANGUAGE
========================================================= */

function applyLanguage(language) {

    const selected =
        translations[language] ||
        translations.English;


    /* ---------------------------------------------
       Translate all data-i18n elements
    --------------------------------------------- */

    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            function (element) {

                const key =
                    element.dataset.i18n;


                if (
                    selected[key] !==
                    undefined
                ) {

                    element.textContent =
                        selected[key];

                }

            }
        );


    /* ---------------------------------------------
       Translate Home placeholders
    --------------------------------------------- */

    const textInput =
        document.getElementById(
            "newsText"
        );


    const linkInput =
        document.getElementById(
            "newsLink"
        );


    if (
        textInput &&
        selected.newsTextPlaceholder
    ) {

        textInput.placeholder =
            selected.newsTextPlaceholder;

    }


    if (
        linkInput &&
        selected.newsLinkPlaceholder
    ) {

        linkInput.placeholder =
            selected.newsLinkPlaceholder;

    }


    /* ---------------------------------------------
       Support modals
    --------------------------------------------- */

    applySupportLanguage(
        language
    );


 /* ---------------------------------------------
   Notifications
--------------------------------------------- */

renderTruthLensNotifications();


/* =========================================================
   REGISTER PAGE LANGUAGE
========================================================= */

const registerNameInput =
    document.getElementById("registerName");

const registerEmailInput =
    document.getElementById("registerEmail");

const registerPasswordInput =
    document.getElementById("registerPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const registerLanguageLabel =
    document.querySelector(
        'label[for="registerLanguage"]'
    );

const registerBrandBadge =
    document.querySelector(
        ".register-trust span"
    );

const registerBrandDescription =
    document.querySelector(
        ".register-intro > p"
    );

const registerFeatures =
    document.querySelectorAll(
        ".register-features div"
    );


if (registerNameInput) {
    registerNameInput.placeholder =
        selected.registerFullNamePlaceholder;
}

if (registerEmailInput) {
    registerEmailInput.placeholder =
        selected.registerEmailPlaceholder;
}

if (registerPasswordInput) {
    registerPasswordInput.placeholder =
        selected.registerPasswordPlaceholder;
}

if (confirmPasswordInput) {
    confirmPasswordInput.placeholder =
        selected.registerConfirmPasswordPlaceholder;
}

if (registerLanguageLabel) {
    registerLanguageLabel.textContent =
        selected.registerLanguageLabel;
}

if (registerBrandBadge) {
    registerBrandBadge.textContent =
        selected.registerBrandBadge;
}

if (registerBrandDescription) {
    registerBrandDescription.textContent =
        selected.registerBrandDescription;
}

if (registerFeatures.length >= 3) {
    registerFeatures[0].textContent =
        selected.registerFeature1;

    registerFeatures[1].textContent =
        selected.registerFeature2;

    registerFeatures[2].textContent =
        selected.registerFeature3;
}

document
    .querySelectorAll(
        'a[href="register.html"]'
    )
    .forEach(function (link) {
        link.textContent =
            selected.navRegister;
    });

}


/* =========================================================
   PROFILE
========================================================= */

const profileName =
    document.getElementById(
        "profileName"
    );


const profileEmail =
    document.getElementById(
        "profileEmail"
    );


const profileAvatar =
    document.querySelector(
        ".profile-avatar"
    );
const profilePictureInput =
    document.getElementById("profilePictureInput");

function getSavedUser() {

    try {

    const saved =
        sessionStorage.getItem(
            "truthlensUser"
        ) ||
        localStorage.getItem(
            "truthlensUser"
        );


    if (!saved) {

        return null;

    }


    return JSON.parse(saved);

} catch (error) {

    console.error(
        "Unable to read user:",
        error
    );


    return null;

}
}

function clearProfileDisplay() {

    const language =
        getCurrentLanguage();


    const messages = {

        English: {

            name:
                "No user logged in",

            email:
                "Please log in to view your profile"

        },


        Hindi: {

            name:
                "कोई उपयोगकर्ता लॉग इन नहीं है",

            email:
                "अपनी प्रोफ़ाइल देखने के लिए लॉग इन करें"

        },


        Bengali: {

            name:
                "কোনও ব্যবহারকারী লগ ইন করেননি",

            email:
                "আপনার প্রোফাইল দেখতে লগ ইন করুন"

        }

    };


    const selected =
        messages[language] ||
        messages.English;


    if (profileName) {

        profileName.textContent =
            selected.name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            selected.email;

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            "?";

    }

}


function displayUser(user) {

    /* =====================================================
       NO USER LOGGED IN
    ===================================================== */

    if (!user) {

        const currentLanguage =
            getCurrentLanguage();


        const noUserMessages = {

            English: {

                name:
                    "No user logged in",

                email:
                    "Please log in to view your profile"

            },


            Hindi: {

                name:
                    "कोई उपयोगकर्ता लॉग इन नहीं है",

                email:
                    "अपनी प्रोफ़ाइल देखने के लिए लॉग इन करें"

            },


            Bengali: {

                name:
                    "কোনও ব্যবহারকারী লগ ইন করেননি",

                email:
                    "আপনার প্রোফাইল দেখতে লগ ইন করুন"

            }

        };


        const messages =
            noUserMessages[
                currentLanguage
            ] ||
            noUserMessages.English;


        if (profileName) {

            profileName.textContent =
                messages.name;

        }


        if (profileEmail) {

            profileEmail.textContent =
                messages.email;

        }


        if (profileAvatar) {

            profileAvatar.textContent =
                "?";

        }


        return;

    }


    /* =====================================================
       USER IS LOGGED IN
    ===================================================== */

    if (profileName) {

        profileName.textContent =
            user.name ||
            "Guest User";

    }


    if (profileEmail) {

        profileEmail.textContent =
            user.email ||
            "Guest";

    }


    if (profileAvatar) {

        const name =
            user.name ||
            "Guest User";


        if (user.profilePicture) {

    profileAvatar.innerHTML =
        `<img src="${user.profilePicture}" alt="Profile Picture">`;

} else {

    profileAvatar.textContent =
        user.name.charAt(0).toUpperCase();

}

    }

}


/* =========================================================
   LANGUAGE SELECTOR
========================================================= */

const savedLanguage =
    localStorage.getItem(
        "language"
    ) || "English";


if (languageSelect) {

    languageSelect.value =
        savedLanguage;


    languageSelect.addEventListener(
        "change",
        function () {

            const selectedLanguage =
                this.value;


            localStorage.setItem(
                "language",
                selectedLanguage
            );


            /* -----------------------------------------
               Apply language to entire application
            ----------------------------------------- */

            applyLanguage(
                selectedLanguage
            );


            /* -----------------------------------------
               Refresh profile immediately
               without page refresh
            ----------------------------------------- */

            const currentUser =
                getSavedUser();


            displayUser(
                currentUser
            );

        }
    );
}
/* =========================================================
   REGISTER LANGUAGE SELECTOR
========================================================= */

if (registerLanguage) {

    registerLanguage.value =
        savedLanguage;

    registerLanguage.addEventListener(
        "change",
        function () {

            const selectedLanguage =
                this.value;

            localStorage.setItem(
                "language",
                selectedLanguage
            );

            applyLanguage(
                selectedLanguage
            );

        }
    );

}

/* =========================================================
   LOAD SAVED USER + VERIFY BACKEND SESSION
========================================================= */

async function loadAuthenticatedUser() {

    const savedUser =
        getSavedUser();

    const accessToken =
        sessionStorage.getItem(
            "truthlensAccessToken"
        ) ||
        localStorage.getItem(
            "truthlensAccessToken"
        );

    /* -----------------------------------------
       Guest / no backend token
    ----------------------------------------- */

    if (!accessToken) {

        if (savedUser) {

            displayUser(
                savedUser
            );

        } else {

            displayUser(
                null
            );

        }

        return;

    }

    /* -----------------------------------------
       Verify real backend login
    ----------------------------------------- */

    const verifiedUser =
        await verifyBackendSession();

   if (verifiedUser) {

    /* -----------------------------------------
       Save verified backend user
    ----------------------------------------- */

    const verifiedUserData =
        JSON.stringify(
            verifiedUser
        );

    if (
        sessionStorage.getItem(
            "truthlensAccessToken"
        )
    ) {

        sessionStorage.setItem(
            "truthlensUser",
            verifiedUserData
        );

    } else {

        localStorage.setItem(
            "truthlensUser",
            verifiedUserData
        );
    }

    /* -----------------------------------------
       Display verified user
    ----------------------------------------- */

    displayUser(
        verifiedUser
    );

} else {

        /* -------------------------------------
           Invalid/expired token
           Clear authentication information
        ------------------------------------- */

        localStorage.removeItem(
            "truthlensAccessToken"
        );

        sessionStorage.removeItem(
            "truthlensAccessToken"
        );

        localStorage.removeItem(
            "truthlensUser"
        );

        sessionStorage.removeItem(
            "truthlensUser"
        );

        displayUser(
            null
        );

    }

}

loadAuthenticatedUser();
/* =========================================================
   SETTINGS PAGE AUTHENTICATION GUARD
========================================================= */

async function protectSettingsPage() {

    const isSettingsPage =
        window.location.pathname.endsWith(
            "settings.html"
        );

    if (!isSettingsPage) {
        return;
    }

    const accessToken =
        sessionStorage.getItem(
            "truthlensAccessToken"
        ) ||
        localStorage.getItem(
            "truthlensAccessToken"
        );


    /* -----------------------------------------
       Guest user
       Settings is not accessible
    ----------------------------------------- */

    const savedUser =
        getSavedUser();

    if (
        savedUser &&
        savedUser.isGuest === true
    ) {

        window.location.href =
            "index.html";

        return;
    }



    /* -----------------------------------------
       No real login token
    ----------------------------------------- */

    if (!accessToken) {

        window.location.href =
            "register.html";

        return;
    }

    /* -----------------------------------------
       Verify backend session
    ----------------------------------------- */

    const verifiedUser =
        await verifyBackendSession();

    if (!verifiedUser) {

        localStorage.removeItem(
            "truthlensAccessToken"
        );

        sessionStorage.removeItem(
            "truthlensAccessToken"
        );

        localStorage.removeItem(
            "truthlensUser"
        );

        sessionStorage.removeItem(
            "truthlensUser"
        );

        window.location.href =
            "register.html";

        return;
    }
}
/* =========================================================
   HOME PAGE ACCESS
   Registered users + Guest users
========================================================= */

async function protectHomePage() {

    const isHomePage =
        window.location.pathname.endsWith("index.html") ||
        window.location.pathname === "/" ||
        window.location.pathname === "";

    if (!isHomePage) {
        return;
    }

    /* -----------------------------------------
       Check saved user
    ----------------------------------------- */

    const savedUser =
        getSavedUser();

    /* -----------------------------------------
       Guest user
       Allow Home + News Analysis
    ----------------------------------------- */

    if (
        savedUser &&
        savedUser.isGuest === true
    ) {
        return;
    }

    /* -----------------------------------------
       Real logged-in user
       Verify backend session
    ----------------------------------------- */

    const accessToken =
        sessionStorage.getItem(
            "truthlensAccessToken"
        ) ||
        localStorage.getItem(
            "truthlensAccessToken"
        );

    if (!accessToken) {

        window.location.href =
            "register.html";

        return;
    }

    const verifiedUser =
        await verifyBackendSession();

    if (!verifiedUser) {

        window.location.href =
            "register.html";

        return;
    }
}

protectHomePage();

protectSettingsPage();
/* =========================================================
   LOGIN PAGE AUTHENTICATION GUARD
========================================================= */

async function protectLoginPage() {

    const isLoginPage =
        window.location.pathname.endsWith(
            "login.html"
        );

    if (!isLoginPage) {
        return;
    }
/* -----------------------------------------
   Guest users cannot access Login
   → Register page
----------------------------------------- */

const savedUser =
    getSavedUser();

if (
    savedUser &&
    savedUser.isGuest === true
) {

    window.location.href =
        "register.html";

    return;
}

    /* -----------------------------------------
       Check if user intentionally clicked Login
       from Register page
    ----------------------------------------- */

    const loginIntent =
        sessionStorage.getItem(
            "truthlensLoginIntent"
        ) === "true";

    /* -----------------------------------------
       Check if user has registered before
    ----------------------------------------- */

    const hasRegistered =
        localStorage.getItem(
            "truthlensRegistered"
        ) === "true";

    /* -----------------------------------------
       Never registered and did not click
       Login intentionally
       → Register page
    ----------------------------------------- */

    if (!hasRegistered && !loginIntent) {

        window.location.href =
            "register.html";

        return;
    }

    /* -----------------------------------------
       Check existing login token
    ----------------------------------------- */

    const accessToken =
        sessionStorage.getItem(
            "truthlensAccessToken"
        ) ||
        localStorage.getItem(
            "truthlensAccessToken"
        );

    /* -----------------------------------------
       No token
       → Stay on Login page
    ----------------------------------------- */

    if (!accessToken) {
        return;
    }

    /* -----------------------------------------
       Verify backend session
    ----------------------------------------- */

    const verifiedUser =
        await verifyBackendSession();

    /* -----------------------------------------
       Already logged in
       → Home
    ----------------------------------------- */

    if (verifiedUser) {

        window.location.href =
            "index.html";

        return;
    }
}

protectLoginPage();

/* =========================================================
   EDIT PROFILE
========================================================= */

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );
console.log(
    "EDIT BUTTON:",
    editProfileButton
);

const editProfileTranslations = {

    English: {

        loginFirst:
            "Please log in first to edit your profile.",

        enterName:
            "Enter your name:",

        nameEmpty:
            "Name cannot be empty.",

        enterEmail:
            "Enter your email:",

        emailEmpty:
            "Email cannot be empty.",

        invalidEmail:
            "Please enter a valid email address.",

        updating:
            "Updating profile...",

        success:
            "Profile updated successfully!",

        updateFailed:
            "Unable to update your profile."

    },


    Hindi: {

        loginFirst:
            "अपनी प्रोफ़ाइल संपादित करने के लिए पहले लॉग इन करें।",

        enterName:
            "अपना नाम दर्ज करें:",

        nameEmpty:
            "नाम खाली नहीं हो सकता।",

        enterEmail:
            "अपना ईमेल दर्ज करें:",

        emailEmpty:
            "ईमेल खाली नहीं हो सकता।",

        invalidEmail:
            "कृपया एक मान्य ईमेल पता दर्ज करें।",

        updating:
            "प्रोफ़ाइल अपडेट हो रही है...",

        success:
            "प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!",

        updateFailed:
            "प्रोफ़ाइल अपडेट नहीं हो सकी।"

    },


    Bengali: {

        loginFirst:
            "আপনার প্রোফাইল সম্পাদনা করতে প্রথমে লগ ইন করুন।",

        enterName:
            "আপনার নাম লিখুন:",

        nameEmpty:
            "নাম খালি রাখা যাবে না।",

        enterEmail:
            "আপনার ইমেল লিখুন:",

        emailEmpty:
            "ইমেল খালি রাখা যাবে না।",

        invalidEmail:
            "অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন।",

        updating:
            "প্রোফাইল আপডেট হচ্ছে...",

        success:
            "প্রোফাইল সফলভাবে আপডেট হয়েছে!",

        updateFailed:
            "প্রোফাইল আপডেট করা যায়নি।"

    }

};

console.log("EDIT PROFILE SECTION REACHED");

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        async function () {

            console.log(
                "Edit Profile button clicked"
            );


            const language =
                getCurrentLanguage();


            const messages =
                editProfileTranslations[
                    language
                ] ||
                editProfileTranslations.English;


            /* -----------------------------------------
               Get current user
            ----------------------------------------- */

            const currentUser =
                getSavedUser();


            /* -----------------------------------------
               No user logged in
            ----------------------------------------- */

            if (!currentUser) {

                alert(
                    messages.loginFirst
                );

                return;
            }


            /* -----------------------------------------
               Get backend access token
            ----------------------------------------- */

            const accessToken =
                sessionStorage.getItem(
                    "truthlensAccessToken"
                ) ||
                localStorage.getItem(
                    "truthlensAccessToken"
                );


            /* -----------------------------------------
               Real account required
            ----------------------------------------- */

            if (
                !accessToken ||
                currentUser.isGuest
            ) {

                alert(
                    messages.loginFirst
                );

                return;
            }


            /* -----------------------------------------
               Ask for new name
            ----------------------------------------- */

            const newName =
                prompt(
                    messages.enterName,
                    currentUser.name || ""
                );


            if (newName === null) {

                return;
            }


            const cleanedName =
                newName.trim();


            /* -----------------------------------------
               Validate name
            ----------------------------------------- */

            if (cleanedName === "") {

                alert(
                    messages.nameEmpty
                );

                return;
            }


            /* -----------------------------------------
               Ask for new email
            ----------------------------------------- */

            const newEmail =
                prompt(
                    messages.enterEmail,
                    currentUser.email || ""
                );


            if (newEmail === null) {

                return;
            }


            const cleanedEmail =
                newEmail.trim();


            /* -----------------------------------------
               Validate email
            ----------------------------------------- */

            if (cleanedEmail === "") {

                alert(
                    messages.emailEmpty
                );

                return;
            }


            if (
                !cleanedEmail.includes("@") ||
                !cleanedEmail.includes(".")
            ) {

                alert(
                    messages.invalidEmail
                );

                return;
            }


            /* -----------------------------------------
               Show update message
            ----------------------------------------- */

            console.log(
                messages.updating
            );


            try {

                /* -------------------------------------
                   Update backend database
                ------------------------------------- */

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/profile",
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    "Bearer " +
                                    accessToken
                            },

                            body:
                                JSON.stringify({
                                    name:
                                        cleanedName,

                                    email:
                                        cleanedEmail
                                })
                        }
                    );


               const data =
    await response.json();

if (data.access_token) {

    if (
        sessionStorage.getItem(
            "truthlensAccessToken"
        )
    ) {

        sessionStorage.setItem(
            "truthlensAccessToken",
            data.access_token
        );

    } else {

        localStorage.setItem(
            "truthlensAccessToken",
            data.access_token
        );
    }
}


                /* -------------------------------------
                   Backend error
                ------------------------------------- */

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        messages.updateFailed
                    );
                }


                /* -------------------------------------
                   Get updated backend user
                ------------------------------------- */

                const updatedUser =
                    data.user;


                if (!updatedUser) {

                    throw new Error(
                        messages.updateFailed
                    );
                }


                const userData = {

                    id:
                        updatedUser.id,

                    name:
                        updatedUser.name,

                    email:
                        updatedUser.email,

                    isGuest:
                        false,

                    profilePicture:
                        currentUser.profilePicture ||
                        null
                };


                /* -------------------------------------
                   Save updated user
                ------------------------------------- */

                const userJSON =
                    JSON.stringify(
                        userData
                    );


                if (
                    sessionStorage.getItem(
                        "truthlensAccessToken"
                    )
                ) {

                    sessionStorage.setItem(
                        "truthlensUser",
                        userJSON
                    );

                } else {

                    localStorage.setItem(
                        "truthlensUser",
                        userJSON
                    );
                }


                /* -------------------------------------
                   Update profile immediately
                ------------------------------------- */

                displayUser(
                    userData
                );


                /* -------------------------------------
                   Success message
                ------------------------------------- */

                alert(
                    messages.success
                );


                /* -------------------------------------
                   Profile update notification
                ------------------------------------- */

                const profileNotificationTexts = {

                    English: {

                        title:
                            "Profile Updated",

                        message:
                            "Your TruthLens profile has been updated successfully."

                    },


                    Hindi: {

                        title:
                            "प्रोफ़ाइल अपडेट हुई",

                        message:
                            "आपकी TruthLens प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।"

                    },


                    Bengali: {

                        title:
                            "প্রোফাইল আপডেট হয়েছে",

                        message:
                            "আপনার TruthLens প্রোফাইল সফলভাবে আপডেট হয়েছে।"

                    }

                };


                const profileNotification =
                    profileNotificationTexts[
                        language
                    ] ||
                    profileNotificationTexts.English;


                addTruthLensNotification(
                    profileNotification.title,
                    profileNotification.message,
                    "profile"
                );


                sendBrowserNotification(
                    profileNotification.title,
                    profileNotification.message
                );


            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );


                alert(
                    error.message ||
                    messages.updateFailed
                );
            }
        }
    );
}


/* =========================================================
   NOTIFICATION SETTINGS
========================================================= */

const analysisNotifications =
    document.getElementById(
        "analysisNotifications"
    );


const securityNotifications =
    document.getElementById(
        "securityNotifications"
    );


const notificationSettingTranslations = {

    English: {

        analysisEnabledTitle:
            "Analysis Notifications Enabled",

        analysisEnabledMessage:
            "You will receive notifications after news analysis.",
            analysisDisabledTitle:
    "Analysis Notifications Disabled",

analysisDisabledMessage:
    "You will no longer receive notifications after news analysis.",

        securityEnabledTitle:
            "Security Notifications Enabled",

        securityEnabledMessage:
            "Important TruthLens account and security alerts are enabled.",
            securityDisabledTitle:
    "Security Notifications Disabled",

securityDisabledMessage:
    "Important TruthLens account and security alerts are disabled.",

        browserBlocked:
            "Notifications are blocked in your browser. Please allow notifications for TruthLens in browser settings."

    },


    Hindi: {

        analysisEnabledTitle:
            "विश्लेषण सूचनाएं सक्षम हैं",

        analysisEnabledMessage:
            "समाचार विश्लेषण के बाद आपको सूचनाएं प्राप्त होंगी।",
            analysisDisabledTitle:
    "विश्लेषण सूचनाएं बंद हैं",

analysisDisabledMessage:
    "समाचार विश्लेषण के बाद आपको सूचनाएं प्राप्त नहीं होंगी।",

        securityEnabledTitle:
            "सुरक्षा सूचनाएं सक्षम हैं",

        securityEnabledMessage:
            "महत्वपूर्ण TruthLens खाता और सुरक्षा अलर्ट सक्षम हैं।",
            securityDisabledTitle:
    "सुरक्षा सूचनाएं बंद हैं",

securityDisabledMessage:
    "महत्वपूर्ण TruthLens खाता और सुरक्षा अलर्ट बंद हैं।",

        browserBlocked:
            "आपके ब्राउज़र में सूचनाएं अवरुद्ध हैं। कृपया ब्राउज़र सेटिंग्स में TruthLens के लिए सूचनाएं अनुमति दें।"

    },


    Bengali: {

        analysisEnabledTitle:
            "বিশ্লেষণ বিজ্ঞপ্তি চালু হয়েছে",

        analysisEnabledMessage:
            "সংবাদ বিশ্লেষণের পরে আপনি বিজ্ঞপ্তি পাবেন।",
            analysisDisabledTitle:
    "বিশ্লেষণ বিজ্ঞপ্তি বন্ধ হয়েছে",

analysisDisabledMessage:
    "সংবাদ বিশ্লেষণের পরে আপনি আর বিজ্ঞপ্তি পাবেন না.",

        securityEnabledTitle:
            "নিরাপত্তা বিজ্ঞপ্তি চালু হয়েছে",

        securityEnabledMessage:
            "গুরুত্বপূর্ণ TruthLens অ্যাকাউন্ট এবং নিরাপত্তা সতর্কতা চালু হয়েছে।",
            securityDisabledTitle:
    "নিরাপত্তা বিজ্ঞপ্তি বন্ধ হয়েছে",

securityDisabledMessage:
    "গুরুত্বপূর্ণ TruthLens অ্যাকাউন্ট এবং নিরাপত্তা সতর্কতা বন্ধ হয়েছে।",

        browserBlocked:
            "আপনার ব্রাউজারে বিজ্ঞপ্তি ব্লক করা আছে। অনুগ্রহ করে ব্রাউজার সেটিংসে TruthLens-এর জন্য বিজ্ঞপ্তি অনুমতি দিন।"

    }

};


function getNotificationSettingText() {

    return (
        notificationSettingTranslations[
            getCurrentLanguage()
        ] ||
        notificationSettingTranslations.English
    );

}


/* =========================================================
   ANALYSIS NOTIFICATION PERMISSION
========================================================= */

async function requestAnalysisNotificationPermission() {

    const granted =
        await requestBrowserNotificationPermission();


    if (!granted) {

        if (analysisNotifications) {

            analysisNotifications.checked =
                false;

        }


        localStorage.setItem(
            "analysisNotifications",
            "false"
        );


        if (
            "Notification" in window &&
            Notification.permission ===
                "denied"
        ) {

            const messages =
                getNotificationSettingText();


            alert(
                messages.browserBlocked
            );

        }

    }


    return granted;

}


/* =========================================================
   ANALYSIS NOTIFICATION TOGGLE
========================================================= */

if (analysisNotifications) {

    analysisNotifications.checked =
        getSavedBoolean(
            "analysisNotifications",
            true
        );


    analysisNotifications.addEventListener(
        "change",
        async function () {

            const enabled =
                this.checked;


            localStorage.setItem(
                "analysisNotifications",
                enabled
                    ? "true"
                    : "false"
            );


           const messages =
    getNotificationSettingText();


if (enabled) {

    const granted =
        await requestAnalysisNotificationPermission();

    if (granted) {

        addTruthLensNotification(
            messages.analysisEnabledTitle,
            messages.analysisEnabledMessage,
            "settings"
        );

    }

} else {

    addTruthLensNotification(
        messages.analysisDisabledTitle,
        messages.analysisDisabledMessage,
        "settings"
    );

}

        }
    );

}


/* =========================================================
   SECURITY NOTIFICATION TOGGLE
========================================================= */

if (securityNotifications) {

    securityNotifications.checked =
        getSavedBoolean(
            "securityNotifications",
            true
        );


    securityNotifications.addEventListener(
        "change",
        function () {

            const enabled =
                this.checked;


            localStorage.setItem(
                "securityNotifications",
                enabled
                    ? "true"
                    : "false"
            );


            const messages =
    getNotificationSettingText();


if (enabled) {

    addTruthLensNotification(
        messages.securityEnabledTitle,
        messages.securityEnabledMessage,
        "security"
    );

} else {

    addTruthLensNotification(
        messages.securityDisabledTitle,
        messages.securityDisabledMessage,
        "security"
    );

}
        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const logoutTranslations = {

    English: {

        confirm:
            "Are you sure you want to log out?"

    },

    Hindi: {

        confirm:
            "क्या आप वाकई लॉग आउट करना चाहते हैं?"

    },


    Bengali: {

        confirm:
            "আপনি কি সত্যিই লগ আউট করতে চান?"

    }

};


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            const language =
                getCurrentLanguage();


            const messages =
                logoutTranslations[
                    language
                ] ||
                logoutTranslations.English;


            const shouldLogout =
                confirm(
                    messages.confirm
                );


            if (!shouldLogout) {

                return;

            }
/* -----------------------------------------
   Logout notification
----------------------------------------- */

if (
    getSavedBoolean(
        "securityNotifications",
        true
    )
) {

    const logoutMessages = {

        English: {

            title:
                "Logged Out",

            message:
                "You have successfully logged out of TruthLens."

        },

        Hindi: {

            title:
                "लॉग आउट हो गया",

            message:
                "आप TruthLens से सफलतापूर्वक लॉग आउट हो गए हैं।"

        },

        Bengali: {

            title:
                "লগ আউট হয়েছে",

            message:
                "আপনি TruthLens থেকে সফলভাবে লগ আউট করেছেন।"

        }

    };


    const selectedLogoutMessages =
        logoutMessages[
            getCurrentLanguage()
        ] ||
        logoutMessages.English;


    addTruthLensNotification(
        selectedLogoutMessages.title,
        selectedLogoutMessages.message,
        "security"
    );

}

            /* -----------------------------------------
               Remove all TruthLens login information
            ----------------------------------------- */

            localStorage.removeItem(
                "truthlensUser"
            );


            localStorage.removeItem(
    "truthlensRememberMe"
);


localStorage.removeItem(
    "truthlensAccessToken"
);


sessionStorage.removeItem(
    "truthlensUser"
);


sessionStorage.removeItem(
    "truthlensRememberMe"
);


sessionStorage.removeItem(
    "truthlensAccessToken"
);

            /* -----------------------------------------
               Clear visible profile
            ----------------------------------------- */

            clearProfileDisplay();


            /* -----------------------------------------
               Mark user as logged out
            ----------------------------------------- */

            localStorage.setItem(
                "truthlensLoggedOut",
                "true"
            );


            /* -----------------------------------------
               Go to login page
            ----------------------------------------- */

            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

/* ---------------------------------------------
   Clear login fields after logout
--------------------------------------------- */

if (
    localStorage.getItem(
        "truthlensLoggedOut"
    ) === "true"
) {

    const loginEmailField =
        document.getElementById(
            "professionalEmail"
        );


    const loginPasswordField =
        document.getElementById(
            "professionalPassword"
        );


    const loginRememberMe =
        document.getElementById(
            "rememberMe"
        );


    if (loginEmailField) {

        loginEmailField.value =
            "";

        loginEmailField.removeAttribute(
            "value"
        );

    }


    if (loginPasswordField) {

        loginPasswordField.value =
            "";

        loginPasswordField.removeAttribute(
            "value"
        );

    }


    if (loginRememberMe) {

        loginRememberMe.checked =
            false;

    }

}


const professionalLoginForm =
    document.getElementById(
        "professionalLoginForm"
    );


const professionalLoginMessage =
    document.getElementById(
        "professionalLoginMessage"
    );


const professionalGuestButton =
    document.getElementById(
        "professionalGuestButton"
    );


const togglePassword =
    document.getElementById(
        "togglePassword"
    );


const professionalPassword =
    document.getElementById(
        "professionalPassword"
    );


const forgotPassword =
    document.getElementById(
        "forgotPassword"
    );


const rememberMe =
    document.getElementById(
        "rememberMe"
    );


/* =========================================================
   LOGIN TRANSLATIONS FOR JS MESSAGES
========================================================= */

const loginMessageTranslations = {

    English: {

        emailPassword:
            "Please enter your email and password.",

        validEmail:
            "Please enter a valid email address.",

        success:
            "Login successful! Welcome to TruthLens.",

        forgot:
            "Password recovery will be available in a future version."

    },


    Hindi: {

        emailPassword:
            "कृपया अपना ईमेल और पासवर्ड दर्ज करें।",

        validEmail:
            "कृपया एक मान्य ईमेल पता दर्ज करें।",

        success:
            "लॉगिन सफल रहा! TruthLens में आपका स्वागत है।",

        forgot:
            "पासवर्ड रिकवरी भविष्य के संस्करण में उपलब्ध होगी।"

    },


    Bengali: {

        emailPassword:
            "অনুগ্রহ করে আপনার ইমেল এবং পাসওয়ার্ড লিখুন।",

        validEmail:
            "অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন।",

        success:
            "লগইন সফল হয়েছে! TruthLens-এ স্বাগতম।",

        forgot:
            "পাসওয়ার্ড পুনরুদ্ধার ভবিষ্যতের সংস্করণে উপলব্ধ হবে।"

    }

};


function getLoginMessageText() {

    return (
        loginMessageTranslations[
            getCurrentLanguage()
        ] ||
        loginMessageTranslations.English
    );

}


/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

if (
    togglePassword &&
    professionalPassword
) {

    togglePassword.addEventListener(
        "click",
        function () {

            if (
                professionalPassword.type ===
                "password"
            ) {

                professionalPassword.type =
                    "text";


                togglePassword.textContent =
                    "🙈";


                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                professionalPassword.type =
                    "password";


                togglePassword.textContent =
                    "👁️";


                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


/* =========================================================
   CREATE NAME FROM EMAIL
========================================================= */

function createNameFromEmail(email) {

    const username =
        email.split("@")[0];


    return (
        username
            .replace(
                /[._-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .replace(
                /\b\w/g,
                letter =>
                    letter.toUpperCase()
            ) ||
        "TruthLens User"
    );

}

/* =========================================================
   LOGIN FORM - BACKEND AUTHENTICATION
========================================================= */

if (professionalLoginForm) {

    professionalLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const emailInput =
                document.getElementById(
                    "professionalEmail"
                );

            const passwordInput =
                document.getElementById(
                    "professionalPassword"
                );

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";

            /* ---------------------------------------------
               Basic validation
            --------------------------------------------- */

            if (!professionalLoginMessage) {
                return;
            }

            professionalLoginMessage.style.color =
                "#dc2626";

            if (!email || !password) {

                professionalLoginMessage.textContent =
                    "Please enter your email and password.";

                return;
            }

            if (
                !email.includes("@") ||
                !email.includes(".")
            ) {

                professionalLoginMessage.textContent =
                    "Please enter a valid email address.";

                return;
            }


            /* ---------------------------------------------
               Show loading message
            --------------------------------------------- */

            professionalLoginMessage.style.color =
                "#6b7280";

            professionalLoginMessage.textContent =
                "Signing in...";


            try {

                /* -----------------------------------------
                   Send login request to FastAPI
                ----------------------------------------- */

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    email: email,
                                    password: password
                                })
                        }
                    );


                /* -----------------------------------------
                   Read backend response
                ----------------------------------------- */

                const data =
                    await response.json();


                /* -----------------------------------------
                   Handle login error
                ----------------------------------------- */

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Invalid email or password."
                    );

                }


                /* -----------------------------------------
                   Backend login successful
                ----------------------------------------- */

                const user =
                    data.user;


                const accessToken =
                    data.access_token;


                if (!user || !accessToken) {

                    throw new Error(
                        "Invalid response from authentication server."
                    );

                }


                /* -----------------------------------------
                   Save authentication information
                ----------------------------------------- */

                localStorage.removeItem(
                    "truthlensLoggedOut"
                );


                localStorage.setItem(
                    "truthlensUser",
                    JSON.stringify({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isGuest: false
                    })
                );


                /* -----------------------------------------
                   Save JWT token
                ----------------------------------------- */

                if (rememberMe && rememberMe.checked) {

    localStorage.setItem(
        "truthlensAccessToken",
        accessToken
    );

    localStorage.setItem(
        "truthlensUser",
        JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            isGuest: false
        })
    );

    localStorage.setItem(
        "truthlensRememberMe",
        "true"
    );

} else {

    sessionStorage.setItem(
        "truthlensAccessToken",
        accessToken
    );

    sessionStorage.setItem(
        "truthlensUser",
        JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            isGuest: false
        })
    );

    localStorage.removeItem(
        "truthlensAccessToken"
    );

    localStorage.removeItem(
        "truthlensUser"
    );

    localStorage.setItem(
        "truthlensRememberMe",
        "false"
    );
}
                /* -----------------------------------------
                   Success message
                ----------------------------------------- */

                professionalLoginMessage.style.color =
                    "#16a34a";

                professionalLoginMessage.textContent =
                    "Login successful! Welcome to TruthLens.";


                /* -----------------------------------------
                   Security notification
                ----------------------------------------- */

                if (
                    getSavedBoolean(
                        "securityNotifications",
                        true
                    )
                ) {

                    addTruthLensNotification(
                        "New Login",
                        "A new login to your TruthLens account was detected.",
                        "security"
                    );

                }


                /* -----------------------------------------
                   Redirect to Home
                ----------------------------------------- */

                setTimeout(
                    function () {

                        window.location.href =
                            "index.html";

                    },
                    700
                );

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                professionalLoginMessage.style.color =
                    "#dc2626";

                professionalLoginMessage.textContent =
                    error.message ||
                    "Unable to login. Please try again.";

            }

        }
    );

}

/* =========================================================
   GUEST LOGIN
========================================================= */

if (professionalGuestButton) {

    professionalGuestButton.addEventListener(
        "click",
        function () {

            const guestUser = {

                name:
                    "Guest User",

                email:
                    "Guest",

                isGuest:
                    true

            };


            /* Guest access is active login */

            localStorage.removeItem(
                "truthlensLoggedOut"
            );


            localStorage.setItem(
                "truthlensUser",
                JSON.stringify(
                    guestUser
                )
            );


            localStorage.removeItem(
    "truthlensRememberMe"
);


/* -----------------------------------------
   Guest login notification
----------------------------------------- */

if (
    getSavedBoolean(
        "securityNotifications",
        true
    )
) {

    const guestLoginMessages = {

        English: {

            title:
                "Guest Login",

            message:
                "Guest access to TruthLens is now active."

        },

        Hindi: {

            title:
                "अतिथि लॉगिन",

            message:
                "TruthLens में अतिथि एक्सेस अब सक्रिय है।"

        },

        Bengali: {

            title:
                "গেস্ট লগইন",

            message:
                "TruthLens-এ গেস্ট অ্যাক্সেস এখন সক্রিয়।"

        }

    };


    const selectedGuestMessages =
        guestLoginMessages[
            getCurrentLanguage()
        ] ||
        guestLoginMessages.English;


    addTruthLensNotification(
        selectedGuestMessages.title,
        selectedGuestMessages.message,
        "security"
    );

}

window.location.href =
    "index.html";

        }
    );

}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const messages =
                getLoginMessageText();


            alert(
                messages.forgot
            );

        }
    );

}


/* =========================================================
   SUPPORT MODALS
========================================================= */

function setupModal(
    buttonId,
    modalId,
    closeId
) {

    const button =
        document.getElementById(
            buttonId
        );


    const modal =
        document.getElementById(
            modalId
        );


    const closeButton =
        document.getElementById(
            closeId
        );


    if (button && modal) {

        button.addEventListener(
            "click",
            function () {

                modal.classList.add(
                    "active"
                );

            }
        );

    }


    if (closeButton && modal) {

        closeButton.addEventListener(
            "click",
            function () {

                modal.classList.remove(
                    "active"
                );

            }
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    return modal;

}


const helpModal =
    setupModal(
        "helpButton",
        "helpModal",
        "closeHelpModal"
    );


const aboutModal =
    setupModal(
        "aboutButton",
        "aboutModal",
        "closeAboutModal"
    );


const privacyModal =
    setupModal(
        "privacyButton",
        "privacyModal",
        "closePrivacyModal"
    );


/* =========================================================
   ESCAPE KEY FOR MODALS
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {

            return;

        }


        [
            helpModal,
            aboutModal,
            privacyModal
        ].forEach(
            function (modal) {

                if (
                    modal &&
                    modal.classList.contains(
                        "active"
                    )
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    }
);


/* =========================================================
   FINAL REFRESH
========================================================= */

applyTheme(
    localStorage.getItem(
        "theme"
    ) || "light"
);


/*
 * Apply the saved language once the complete
 * JavaScript file has been initialized.
 */

applyLanguage(
    localStorage.getItem(
        "language"
    ) || "English"
);


/*
 * Refresh profile after language initialization.
 * This keeps the profile text synchronized.
 */

displayUser(
    getSavedUser()
);


/*
 * Final notification refresh.
 */

renderTruthLensNotifications();
/* =========================================================
   PROFILE PICTURE
========================================================= */

if (profilePictureInput) {

    profilePictureInput.addEventListener(
        "change",
        function () {

            const file = this.files[0];

            if (!file) {
                return;
            }

            if (!file.type.startsWith("image/")) {

                alert("Please select an image file.");

                this.value = "";

                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {

                const currentUser = getSavedUser();

                if (!currentUser) {

                    alert("Please login first.");

                    profilePictureInput.value = "";

                    return;
                }

                currentUser.profilePicture = event.target.result;

const accessToken =
    sessionStorage.getItem("truthlensAccessToken") ||
    localStorage.getItem("truthlensAccessToken");

if (sessionStorage.getItem("truthlensAccessToken")) {

    sessionStorage.setItem(
        "truthlensUser",
        JSON.stringify(currentUser)
    );

} else {

    localStorage.setItem(
        "truthlensUser",
        JSON.stringify(currentUser)
    );
}

                displayUser(currentUser);

                alert(
                    "Profile picture updated successfully."
                );
            };

            reader.readAsDataURL(file);
        }
    );
}

/* =========================================================
   TRUTHLENS - USER REGISTRATION
========================================================= */

const registerForm = document.getElementById("registerForm");

const registerName =
    document.getElementById("registerName");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const registerMessage =
    document.getElementById("registerMessage");


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

const toggleRegisterPassword =
    document.getElementById("toggleRegisterPassword");

const toggleConfirmPassword =
    document.getElementById("toggleConfirmPassword");


if (toggleRegisterPassword) {

    toggleRegisterPassword.addEventListener(
        "click",
        function () {

            if (registerPassword.type === "password") {

                registerPassword.type = "text";

                this.textContent = "🙈";

            } else {

                registerPassword.type = "password";

                this.textContent = "👁️";
            }

        }
    );
}


if (toggleConfirmPassword) {

    toggleConfirmPassword.addEventListener(
        "click",
        function () {

            if (confirmPassword.type === "password") {

                confirmPassword.type = "text";

                this.textContent = "🙈";

            } else {

                confirmPassword.type = "password";

                this.textContent = "👁️";
            }

        }
    );
}

/* =========================================================
   REGISTRATION FORM
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                registerName.value.trim();

            const email =
                registerEmail.value.trim();

            const password =
                registerPassword.value;

            const confirmPasswordValue =
                confirmPassword.value;


            /* ---------------------------------------------
               Clear previous message
            --------------------------------------------- */

            registerMessage.textContent = "";

            registerMessage.className =
                "login-message";


            /* ---------------------------------------------
               Validate name
            --------------------------------------------- */

            if (!name) {

                registerMessage.textContent =
                    "Please enter your full name.";

                registerMessage.classList.add("error");

                return;
            }


            /* ---------------------------------------------
               Validate email
            --------------------------------------------- */

            if (
                !email ||
                !email.includes("@") ||
                !email.includes(".")
            ) {

                registerMessage.textContent =
                    "Please enter a valid email address.";

                registerMessage.classList.add("error");

                return;
            }


            /* ---------------------------------------------
               Validate password
            --------------------------------------------- */

            if (password.length < 6) {

                registerMessage.textContent =
                    "Password must contain at least 6 characters.";

                registerMessage.classList.add("error");

                return;
            }


            /* ---------------------------------------------
               Confirm password
            --------------------------------------------- */

            if (password !== confirmPasswordValue) {

                registerMessage.textContent =
                    "Passwords do not match.";

                registerMessage.classList.add("error");

                return;
            }


            /* ---------------------------------------------
               Disable button while registering
            --------------------------------------------- */

            const registerButton =
                registerForm.querySelector(
                    "button[type='submit']"
                );


            if (registerButton) {

                registerButton.disabled = true;

                registerButton.textContent =
                    "Creating Account...";
            }


            try {

                /* -----------------------------------------
                   Send registration request
                ----------------------------------------- */

                const response =
                    await fetch(
                        "http://127.0.0.1:8000/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                const data =
                    await response.json();


                /* -----------------------------------------
                   Registration failed
                ----------------------------------------- */

                if (!response.ok) {

                    registerMessage.textContent =
                        data.detail ||
                        "Registration failed.";

                    registerMessage.classList.add(
                        "error"
                    );

                    return;
                }


                /* -----------------------------------------
                   Registration successful
                ----------------------------------------- */

                registerMessage.textContent =
                    "Account created successfully! Redirecting to login...";

                registerMessage.classList.add(
                    "success"
                );


                /* -----------------------------------------
                   Clear password fields
                ----------------------------------------- */

                registerPassword.value = "";

                confirmPassword.value = "";


                /* -----------------------------------------
                   Go to login page
                ----------------------------------------- */
localStorage.setItem(
    "truthlensRegistered",
    "true"
);

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                registerMessage.textContent =
                    "Unable to connect to the TruthLens server.";

                registerMessage.classList.add(
                    "error"
                );


            } finally {

                if (registerButton) {

                    registerButton.disabled = false;

                    registerButton.textContent =
                        "Create Account";
                }

            }

        }
    );
    /* =========================================================
   CONTINUE AS GUEST
========================================================= */

const continueAsGuest =
    document.getElementById("continueAsGuest");

if (continueAsGuest) {

    continueAsGuest.addEventListener(
        "click",
        function () {

            localStorage.setItem(
                "truthlensUser",
                JSON.stringify({
                    name: "Guest User",
                    email: "Guest",
                    isGuest: true
                })
            );

            localStorage.setItem(
                "truthlensLoggedOut",
                "false"
            );

            window.location.href =
                "index.html";
        }
    );
}
}
