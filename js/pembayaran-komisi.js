// =============================================
// PEMBAYARAN KOMISI KAPSTER
// =============================================

let saldoKapster = [];

let pendingPayment = null;


// =============================================
// FORMAT RUPIAH
// =============================================

function formatRupiahPayment(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

}


// =============================================
// ESCAPE HTML
// =============================================

function escapePayment(value) {

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

function getLocalDatePayment() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function formatDatePayment(value) {

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta"
    }).format(new Date(value));

}


// =============================================
// STATUS MESSAGE
// =============================================

function showPaymentMessage(message, type = "info") {

    const element = document.getElementById(
        "paymentMessage"
    );

    element.textContent = message;

    element.className =
        `payment-message ${type}`;

}


// =============================================
// AMBIL SALDO KOMISI DARI DATABASE
// =============================================

async function loadSaldoKomisi() {

    const { data, error } = await window.db.rpc(
        "saldo_komisi_kapster"
    );

    if (error) {
        throw error;
    }

    saldoKapster = data || [];

    renderSaldoKapster();

    renderKapsterOptions();

    renderSummaryPayment();

}


// =============================================
// TAMPILKAN TABEL SALDO KAPSTER
// =============================================

function renderSaldoKapster() {

    const tbody = document.getElementById(
        "saldoTableBody"
    );

    if (saldoKapster.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum terdapat data komisi kapster.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = saldoKapster.map(item => {

        const total = Number(item.total_komisi) || 0;

        const dibayar = Number(item.total_dibayar) || 0;

        const utang = Number(item.saldo_terutang) || 0;


        let status = "Lunas";

        if (utang > 0 && dibayar > 0) {

            status = "Sebagian";

        } else if (utang > 0) {

            status = "Belum Dibayar";

        }


        return `

            <tr>

                <td>
                    ${escapePayment(item.nama)}
                </td>

                <td>
                    ${formatRupiahPayment(total)}
                </td>

                <td>
                    ${formatRupiahPayment(dibayar)}
                </td>

                <td class="payment-outstanding">
                    ${formatRupiahPayment(utang)}
                </td>

                <td>
                    <span class="payment-status">
                        ${status}
                    </span>
                </td>

            </tr>

        `;

    }).join("");

}


// =============================================
// DROPDOWN KAPSTER
// =============================================

function renderKapsterOptions() {

    const select = document.getElementById(
        "kapsterSelect"
    );

    const currentValue = select.value;

    select.innerHTML = `
        <option value="">
            Pilih kapster
        </option>
    `;


    saldoKapster.forEach(item => {

        const utang =
            Number(item.saldo_terutang) || 0;

        if (utang <= 0) {
            return;
        }


        const option = document.createElement(
            "option"
        );

        option.value = item.kapster_id;

        option.textContent =
            `${item.nama} - ${formatRupiahPayment(utang)}`;

        select.appendChild(option);

    });


    if (
        currentValue &&
        Array.from(select.options).some(
            option => option.value === currentValue
        )
    ) {

        select.value = currentValue;

    }


    updateSaldoTersedia();

}


// =============================================
// RINGKASAN PEMBAYARAN
// =============================================

function renderSummaryPayment() {

    const totalKomisi = saldoKapster.reduce(
        (sum, item) => {

            return sum +
                (Number(item.total_komisi) || 0);

        },
        0
    );


    const totalDibayar = saldoKapster.reduce(
        (sum, item) => {

            return sum +
                (Number(item.total_dibayar) || 0);

        },
        0
    );


    const totalUtang = saldoKapster.reduce(
        (sum, item) => {

            return sum +
                (Number(item.saldo_terutang) || 0);

        },
        0
    );


    document.getElementById(
        "totalKomisi"
    ).textContent =
        formatRupiahPayment(totalKomisi);


    document.getElementById(
        "totalDibayar"
    ).textContent =
        formatRupiahPayment(totalDibayar);


    document.getElementById(
        "totalUtang"
    ).textContent =
        formatRupiahPayment(totalUtang);

}


// =============================================
// UPDATE SALDO KAPSTER TERPILIH
// =============================================

function updateSaldoTersedia() {

    const selectedId = document.getElementById(
        "kapsterSelect"
    ).value;


    const selected = saldoKapster.find(
        item => item.kapster_id === selectedId
    );


    const saldo = selected
        ? Number(selected.saldo_terutang) || 0
        : 0;


    document.getElementById(
        "saldoTersedia"
    ).textContent =
        formatRupiahPayment(saldo);


    const amountInput = document.getElementById(
        "jumlahPembayaran"
    );

    amountInput.max = saldo > 0 ? saldo : "";


    if (!pendingPayment) {

        amountInput.value = "";

    }

}


// =============================================
// RIWAYAT PEMBAYARAN
// =============================================

async function loadRiwayatPembayaran() {

    const tbody = document.getElementById(
        "historyTableBody"
    );


    const { data: payments, error } = await window.db

        .from("pembayaran_komisi")

        .select(`
            id,
            nomor_pembayaran,
            kapster_id,
            tanggal_pembayaran,
            metode_pembayaran,
            jumlah,
            catatan,
            status
        `)

        .order("tanggal_pembayaran", {
            ascending: false
        })

        .limit(100);


    if (error) {
        throw error;
    }


    if (!payments || payments.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Belum terdapat riwayat pembayaran.
                </td>
            </tr>
        `;

        return;

    }


    const kapsterIds = [
        ...new Set(
            payments.map(item => item.kapster_id)
        )
    ];


    const { data: kapsters, error: kapsterError } =
        await window.db

            .from("kapster")

            .select("id, nama")

            .in("id", kapsterIds);


    if (kapsterError) {
        throw kapsterError;
    }


    const kapsterMap = new Map();

    (kapsters || []).forEach(item => {

        kapsterMap.set(
            item.id,
            item.nama
        );

    });


    tbody.innerHTML = payments.map(item => {

        const namaKapster =
            kapsterMap.get(item.kapster_id) ||
            "Kapster tidak ditemukan";


        const status = item.status === "posted"
            ? "Berhasil"
            : "Dibatalkan";


        return `

            <tr>

                <td>
                    ${escapePayment(item.nomor_pembayaran)}
                </td>

                <td>
                    ${formatDatePayment(item.tanggal_pembayaran)}
                </td>

                <td>
                    ${escapePayment(namaKapster)}
                </td>

                <td>
                    ${escapePayment(item.metode_pembayaran.toUpperCase())}
                </td>

                <td>
                    ${formatRupiahPayment(item.jumlah)}
                </td>

                <td>
                    ${status}
                </td>

            </tr>

        `;

    }).join("");

}


// =============================================
// PROSES PEMBAYARAN
// =============================================

async function submitPayment(event) {

    event.preventDefault();


    if (pendingPayment) {

        showPaymentMessage(
            "Mengulangi permintaan pembayaran sebelumnya menggunakan kunci yang sama. Jangan ubah data pembayaran sampai hasilnya terkonfirmasi.",
            "warning"
        );

    } else {

        const kapsterId = document.getElementById(
            "kapsterSelect"
        ).value;

        const tanggal = document.getElementById(
            "tanggalPembayaran"
        ).value;

        const metode = document.getElementById(
            "metodePembayaran"
        ).value;

        const jumlah = Number(
            document.getElementById(
                "jumlahPembayaran"
            ).value
        );

        const catatan = document.getElementById(
            "catatanPembayaran"
        ).value.trim();


        const selected = saldoKapster.find(
            item => item.kapster_id === kapsterId
        );


        if (!selected) {

            showPaymentMessage(
                "Silakan pilih kapster yang memiliki saldo komisi.",
                "error"
            );

            return;

        }


        const saldo = Number(
            selected.saldo_terutang
        ) || 0;


        if (!tanggal) {

            showPaymentMessage(
                "Tanggal pembayaran wajib diisi.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(jumlah) ||
            jumlah <= 0 ||
            !Number.isInteger(jumlah * 100)
        ) {

            showPaymentMessage(
                "Jumlah pembayaran harus lebih dari nol dan maksimal dua angka desimal.",
                "error"
            );

            return;

        }


        if (jumlah > saldo) {

            showPaymentMessage(
                "Jumlah pembayaran melebihi saldo komisi tersedia.",
                "error"
            );

            return;

        }


        if (!crypto.randomUUID) {

            showPaymentMessage(
                "Browser tidak mendukung pembuatan kunci transaksi aman.",
                "error"
            );

            return;

        }


        pendingPayment = {

            p_request_key: crypto.randomUUID(),

            p_kapster_id: kapsterId,

            p_tanggal_pembayaran:
                new Date(
                    `${tanggal}T12:00:00+07:00`
                ).toISOString(),

            p_metode_pembayaran: metode,

            p_jumlah: jumlah,

            p_catatan: catatan || null

        };

    }


    const button = document.getElementById(
        "submitPayment"
    );

    button.disabled = true;

    button.textContent = "Memproses...";


    try {

        const { data, error } = await window.db.rpc(

            "bayar_komisi_kapster",

            pendingPayment

        );


        if (error) {
            throw error;
        }


        if (!data || data.success !== true) {

            throw new Error(
                "Database belum mengonfirmasi pembayaran."
            );

        }


        showPaymentMessage(

            `Pembayaran berhasil. Nomor pembayaran: ${data.nomor_pembayaran}. Nomor jurnal: ${data.nomor_jurnal || "sudah tercatat"}. Jumlah: ${formatRupiahPayment(data.jumlah)}.`,

            "success"

        );


        // Permintaan sudah terkonfirmasi.
        pendingPayment = null;


        document.getElementById(
            "paymentForm"
        ).reset();


        document.getElementById(
            "tanggalPembayaran"
        ).value = getLocalDatePayment();


        await loadSaldoKomisi();

        await loadRiwayatPembayaran();


    } catch (error) {

        console.error(
            "Pembayaran komisi gagal:",
            error
        );


        showPaymentMessage(

            "Pembayaran belum dapat dikonfirmasi: " +
            (error.message || "Kesalahan tidak diketahui.") +
            " Jangan membuat pembayaran baru. Coba ulangi permintaan yang sama.",

            "error"

        );

        // pendingPayment dipertahankan untuk retry
        // dengan request_key yang sama.

    } finally {

        button.disabled = false;

        button.textContent = pendingPayment
            ? "Ulangi Konfirmasi Pembayaran"
            : "Simpan Pembayaran";

        updateSaldoTersedia();

    }

}


// =============================================
// INISIALISASI
// =============================================

async function initializePaymentPage() {

    document.getElementById(
        "tanggalPembayaran"
    ).value = getLocalDatePayment();


    try {

        await loadSaldoKomisi();

        await loadRiwayatPembayaran();


        showPaymentMessage(
            "Data pembayaran berhasil dimuat.",
            "success"
        );


    } catch (error) {

        console.error(error);


        showPaymentMessage(
            "Gagal memuat data: " + error.message,
            "error"
        );

    }

}


// =============================================
// EVENT LISTENER
// =============================================

document.getElementById(
    "kapsterSelect"
).addEventListener(
    "change",
    updateSaldoTersedia
);


document.getElementById(
    "paymentForm"
).addEventListener(
    "submit",
    submitPayment
);


document.getElementById(
    "refreshButton"
).addEventListener(
    "click",
    async () => {

        try {

            await loadSaldoKomisi();

            await loadRiwayatPembayaran();

            showPaymentMessage(
                "Data berhasil diperbarui.",
                "success"
            );

        } catch (error) {

            showPaymentMessage(
                "Gagal memperbarui data: " + error.message,
                "error"
            );

        }

    }
);


initializePaymentPage();