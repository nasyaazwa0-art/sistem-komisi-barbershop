// =============================================
// BUKU BESAR - SIA BARBERSHOP
// =============================================


// =============================================
// FORMAT RUPIAH
// =============================================

function formatRupiahLedger(nilai) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(nilai) || 0);

}


// =============================================
// ESCAPE HTML
// =============================================

function escapeLedger(value) {

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

function formatTanggalLedger(tanggal) {

    return new Intl.DateTimeFormat("id-ID", {

        day: "2-digit",
        month: "short",
        year: "numeric",

        timeZone: "Asia/Jakarta"

    }).format(new Date(tanggal));

}


// =============================================
// FORMAT INPUT DATE
// =============================================

function tanggalLokalLedger(date) {

    const tahun = date.getFullYear();

    const bulan = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const hari = String(
        date.getDate()
    ).padStart(2, "0");

    return `${tahun}-${bulan}-${hari}`;

}


function hariBerikutnyaLedger(dateString) {

    const [tahun, bulan, hari] =
        dateString.split("-").map(Number);

    const date = new Date(
        Date.UTC(tahun, bulan - 1, hari + 1)
    );

    return date.toISOString().slice(0, 10);

}


// =============================================
// FORMAT SALDO BERDASARKAN SALDO NORMAL
// =============================================

function formatSaldoNormal(nilai) {

    const angka = Math.round(nilai * 100) / 100;

    const jumlah = formatRupiahLedger(
        Math.abs(angka)
    );

    if (angka === 0) {

        return "Rp0";

    }

    const arah = angka > 0
        ? "Normal"
        : "Tidak Normal";

    return `${jumlah} (${arah})`;

}


// =============================================
// DEFAULT PERIODE
// =============================================

function setDefaultLedger() {

    const sekarang = new Date();

    const tahun = sekarang.getFullYear();

    const bulan = String(
        sekarang.getMonth() + 1
    ).padStart(2, "0");

    const hari = String(
        sekarang.getDate()
    ).padStart(2, "0");


    document.getElementById(
        "tanggalMulai"
    ).value = `${tahun}-${bulan}-01`;


    document.getElementById(
        "tanggalAkhir"
    ).value = `${tahun}-${bulan}-${hari}`;

}


// =============================================
// AMBIL SELURUH DATA DENGAN PAGINASI
// =============================================

async function ambilSemuaDataLedger(
    namaTabel,
    kolom,
    konfigurasiQuery
) {

    const seluruhData = [];

    const ukuranHalaman = 1000;

    let awal = 0;

    while (true) {

        let query = window.db
            .from(namaTabel)
            .select(kolom);

        query = konfigurasiQuery(query);

        const { data, error } = await query
            .range(awal, awal + ukuranHalaman - 1);

        if (error) {

            throw error;

        }

        seluruhData.push(...(data || []));

        if (!data || data.length < ukuranHalaman) {

            break;

        }

        awal += ukuranHalaman;

    }

    return seluruhData;

}


// =============================================
// LOAD DAFTAR AKUN
// =============================================

async function loadDaftarAkunLedger() {

    const select = document.getElementById(
        "akunSelect"
    );

    const { data, error } = await window.db

        .from("akun")

        .select(`
            id,
            kode_akun,
            nama_akun,
            kategori,
            saldo_normal,
            is_active
        `)

        .order("kode_akun", {
            ascending: true
        });


    if (error) {

        throw error;

    }


    const akunData = data || [];


    if (akunData.length === 0) {

        throw new Error(
            "Daftar akun belum tersedia."
        );

    }


    select.innerHTML = akunData.map(akun => {

        const status = akun.is_active
            ? ""
            : " (Nonaktif)";

        return `
            <option
                value="${escapeLedger(akun.id)}"
            >
                ${escapeLedger(akun.kode_akun)}
                - ${escapeLedger(akun.nama_akun)}
                ${status}
            </option>
        `;

    }).join("");


    return akunData;

}


// =============================================
// LOAD HEADER JURNAL
// =============================================

async function loadHeaderLedger(endISO) {

    return await ambilSemuaDataLedger(

        "jurnal_umum",

        `
            id,
            nomor_jurnal,
            tanggal,
            jenis_jurnal,
            keterangan,
            status
        `,

        query => query
            .in("status", ["posted", "reversed"])
            .lt("tanggal", endISO)
            .order("tanggal", {
                ascending: true
            })

    );

}


// =============================================
// LOAD DETAIL JURNAL BERDASARKAN AKUN
// =============================================

async function loadDetailLedger(
    akunId,
    jurnalIds
) {

    const seluruhDetail = [];

    // Membagi ID jurnal agar query tetap ringan.

    const ukuranKelompok = 100;

    for (
        let i = 0;
        i < jurnalIds.length;
        i += ukuranKelompok
    ) {

        const kelompok = jurnalIds.slice(
            i,
            i + ukuranKelompok
        );


        const data = await ambilSemuaDataLedger(

            "detail_jurnal",

            `
                id,
                jurnal_id,
                akun_id,
                keterangan,
                debit,
                kredit
            `,

            query => query
                .eq("akun_id", akunId)
                .in("jurnal_id", kelompok)

        );


        seluruhDetail.push(...data);

    }


    return seluruhDetail;

}


// =============================================
// RESET RINGKASAN
// =============================================

function resetLedger() {

    [
        "saldoAwal",
        "totalDebit",
        "totalKredit",
        "saldoAkhir"

    ].forEach(id => {

        document.getElementById(id).textContent =
            formatRupiahLedger(0);

    });

}


// =============================================
// LOAD BUKU BESAR
// =============================================

async function loadBukuBesar() {

    const tbody = document.getElementById(
        "ledgerTableBody"
    );

    const message = document.getElementById(
        "ledgerMessage"
    );


    try {

        message.textContent =
            "Mengambil data buku besar...";


        const akunId = document.getElementById(
            "akunSelect"
        ).value;

        const tanggalMulai = document.getElementById(
            "tanggalMulai"
        ).value;

        const tanggalAkhir = document.getElementById(
            "tanggalAkhir"
        ).value;


        if (!akunId) {

            throw new Error(
                "Silakan pilih akun terlebih dahulu."
            );

        }


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


        // =====================================
        // 1. AMBIL AKUN TERPILIH
        // =====================================

        const { data: akun, error: akunError } =
            await window.db

                .from("akun")

                .select(`
                    id,
                    kode_akun,
                    nama_akun,
                    kategori,
                    saldo_normal
                `)

                .eq("id", akunId)

                .single();


        if (akunError) {

            throw akunError;

        }


        document.getElementById(
            "namaAkun"
        ).textContent =
            `${akun.kode_akun} - ${akun.nama_akun}`;


        document.getElementById(
            "kategoriAkun"
        ).textContent =
            `${akun.kategori.toUpperCase()} | Saldo normal ${akun.saldo_normal}`;


        // =====================================
        // 2. TENTUKAN BATAS TANGGAL
        // =====================================

        const startISO =
            `${tanggalMulai}T00:00:00+07:00`;


        const nextDate =
            hariBerikutnyaLedger(tanggalAkhir);


        const endISO =
            `${nextDate}T00:00:00+07:00`;


        // =====================================
        // 3. AMBIL HEADER JURNAL
        // =====================================

        const jurnalData = await loadHeaderLedger(
            endISO
        );


        if (jurnalData.length === 0) {

            resetLedger();

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Belum terdapat jurnal.
                    </td>
                </tr>
            `;

            message.textContent =
                "Belum ada jurnal yang diposting sampai akhir periode.";

            return;

        }


        const jurnalIds = jurnalData.map(
            jurnal => jurnal.id
        );


        // =====================================
        // 4. AMBIL DETAIL AKUN
        // =====================================

        const detailData = await loadDetailLedger(
            akunId,
            jurnalIds
        );


        // =====================================
        // 5. HUBUNGKAN DETAIL DENGAN HEADER
        // =====================================

        const jurnalMap = new Map();

        jurnalData.forEach(jurnal => {

            jurnalMap.set(
                jurnal.id,
                jurnal
            );

        });


        const baris = detailData

            .map(detail => {

                return {

                    ...detail,

                    jurnal: jurnalMap.get(
                        detail.jurnal_id
                    )

                };

            })

            .filter(item => item.jurnal)

            .sort((a, b) => {

                const bedaTanggal =
                    new Date(a.jurnal.tanggal) -
                    new Date(b.jurnal.tanggal);

                if (bedaTanggal !== 0) {

                    return bedaTanggal;

                }

                return a.jurnal.nomor_jurnal.localeCompare(
                    b.jurnal.nomor_jurnal
                );

            });


        // =====================================
        // 6. HITUNG SALDO AWAL
        // =====================================

        const normalDebit =
            akun.saldo_normal.toLowerCase() === "debit";


        function mutasiSaldo(detail) {

            const debit =
                Number(detail.debit) || 0;

            const kredit =
                Number(detail.kredit) || 0;

            return normalDebit
                ? debit - kredit
                : kredit - debit;

        }


        let saldoAwal = 0;

        let totalDebit = 0;

        let totalKredit = 0;


        const barisPeriode = [];


        baris.forEach(detail => {

            const tanggal =
                detail.jurnal.tanggal;


            const mutasi =
                mutasiSaldo(detail);


            if (tanggal < startISO) {

                saldoAwal += mutasi;

            } else if (tanggal < endISO) {

                totalDebit +=
                    Number(detail.debit) || 0;

                totalKredit +=
                    Number(detail.kredit) || 0;

                barisPeriode.push(detail);

            }

        });


        // =====================================
        // 7. HITUNG SALDO BERJALAN
        // =====================================

        let saldoBerjalan = saldoAwal;

        let html = "";


        if (barisPeriode.length === 0) {

            html = `
                <tr>
                    <td colspan="6">
                        Tidak ada mutasi akun pada periode ini.
                    </td>
                </tr>
            `;

        }


        barisPeriode.forEach(detail => {

            saldoBerjalan +=
                mutasiSaldo(detail);


            const debit =
                Number(detail.debit) || 0;

            const kredit =
                Number(detail.kredit) || 0;


            const saldoArah = saldoBerjalan >= 0
                ? akun.saldo_normal.toUpperCase()
                : (
                    akun.saldo_normal.toLowerCase() === "debit"
                        ? "KREDIT"
                        : "DEBIT"
                );


            const saldoText =
                `${formatRupiahLedger(Math.abs(saldoBerjalan))} (${saldoArah})`;


            html += `

                <tr>

                    <td>
                        ${formatTanggalLedger(
                            detail.jurnal.tanggal
                        )}
                    </td>

                    <td>
                        ${escapeLedger(
                            detail.jurnal.nomor_jurnal
                        )}
                    </td>

                    <td>
                        ${escapeLedger(
                            detail.keterangan ||
                            detail.jurnal.keterangan
                        )}
                    </td>

                    <td class="ledger-amount">
                        ${
                            debit > 0
                                ? formatRupiahLedger(debit)
                                : "-"
                        }
                    </td>

                    <td class="ledger-amount">
                        ${
                            kredit > 0
                                ? formatRupiahLedger(kredit)
                                : "-"
                        }
                    </td>

                    <td class="ledger-amount ledger-balance">
                        ${saldoText}
                    </td>

                </tr>

            `;

        });


        tbody.innerHTML = html;


        // =====================================
        // 8. UPDATE RINGKASAN
        // =====================================

        document.getElementById(
            "saldoAwal"
        ).textContent =
            `${formatRupiahLedger(Math.abs(saldoAwal))} ${
                saldoAwal < 0 ? "(Tidak Normal)" : ""
            }`;


        document.getElementById(
            "totalDebit"
        ).textContent =
            formatRupiahLedger(totalDebit);


        document.getElementById(
            "totalKredit"
        ).textContent =
            formatRupiahLedger(totalKredit);


        const saldoAkhirArah =
            saldoBerjalan >= 0
                ? akun.saldo_normal.toUpperCase()
                : (
                    normalDebit
                        ? "KREDIT"
                        : "DEBIT"
                );


        document.getElementById(
            "saldoAkhir"
        ).textContent =
            `${formatRupiahLedger(Math.abs(saldoBerjalan))} (${saldoAkhirArah})`;


        // =====================================
        // 9. STATUS
        // =====================================

        message.textContent =
            `Buku besar akun ${akun.kode_akun} berhasil dimuat. ` +
            `${barisPeriode.length} baris mutasi ditemukan.`;

    } catch (error) {

        console.error(
            "Gagal memuat buku besar:",
            error
        );

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Gagal memuat data buku besar.
                </td>
            </tr>
        `;

        resetLedger();

        message.textContent =
            "Terjadi kesalahan: " +
            (error.message || "Tidak diketahui.");

    }

}


// =============================================
// CETAK BUKU BESAR
// =============================================

function cetakBukuBesar() {

    const akunSelect = document.getElementById(
        "akunSelect"
    );

    const akunNama =
        akunSelect.selectedOptions[0]?.textContent || "";


    const tanggalMulai = document.getElementById(
        "tanggalMulai"
    ).value;

    const tanggalAkhir = document.getElementById(
        "tanggalAkhir"
    ).value;


    document.getElementById(
        "printPeriod"
    ).textContent =
        `Akun: ${akunNama} | Periode: ${tanggalMulai} sampai ${tanggalAkhir}`;


    window.print();

}


// =============================================
// EVENT LISTENER
// =============================================

document.getElementById(
    "filterButton"
).addEventListener(
    "click",
    loadBukuBesar
);


document.getElementById(
    "printButton"
).addEventListener(
    "click",
    cetakBukuBesar
);


// =============================================
// INITIALIZE
// =============================================

async function initializeBukuBesar() {

    try {

        setDefaultLedger();

        await loadDaftarAkunLedger();

        await loadBukuBesar();

    } catch (error) {

        console.error(error);

        document.getElementById(
            "ledgerMessage"
        ).textContent =
            "Gagal menginisialisasi Buku Besar: " +
            error.message;

    }

}


initializeBukuBesar();