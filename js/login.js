/*
 * Login menggunakan Supabase Auth.
 * Tidak ada fitur pendaftaran publik; akun dibuat dari Supabase Dashboard.
 */
(() => {
    "use strict";

    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("loginMessage");
    const button = loginForm?.querySelector('button[type="submit"]');

    if (!loginForm || !emailInput || !passwordInput || !message || !button) {
        console.error("Elemen form login tidak lengkap.");
        return;
    }

    function showMessage(text, type = "error") {
        message.textContent = text;
        message.setAttribute("role", "status");
        message.setAttribute("aria-live", "polite");
        message.dataset.type = type;
    }

    function setBusy(isBusy) {
        button.disabled = isBusy;
        button.textContent = isBusy ? "Memverifikasi..." : "Login";
        emailInput.disabled = isBusy;
        passwordInput.disabled = isBusy;
    }

    if (!window.db?.auth) {
        showMessage("Layanan autentikasi belum siap. Periksa koneksi dan konfigurasi Supabase.");
        return;
    }

    // Pengguna yang masih mempunyai sesi aktif langsung menuju dashboard.
    window.db.auth.getSession()
        .then(({ data, error }) => {
            if (error) throw error;
            if (data?.session) window.location.replace("index.html");
        })
        .catch((error) => {
            console.error("Pemeriksaan sesi login gagal:", error.message);
            showMessage("Sesi belum dapat diperiksa. Muat ulang halaman dan coba lagi.");
        });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        showMessage("");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Email dan password wajib diisi.");
            return;
        }

        setBusy(true);
        try {
            const { error } = await window.db.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                const details = String(error.message || "").toLowerCase();
                if (details.includes("invalid login credentials") || details.includes("email not confirmed")) {
                    showMessage("Email atau password tidak sesuai, atau akun belum dikonfirmasi.");
                } else {
                    console.error("Login gagal:", error.message);
                    showMessage("Login belum berhasil. Periksa koneksi, konfigurasi Supabase, dan status akun.");
                }
                return;
            }

            showMessage("Login berhasil. Membuka dashboard…", "success");
            window.location.replace("index.html");
        } catch (error) {
            console.error("Login error:", error);
            showMessage("Terjadi kendala saat login. Periksa koneksi internet lalu coba lagi.");
        } finally {
            setBusy(false);
        }
    });
})();
