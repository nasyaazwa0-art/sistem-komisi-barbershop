// =============================================
// KOREKSI TRANSAKSI
// =============================================

let transaksiKoreksi = [];

let transaksiTerpilih = null;

let isAdminKoreksi = false;


// =============================================
// FORMAT RUPIAH
// =============================================

function rupiahKoreksi(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

}


// =============================================
// ESCAPE HTML
// =============================================

function escapeKoreksi(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =============================================
// FORMAT TANGGAL
// =============================================

function tanggalKoreksi(value) {

    return new Intl.DateTimeFormat("id-ID", {

        day: "2-digit",
        month: "short",
        year: "numeric",

        timeZone: "Asia/Jakarta"

    }).format(new Date(value));

}


function tanggalInputKoreksi(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// =============================================
// MESSAGE
// =============================================

function pesanKoreksi(message, type = "info") {

    const element = document.getElementById(
        "correctionMessage"
    );

    element.textContent = message;

    element.className = `correction-message ${type}`;

}


// =============================================
// DEFAULT DATE
// =============================================

function setDefaultKoreksi() {

    const now = new Date();

    document.getElementById(
        "filterTanggalMulai"
    ).value = tanggalInputKoreksi(

        new Date(now.getFullYear(), now.getMonth(), 1)

    );


    document.getElementById(
        "filterTanggalAkhir"
    ).value = tanggalInputKoreksi(now);

}


// =============================================
// CHECK ADMIN
// =============================================

async function checkAdminKoreksi() {

    const { data, error } = await window.db.rpc(
        "is_current_user_admin"
    );

    if (error) {
        throw error;
    }

    isAdminKoreksi = data === true;

    if (!isAdminKoreksi) {

        throw new Error(
            "Akses ditolak. Halaman Koreksi Transaksi hanya tersedia untuk administrator."
        );

    }

}


// =============================================
// LOAD TRANSACTIONS
// =============================================

async function loadTransaksiKoreksi() {

    const tbody = document.getElementById(
        "correctionTableBody"
    );

    const mulai = document.getElementById(
        "filterTanggalMulai"
    ).value;

    const akhir = document.getElementById(
        "filterTanggalAkhir"
    ).value;

    const status = document.getElementById(
        "filterStatus"
    ).value;


    try {

        pesanKoreksi("Memuat transaksi...");


        if (mulai && akhir && mulai > akhir) {

            throw new Error(
                "Tanggal mulai tidak boleh melebihi tanggal akhir."
            );

        }


        let query = window.db

            .from("transaksi")

            .select(`
                id,
                nomor_transaksi,
                tanggal,
                nama_pelanggan,
                metode_pembayaran,
                total,
                status,
                reversed_at,
                reversed_by
            `)

            .order("tanggal", {
                ascending: false
            })

            .limit(200);


        if (mulai) {

            query = query.gte(
                "tanggal",
                `${mulai}T00:00:00+07:00`
            );

        }


        if (akhir) {

            const [y, m, d] = akhir.split("-").map(Number);

            const next = new Date(
                Date.UTC(y, m - 1, d + 1)
            );

            const nextDate = next.toISOString().slice(0, 10);

            query = query.lt(
                "tanggal",
                `${nextDate}T00:00:00+07:00`
            );

        }


        if (status !== "all") {

            query = query.eq("status", status);

        }


        const { data, error } = await query;

        if (error) {
            throw error;
        }


        transaksiKoreksi = data || [];


        renderKoreksiTable();

        await loadSummaryKoreksi();


        pesanKoreksi(
            `${transaksiKoreksi.length} transaksi berhasil dimuat.`,
            "success"
        );


    } catch (error) {

        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Gagal memuat transaksi.
                </td>
            </tr>
        `;

        pesanKoreksi(
            error.message,
            "error"
        );

    }

}


// =============================================
// SUMMARY
// =============================================

async function loadSummaryKoreksi() {

    const { count: posted, error: e1 } = await window.db

        .from("transaksi")

        .select("id", {
            count: "exact",
            head: true
        })

        .eq("status", "posted");


    if (e1) throw e1;


    const { count: reversed, error: e2 } = await window.db

        .from("transaksi")

        .select("id", {
            count: "exact",
            head: true
        })

        .eq("status", "reversed");


    if (e2) throw e2;


    document.getElementById(
        "totalPosted"
    ).textContent = posted || 0;


    document.getElementById(
        "totalReversed"
    ).textContent = reversed || 0;

}


// =============================================
// RENDER TABLE
// =============================================

function renderKoreksiTable() {

    const tbody = document.getElementById(
        "correctionTableBody"
    );


    if (transaksiKoreksi.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Tidak ada transaksi pada periode ini.
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML = transaksiKoreksi.map(item => {

        const statusReversed =
            item.status === "reversed";


        return `

            <tr>

                <td>
                    ${tanggalKoreksi(item.tanggal)}
                </td>

                <td>
                    <strong>
                        ${escapeKoreksi(item.nomor_transaksi)}
                    </strong>
                </td>

                <td>
                    ${escapeKoreksi(item.nama_pelanggan || "-")}
                </td>

                <td>
                    ${escapeKoreksi(
                        item.metode_pembayaran.toUpperCase()
                    )}
                </td>

                <td>
                    ${rupiahKoreksi(item.total)}
                </td>

                <td>

                    <span class="${
                        statusReversed
                            ? "correction-status reversed"
                            : "correction-status posted"
                    }">

                        ${statusReversed ? "Reversed" : "Posted"}

                    </span>

                </td>

                <td>

                    ${
                        statusReversed

                        ? `
                            <span class="correction-done">
                                Sudah Dibatalkan
                            </span>
                          `

                        : `
                            <button
                                type="button"
                                class="cancel-transaction-button"
                                data-id="${escapeKoreksi(item.id)}"
                            >
                                Batalkan
                            </button>
                          `
                    }

                </td>

            </tr>

        `;

    }).join("");


    tbody.querySelectorAll(
        ".cancel-transaction-button"
    ).forEach(button => {

        button.addEventListener("click", () => {

            openCancelModal(button.dataset.id);

        });

    });

}


// =============================================
// OPEN MODAL
// =============================================

function openCancelModal(transactionId) {

    transaksiTerpilih = transaksiKoreksi.find(

        item => item.id === transactionId

    );


    if (!transaksiTerpilih) {

        alert("Transaksi tidak ditemukan.");

        return;

    }


    if (transaksiTerpilih.status !== "posted") {

        alert("Transaksi sudah tidak aktif.");

        return;

    }


    document.getElementById(
        "cancelTransactionNumber"
    ).value = transaksiTerpilih.nomor_transaksi;


    document.getElementById(
        "cancelReason"
    ).value = "";


    document.getElementById(
        "confirmCancellation"
    ).checked = false;


    document.getElementById(
        "confirmCancelButton"
    ).disabled = true;


    document.getElementById(
        "cancelModalMessage"
    ).textContent = "";


    document.getElementById(
        "cancelModal"
    ).classList.remove("hidden");

}


// =============================================
// CLOSE MODAL
// =============================================

function closeCancelModal() {

    document.getElementById(
        "cancelModal"
    ).classList.add("hidden");


    transaksiTerpilih = null;

}


// =============================================
// VALIDATE CONFIRM BUTTON
// =============================================

function validateCancellation() {

    const reason = document.getElementById(
        "cancelReason"
    ).value.trim();


    const checked = document.getElementById(
        "confirmCancellation"
    ).checked;


    document.getElementById(
        "confirmCancelButton"
    ).disabled = !(
        reason.length >= 5 &&
        reason.length <= 500 &&
        checked
    );

}


// =============================================
// PROCESS REVERSAL
// =============================================

async function processCancellation() {

    if (!isAdminKoreksi || !transaksiTerpilih) {

        alert("Akses pembatalan tidak tersedia.");

        return;

    }


    const reason = document.getElementById(
        "cancelReason"
    ).value.trim();


    if (reason.length < 5 || reason.length > 500) {

        alert(
            "Alasan pembatalan harus terdiri dari 5 sampai 500 karakter."
        );

        return;

    }


    if (!document.getElementById(
        "confirmCancellation"
    ).checked) {

        alert(
            "Silakan konfirmasi pemahaman atas proses pembatalan."
        );

        return;

    }


    const confirmed = window.confirm(

        `Apakah kamu yakin ingin membatalkan transaksi ${transaksiTerpilih.nomor_transaksi}?\n\n` +

        "Sistem akan membuat jurnal pembalik. Transaksi asli tidak dihapus."

    );


    if (!confirmed) return;


    const button = document.getElementById(
        "confirmCancelButton"
    );


    button.disabled = true;

    button.textContent = "Memproses...";


    try {

        const { data, error } = await window.db.rpc(

            "batalkan_transaksi_akuntansi",

            {

                p_transaksi_id: transaksiTerpilih.id,

                p_alasan: reason

            }

        );


        if (error) {
            throw error;
        }


        if (!data || data.success !== true) {

            throw new Error(
                "Database belum mengonfirmasi pembatalan."
            );

        }


        document.getElementById(
            "cancelModalMessage"
        ).textContent =
            `Pembatalan berhasil. ${data.jumlah_jurnal_dibalik} jurnal berhasil dibalik.`;


        await loadTransaksiKoreksi();


        setTimeout(() => {

            closeCancelModal();

        }, 1500);


    } catch (error) {

        console.error(error);


        document.getElementById(
            "cancelModalMessage"
        ).textContent =
            "Pembatalan gagal: " + error.message;


        button.disabled = false;

        button.textContent =
            "Konfirmasi Pembatalan";

    }

}


// =============================================
// EVENT LISTENERS
// =============================================

document.getElementById(
    "filterButton"
).addEventListener(
    "click",
    loadTransaksiKoreksi
);


document.getElementById(
    "refreshButton"
).addEventListener(
    "click",
    loadTransaksiKoreksi
);


document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    closeCancelModal
);


document.getElementById(
    "cancelModalButton"
).addEventListener(
    "click",
    closeCancelModal
);


document.getElementById(
    "cancelReason"
).addEventListener(
    "input",
    validateCancellation
);


document.getElementById(
    "confirmCancellation"
).addEventListener(
    "change",
    validateCancellation
);


document.getElementById(
    "confirmCancelButton"
).addEventListener(
    "click",
    processCancellation
);


// =============================================
// INITIALIZATION
// =============================================

async function initializeKoreksi() {

    try {

        setDefaultKoreksi();

        await checkAdminKoreksi();

        await loadTransaksiKoreksi();

    } catch (error) {

        console.error(error);

        document.getElementById(
            "correctionTableBody"
        ).innerHTML = `
            <tr>
                <td colspan="7">
                    ${escapeKoreksi(error.message)}
                </td>
            </tr>
        `;

        pesanKoreksi(
            error.message,
            "error"
        );

    }

}


initializeKoreksi();