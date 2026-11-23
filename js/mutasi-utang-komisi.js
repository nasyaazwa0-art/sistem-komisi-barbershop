// ============================================
// MUTASI UTANG KOMISI
// ============================================

let dataMutasiKomisi = [];


function rupiahMutasi(value) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 2
    }).format(Number(value) || 0);

}


function escapeMutasi(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function setPeriodeDefault() {

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
// LOAD DATA DARI DATABASE
// ============================================

async function loadMutasiUtang() {

    const tbody = document.getElementById(
        "mutasiTableBody"
    );

    const message = document.getElementById(
        "mutasiMessage"
    );


    try {

        message.textContent = "Memuat laporan...";


        const mulai = document.getElementById(
            "tanggalMulai"
        ).value;

        const akhir = document.getElementById(
            "tanggalAkhir"
        ).value;


        if (!mulai || !akhir) {

            throw new Error(
                "Periode tanggal wajib diisi."
            );

        }


        if (mulai > akhir) {

            throw new Error(
                "Tanggal mulai melebihi tanggal akhir."
            );

        }


        const { data, error } = await window.db.rpc(

            "laporan_mutasi_utang_komisi",

            {
                p_tanggal_mulai: mulai,
                p_tanggal_akhir: akhir
            }

        );


        if (error) throw error;


        dataMutasiKomisi = (data || []).map(item => ({

            kapster_id: item.kapster_id,

            nama: item.nama,

            saldo_awal: Number(item.saldo_awal) || 0,

            penambahan_komisi:
                Number(item.penambahan_komisi) || 0,

            pembatalan_komisi:
                Number(item.pembatalan_komisi) || 0,

            pembayaran_komisi:
                Number(item.pembayaran_komisi) || 0,

            saldo_akhir:
                Number(item.saldo_akhir) || 0

        }));


        renderMutasiUtang();


        message.textContent =
            `Laporan berhasil dimuat. ${dataMutasiKomisi.length} kapster ditemukan.`;


    } catch (error) {

        console.error(error);

        dataMutasiKomisi = [];

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Gagal memuat laporan.
                </td>
            </tr>
        `;

        renderRingkasanMutasi();

        message.textContent =
            "Gagal memuat laporan: " + error.message;

    }

}


// ============================================
// HITUNG TOTAL
// ============================================

function hitungTotalMutasi() {

    return dataMutasiKomisi.reduce(

        (total, item) => {

            total.awal += item.saldo_awal;

            total.komisi += item.penambahan_komisi;

            total.pembatalan += item.pembatalan_komisi;

            total.bayar += item.pembayaran_komisi;

            total.akhir += item.saldo_akhir;

            return total;

        },

        {
            awal: 0,
            komisi: 0,
            pembatalan: 0,
            bayar: 0,
            akhir: 0
        }

    );

}


// ============================================
// RINGKASAN
// ============================================

function renderRingkasanMutasi() {

    const total = hitungTotalMutasi();


    document.getElementById(
        "summaryAwal"
    ).textContent = rupiahMutasi(total.awal);


    document.getElementById(
        "summaryKomisi"
    ).textContent = rupiahMutasi(total.komisi);


    document.getElementById(
        "summaryPembatalan"
    ).textContent = rupiahMutasi(total.pembatalan);


    document.getElementById(
        "summaryBayar"
    ).textContent = rupiahMutasi(total.bayar);


    document.getElementById(
        "summaryAkhir"
    ).textContent = rupiahMutasi(total.akhir);


    document.getElementById(
        "totalAwal"
    ).textContent = rupiahMutasi(total.awal);


    document.getElementById(
        "totalKomisi"
    ).textContent = rupiahMutasi(total.komisi);


    document.getElementById(
        "totalPembatalan"
    ).textContent = rupiahMutasi(total.pembatalan);


    document.getElementById(
        "totalBayar"
    ).textContent = rupiahMutasi(total.bayar);


    document.getElementById(
        "totalAkhir"
    ).textContent = rupiahMutasi(total.akhir);

}


// ============================================
// RENDER TABEL
// ============================================

function renderMutasiUtang() {

    const tbody = document.getElementById(
        "mutasiTableBody"
    );


    if (dataMutasiKomisi.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Tidak ada data mutasi utang.
                </td>
            </tr>
        `;

        renderRingkasanMutasi();

        return;

    }


    tbody.innerHTML = dataMutasiKomisi.map(item => `

        <tr>

            <td>
                ${escapeMutasi(item.nama)}
            </td>

            <td>
                ${rupiahMutasi(item.saldo_awal)}
            </td>

            <td>
                ${rupiahMutasi(item.penambahan_komisi)}
            </td>

            <td>
                ${rupiahMutasi(item.pembatalan_komisi)}
            </td>

            <td>
                ${rupiahMutasi(item.pembayaran_komisi)}
            </td>

            <td class="mutasi-outstanding">
                ${rupiahMutasi(item.saldo_akhir)}
            </td>

        </tr>

    `).join("");


    renderRingkasanMutasi();

}


// ============================================
// EKSPOR CSV
// ============================================

function escapeCSVMutasi(value) {

    let text = String(value ?? "");

    if (/^[\t\r ]*[=+\-@]/.test(text)) {

        text = "'" + text;

    }

    return '"' + text.replace(/"/g, '""') + '"';

}


function exportMutasiCSV() {

    if (dataMutasiKomisi.length === 0) {

        alert("Tidak ada data untuk diekspor.");

        return;

    }


    const mulai = document.getElementById(
        "tanggalMulai"
    ).value;

    const akhir = document.getElementById(
        "tanggalAkhir"
    ).value;


    const rows = [

        ["LAPORAN MUTASI UTANG KOMISI KAPSTER"],

        ["Periode", mulai, "sampai", akhir],

        [],

        [
            "Nama Kapster",
            "Saldo Awal",
            "Penambahan Komisi",
            "Pembatalan Komisi",
            "Pembayaran Komisi",
            "Saldo Akhir"
        ]

    ];


    dataMutasiKomisi.forEach(item => {

        rows.push([

            item.nama,

            item.saldo_awal,

            item.penambahan_komisi,

            item.pembatalan_komisi,

            item.pembayaran_komisi,

            item.saldo_akhir

        ]);

    });


    const total = hitungTotalMutasi();


    rows.push([

        "TOTAL",

        total.awal,

        total.komisi,

        total.pembatalan,

        total.bayar,

        total.akhir

    ]);


    const csv = "\uFEFF" + rows.map(row =>

        row.map(escapeCSVMutasi).join(",")

    ).join("\r\n");


    const blob = new Blob(

        [csv],

        { type: "text/csv;charset=utf-8;" }

    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");


    link.href = url;

    link.download =
        `mutasi-utang-komisi-${mulai}-${akhir}.csv`;


    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(() => {

        URL.revokeObjectURL(url);

    }, 1000);

}


// ============================================
// CETAK PDF
// ============================================

function printMutasi() {

    const mulai = document.getElementById(
        "tanggalMulai"
    ).value;

    const akhir = document.getElementById(
        "tanggalAkhir"
    ).value;


    document.getElementById(
        "printPeriod"
    ).textContent =
        `Periode: ${mulai} sampai ${akhir}`;


    window.print();

}


// ============================================
// EVENT LISTENER
// ============================================

document.getElementById(
    "filterButton"
).addEventListener("click", loadMutasiUtang);


document.getElementById(
    "exportButton"
).addEventListener("click", exportMutasiCSV);


document.getElementById(
    "printButton"
).addEventListener("click", printMutasi);


// ============================================
// INITIALIZE
// ============================================

setPeriodeDefault();

loadMutasiUtang();