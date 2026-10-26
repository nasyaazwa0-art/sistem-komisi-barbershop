/*
 * Pengaman halaman aplikasi.
 * File ini memeriksa sesi Supabase sebelum memuat JavaScript setiap modul.
 * Proteksi data yang sebenarnya tetap wajib diberlakukan melalui RLS di database.
 */
(async () => {
    "use strict";

    const protectedScripts = {
        "index.html": "js/dashboard.js",
        "kapster.html": "js/kapster.js",
        "layanan.html": "js/layanan.js",
        "transaksi.html": "js/transaksi.js",
        "riwayat.html": "js/riwayat.js",
        "laporan.html": "js/laporan.js"
    };

    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const currentPage = window.location.pathname.endsWith("/")
        ? "index.html"
        : (pathSegments[pathSegments.length - 1] || "index.html");

    // Guard tidak dipasang di login.html. Kalau salah pasang, hindari redirect loop.
    if (currentPage === "login.html") return;

    document.body.style.visibility = "hidden";

    function showFatalMessage(text) {
        document.body.style.visibility = "visible";
        const main = document.querySelector(".main-content") || document.body;
        const card = document.createElement("div");
        card.className = "auth-boot-error";
        card.setAttribute("role", "alert");
        card.textContent = text;
        main.prepend(card);
    }

    function addAccountPanel(session) {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar || sidebar.querySelector(".auth-sidebar-footer")) return;

        const footer = document.createElement("div");
        footer.className = "auth-sidebar-footer";

        const caption = document.createElement("p");
        caption.className = "auth-user-caption";
        caption.textContent = "Login sebagai";

        const email = document.createElement("p");
        email.className = "auth-user-email";
        email.textContent = session.user?.email || "Pengguna terverifikasi";
        email.title = email.textContent;

        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.className = "auth-logout-button";
        logoutButton.textContent = "Keluar";
        logoutButton.addEventListener("click", async () => {
            logoutButton.disabled = true;
            logoutButton.textContent = "Keluar…";
            try {
                const { error } = await window.db.auth.signOut();
                if (error) throw error;
                window.location.replace("login.html");
            } catch (error) {
                console.error("Logout gagal:", error.message || error);
                logoutButton.disabled = false;
                logoutButton.textContent = "Keluar";
                window.alert("Logout gagal. Periksa koneksi, lalu coba lagi.");
            }
        });

        footer.append(caption, email, logoutButton);
        sidebar.appendChild(footer);
    }

    try {
        if (!window.db?.auth) {
            throw new Error("Supabase Auth belum tersedia. Pastikan js/supabase.js dimuat sebelum auth-guard.js.");
        }

        const { data, error } = await window.db.auth.getSession();
        if (error) throw error;

        if (!data?.session) {
            window.location.replace("login.html");
            return;
        }

        const pageScript = protectedScripts[currentPage];
        if (!pageScript) {
            window.location.replace("login.html");
            return;
        }

        addAccountPanel(data.session);

        // Pantau logout dari tab ini atau sesi yang berakhir.
        window.db.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") window.location.replace("login.html");
        });

        const appScript = document.createElement("script");
        appScript.src = pageScript;
        appScript.async = false;
        appScript.onload = () => {
            document.body.style.visibility = "visible";
        };
        appScript.onerror = () => {
            showFatalMessage("Modul halaman gagal dimuat. Periksa nama file JavaScript dan coba muat ulang.");
        };
        document.body.appendChild(appScript);
    } catch (error) {
        console.error("Pemeriksaan autentikasi gagal:", error);
        showFatalMessage("Sesi tidak dapat diverifikasi. Periksa koneksi internet dan konfigurasi Supabase, lalu muat ulang halaman.");
    }
})();
