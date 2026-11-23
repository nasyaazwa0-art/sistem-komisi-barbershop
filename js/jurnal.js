// ============================================
// BUKU JURNAL UMUM
// ============================================


// ============================================
// FORMAT RUPIAH
// ============================================

function formatRupiahJurnal(nilai) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(nilai) || 0);

}


// ============================================
// FORMAT TANGGAL WIB
// ============================================

function formatTanggalJurnal(tanggal) {

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta"
    }).format(new Date(tanggal));

}


// ============================================
// FORMAT INPUT DATE
// ============================================

function getDateStringJurnal(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function getNextDateJurnal(dateString) {

    const date = new Date(
        `${dateString}T00:00:00+07:00`
    );

    date.setUTCDate(
        date.getUTCDate() + 1
    );

    return date.toISOString().slice(0, 10);

}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtmlJurnal(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================
// LABEL JENIS JURNAL
// ============================================

function labelJenisJurnal(jenis) {

    const labels = {

        penjualan_jasa: "Penjualan Jasa",

        pengakuan_komisi: "Pengakuan Komisi",

        pembayaran_komisi: "Pembayaran Komisi",

        penyesuaian: "Penyesuaian"

    };

    return labels[jenis] || jenis;

}


// ============================================
// DEFAULT PERIODE
// ============================================

function setDefaultPeriodeJurnal() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");


    document.getElementById(
        "tanggalMulai"
    ).value = `${year}-${month}-01`;


    document.getElementById(
        "tanggalAkhir"
    ).value = `${year}-${month}-${day}`;

}


// ============================================
// RESET RINGKASAN
// ============================================

function resetRingkasanJurnal() {

    document.getElementById(
        "totalJurnal"
    ).textContent = "0";


    document.getElementById(
        "totalDebit"
    ).textContent = formatRupiahJurnal(0);


    document.getElementById(
        "totalKredit"
    ).textContent = formatRupiahJurnal(0);

}


// ============================================
// LOAD JURNAL
// ============================================

async function loadJurnal() {

    const tbody = document.getElementById(
        "jurnalTableBody"
    );

    const message = document.getElementById(
        "jurnalMessage"
    );

    const balanceMessage = document.getElementById(
        "balanceMessage"
    );


    try {

        message.textContent =
            "Mengambil data jurnal dari database...";

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Memuat data...
                </td>
            </tr>
        `;


        if (!window.db) {

            throw new Error(
                "Koneksi Supabase belum tersedia."
            );

        }


        // =====================================
        // VALIDASI PERIODE
        // =====================================

        const tanggalMulai = document.getElementById(
            "tanggalMulai"
        ).value;

        const tanggalAkhir = document.getElementById(
            "tanggalAkhir"
        ).value;


        if (!tanggalMulai || !tanggalAkhir) {

            throw new Error(
                "Periode tanggal harus diisi."
            );

        }


        if (tanggalMulai > tanggalAkhir) {

            throw new Error(
                "Tanggal mulai tidak boleh melebihi tanggal akhir."
            );

        }


        const startISO =
            `${tanggalMulai}T00:00:00+07:00`;

        const nextDate =
            getNextDateJurnal(tanggalAkhir);

        const endISO =
            `${nextDate}T00:00:00+07:00`;


        // =====================================
        // 1. AMBIL HEADER JURNAL
        // =====================================

        const jurnalResult = await window.db

            .from("jurnal_umum")

            .select(`
                id,
                nomor_jurnal,
                tanggal,
                jenis_jurnal,
                keterangan,
                transaksi_id,
                status
            `)

            .gte("tanggal", startISO)

            .lt("tanggal", endISO)

            .order("tanggal", {
                ascending: false
            });


        if (jurnalResult.error) {

            throw jurnalResult.error;

        }


        const jurnalData =
            jurnalResult.data || [];


        if (jurnalData.length === 0) {

            resetRingkasanJurnal();

            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Tidak ada jurnal pada periode yang dipilih.
                    </td>
                </tr>
            `;

            balanceMessage.textContent =
                "Belum ada jurnal untuk diperiksa.";

            message.textContent =
                "Data jurnal berhasil diperiksa. Belum ada transaksi akuntansi pada periode tersebut.";

            return;

        }


        // =====================================
        // 2. AMBIL DETAIL JURNAL
        // =====================================

        const jurnalIds = jurnalData.map(
            jurnal => jurnal.id
        );


        const detailResult = await window.db

            .from("detail_jurnal")

            .select(`
                id,
                jurnal_id,
                akun_id,
                keterangan,
                debit,
                kredit
            `)

            .in("jurnal_id", jurnalIds);


        if (detailResult.error) {

            throw detailResult.error;

        }


        const detailData =
            detailResult.data || [];


        // =====================================
        // 3. AMBIL DAFTAR AKUN
        // =====================================

        const akunIds = [
            ...new Set(
                detailData.map(
                    detail => detail.akun_id
                )
            )
        ];


        let akunData = [];


        if (akunIds.length > 0) {

            const akunResult = await window.db

                .from("akun")

                .select(`
                    id,
                    kode_akun,
                    nama_akun,
                    kategori,
                    saldo_normal
                `)

                .in("id", akunIds);


            if (akunResult.error) {

                throw akunResult.error;

            }


            akunData = akunResult.data || [];

        }


        // =====================================
        // 4. BUAT MAP DATA
        // =====================================

        const akunMap = new Map();

        akunData.forEach(akun => {

            akunMap.set(
                akun.id,
                akun
            );

        });


        const detailMap = new Map();

        detailData.forEach(detail => {

            if (!detailMap.has(detail.jurnal_id)) {

                detailMap.set(
                    detail.jurnal_id,
                    []
                );

            }

            detailMap.get(
                detail.jurnal_id
            ).push(detail);

        });


        // =====================================
        // 5. HITUNG RINGKASAN
        // =====================================

        let totalDebit = 0;

        let totalKredit = 0;

        let jurnalSeimbang = true;

        let detailRows = [];


        jurnalData.forEach(jurnal => {

            const details =
                detailMap.get(jurnal.id) || [];

            let debitJurnal = 0;

            let kreditJurnal = 0;


            details.forEach(detail => {

                const debit =
                    Number(detail.debit) || 0;

                const kredit =
                    Number(detail.kredit) || 0;


                debitJurnal += debit;

                kreditJurnal += kredit;

                totalDebit += debit;

                totalKredit += kredit;

            });


            const selisih = Math.round(
                (debitJurnal - kreditJurnal) * 100
            ) / 100;


            const seimbang =
                details.length >= 2 &&
                Math.abs(selisih) < 0.01;


            if (!seimbang) {

                jurnalSeimbang = false;

            }


            if (details.length === 0) {

                detailRows.push(`
                    <tr>
                        <td>
                            ${formatTanggalJurnal(jurnal.tanggal)}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(jurnal.nomor_jurnal)}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(
                                labelJenisJurnal(jurnal.jenis_jurnal)
                            )}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(jurnal.keterangan)}
                        </td>

                        <td colspan="3">
                            Tidak ada detail jurnal
                        </td>
                    </tr>
                `);

                return;

            }


            details.forEach(detail => {

                const akun =
                    akunMap.get(detail.akun_id);


                const namaAkun = akun
                    ? `${akun.kode_akun} - ${akun.nama_akun}`
                    : "Akun tidak ditemukan";


                detailRows.push(`
                    <tr>

                        <td>
                            ${formatTanggalJurnal(jurnal.tanggal)}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(jurnal.nomor_jurnal)}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(
                                labelJenisJurnal(jurnal.jenis_jurnal)
                            )}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(
                                detail.keterangan || jurnal.keterangan
                            )}
                        </td>

                        <td>
                            ${escapeHtmlJurnal(namaAkun)}
                        </td>

                        <td class="amount-cell">
                            ${
                                Number(detail.debit) > 0
                                    ? formatRupiahJurnal(detail.debit)
                                    : "-"
                            }
                        </td>

                        <td class="amount-cell">
                            ${
                                Number(detail.kredit) > 0
                                    ? formatRupiahJurnal(detail.kredit)
                                    : "-"
                            }
                        </td>

                    </tr>
                `);

            });

        });


        // =====================================
        // 6. TAMPILKAN DATA
        // =====================================

        tbody.innerHTML = detailRows.join("");


        document.getElementById(
            "totalJurnal"
        ).textContent = jurnalData.length;


        document.getElementById(
            "totalDebit"
        ).textContent =
            formatRupiahJurnal(totalDebit);


        document.getElementById(
            "totalKredit"
        ).textContent =
            formatRupiahJurnal(totalKredit);


        // =====================================
        // 7. STATUS KESEIMBANGAN
        // =====================================

        const selisihTotal = Math.round(
            (totalDebit - totalKredit) * 100
        ) / 100;


        if (
            jurnalSeimbang &&
            Math.abs(selisihTotal) < 0.01
        ) {

            balanceMessage.textContent =
                "✓ Seluruh jurnal pada periode ini seimbang. Total debit sama dengan total kredit.";

            balanceMessage.className =
                "journal-balanced";

        } else {

            balanceMessage.textContent =
                "⚠ Terdapat jurnal yang belum seimbang. Periksa rincian debit dan kredit.";

            balanceMessage.className =
                "journal-unbalanced";

        }


        message.textContent =
            `Berhasil memuat ${jurnalData.length} jurnal.`;

    } catch (error) {

        console.error(
            "Gagal memuat jurnal:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Data jurnal gagal dimuat.
                </td>
            </tr>
        `;

        resetRingkasanJurnal();

        balanceMessage.textContent =
            "Status jurnal belum dapat diperiksa.";

        message.textContent =
            "Gagal memuat jurnal: " +
            (error.message || "Kesalahan tidak diketahui.");

    }

}


// ============================================
// CETAK JURNAL
// ============================================

function cetakJurnal() {

    const tanggalMulai = document.getElementById(
        "tanggalMulai"
    ).value;

    const tanggalAkhir = document.getElementById(
        "tanggalAkhir"
    ).value;


    document.getElementById(
        "printPeriod"
    ).textContent =
        `Periode: ${tanggalMulai} sampai ${tanggalAkhir}`;


    window.print();

}


// ============================================
// EVENT LISTENER
// ============================================

document.getElementById(
    "filterButton"
).addEventListener(
    "click",
    loadJurnal
);


document.getElementById(
    "printButton"
).addEventListener(
    "click",
    cetakJurnal
);


// ============================================
// INITIALIZE
// ============================================

setDefaultPeriodeJurnal();

loadJurnal();