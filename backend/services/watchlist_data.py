"""
InsightSaham — Curated Watchlist Data
Master definitions for curated watchlists: Konglomerat, Perbankan, Tambang, Perkapalan, Kesehatan.
"""
from typing import TypedDict, Optional


class WatchlistStock(TypedDict):
    code: str
    name: str
    sector: str


class WatchlistGroup(TypedDict):
    name: str
    short_name: str
    stocks: list[WatchlistStock]


class WatchlistCategory(TypedDict):
    id: str
    title: str
    icon: str
    description: str
    groups: list[WatchlistGroup]


CURATED_WATCHLIST: list[WatchlistCategory] = [
    {
        "id": "konglomerat",
        "title": "Saham Konglomerat (per Grup)",
        "icon": "🏢",
        "description": "Grup konglomerasi terkemuka dan penggerak pasar di Bursa Efek Indonesia",
        "groups": [
            {
                "name": "Grup Prajogo Pangestu (Barito Group)",
                "short_name": "Barito Group",
                "stocks": [
                    {"code": "BRPT", "name": "Barito Pacific Tbk.", "sector": "Industri Dasar"},
                    {"code": "BREN", "name": "Barito Renewables Energy Tbk.", "sector": "Infrastruktur"},
                    {"code": "TPIA", "name": "Chandra Asri Pacific Tbk.", "sector": "Industri Dasar"},
                    {"code": "CUAN", "name": "Petrindo Jaya Kreasi Tbk.", "sector": "Pertambangan"},
                    {"code": "PTRO", "name": "Petrosea Tbk.", "sector": "Infrastruktur & Tambang"},
                    {"code": "CDIA", "name": "Chandra Daya Investasi", "sector": "Infrastruktur"},
                ],
            },
            {
                "name": "Grup Djarum (Keluarga Hartono)",
                "short_name": "Djarum Group",
                "stocks": [
                    {"code": "BBCA", "name": "Bank Central Asia Tbk.", "sector": "Keuangan"},
                    {"code": "SSIA", "name": "Surya Semesta Internusa Tbk.", "sector": "Properti & Kawasan Industri"},
                    {"code": "TOWR", "name": "Sarana Menara Nusantara Tbk.", "sector": "Infrastruktur"},
                    {"code": "DATA", "name": "Kolaborasi Pintar Digital Tbk. (iForte)", "sector": "Teknologi"},
                    {"code": "BELI", "name": "Global Digital Niaga Tbk. (Blibli)", "sector": "Teknologi & Ritel"},
                    {"code": "RANC", "name": "Supra Boga Lestari Tbk. (Ranch Market)", "sector": "Barang Konsumsi"},
                    {"code": "HEAL", "name": "Medikaloka Hermina Tbk. (Djarum)", "sector": "Kesehatan"},
                ],
            },
            {
                "name": "Grup Salim (Anthoni Salim)",
                "short_name": "Salim Group",
                "stocks": [
                    {"code": "INDF", "name": "Indofood Sukses Makmur Tbk.", "sector": "Barang Konsumsi"},
                    {"code": "ICBP", "name": "Indofood CBP Sukses Makmur Tbk.", "sector": "Barang Konsumsi"},
                    {"code": "DCII", "name": "DCI Indonesia Tbk. (Data Center)", "sector": "Teknologi"},
                    {"code": "SIMP", "name": "Salim Ivomas Pratama Tbk.", "sector": "Perkebunan & Pangan"},
                    {"code": "LSIP", "name": "PP London Sumatra Indonesia Tbk.", "sector": "Perkebunan"},
                ],
            },
            {
                "name": "Grup Sinarmas (Keluarga Widjaja)",
                "short_name": "Sinarmas Group",
                "stocks": [
                    {"code": "BSDE", "name": "Bumi Serpong Damai Tbk.", "sector": "Properti & Real Estat"},
                    {"code": "DMAS", "name": "Puradelta Lestari Tbk.", "sector": "Properti & Industri"},
                    {"code": "BSIM", "name": "Bank Sinarmas Tbk.", "sector": "Keuangan"},
                    {"code": "SMMA", "name": "Sinarmas Multiartha Tbk.", "sector": "Keuangan"},
                    {"code": "DSSA", "name": "Dian Swastatika Sentosa Tbk.", "sector": "Energi & Infrastruktur"},
                    {"code": "GEMS", "name": "Golden Energy Mines Tbk.", "sector": "Pertambangan"},
                    {"code": "INKP", "name": "Indah Kiat Pulp & Paper Tbk.", "sector": "Industri Dasar"},
                    {"code": "TKIM", "name": "Pabrik Kertas Tjiwi Kimia Tbk.", "sector": "Industri Dasar"},
                    {"code": "SMAR", "name": "Sinar Mas Agro Resources and Technology Tbk.", "sector": "Perkebunan"},
                ],
            },
            {
                "name": "Grup Astra",
                "short_name": "Astra Group",
                "stocks": [
                    {"code": "ASII", "name": "Astra International Tbk.", "sector": "Konglomerasi / Otomotif"},
                    {"code": "AUTO", "name": "Astra Otoparts Tbk.", "sector": "Otomotif & Komponen"},
                    {"code": "UNTR", "name": "United Tractors Tbk.", "sector": "Mesin Berat & Tambang"},
                    {"code": "AALI", "name": "Astra Agro Lestari Tbk.", "sector": "Perkebunan"},
                ],
            },
            {
                "name": "Grup Lippo",
                "short_name": "Lippo Group",
                "stocks": [
                    {"code": "LPKR", "name": "Lippo Karawaci Tbk.", "sector": "Properti & Real Estat"},
                    {"code": "LPCK", "name": "Lippo Cikarang Tbk.", "sector": "Properti & Industri"},
                    {"code": "MPPA", "name": "Matahari Putra Prima Tbk.", "sector": "Ritel & Konsumsi"},
                ],
            },
            {
                "name": "Grup Bakrie",
                "short_name": "Bakrie Group",
                "stocks": [
                    {"code": "BUMI", "name": "Bumi Resources Tbk.", "sector": "Pertambangan"},
                    {"code": "BRMS", "name": "Bumi Resources Minerals Tbk.", "sector": "Pertambangan Mineral"},
                    {"code": "DEWA", "name": "Darma Henwa Tbk.", "sector": "Jasa Pertambangan"},
                    {"code": "VIVA", "name": "Visi Media Asia Tbk.", "sector": "Media & Hiburan"},
                    {"code": "BNBR", "name": "Bakrie & Brothers Tbk.", "sector": "Infrastruktur & Industri"},
                ],
            },
            {
                "name": "Grup CT Corp",
                "short_name": "CT Corp",
                "stocks": [
                    {"code": "BBHI", "name": "Allo Bank Indonesia Tbk.", "sector": "Bank Digital & Keuangan"},
                ],
            },
        ],
    },
    {
        "id": "perbankan",
        "title": "Saham Perbankan",
        "icon": "🏦",
        "description": "Sektor finansial dan perbankan Indonesia (Big 4, Syariah, BUMN, Swasta & Digital)",
        "groups": [
            {
                "name": "Bank Jumbo (KBMI IV)",
                "short_name": "KBMI IV (Big 4)",
                "stocks": [
                    {"code": "BBCA", "name": "Bank Central Asia Tbk.", "sector": "Keuangan"},
                    {"code": "BBRI", "name": "Bank Rakyat Indonesia Tbk.", "sector": "Keuangan"},
                    {"code": "BMRI", "name": "Bank Mandiri Tbk.", "sector": "Keuangan"},
                    {"code": "BBNI", "name": "Bank Negara Indonesia Tbk.", "sector": "Keuangan"},
                ],
            },
            {
                "name": "Bank Syariah & BUMN Lainnya",
                "short_name": "Syariah & BUMN",
                "stocks": [
                    {"code": "BRIS", "name": "Bank Syariah Indonesia Tbk.", "sector": "Keuangan"},
                    {"code": "BBTN", "name": "Bank Tabungan Negara Tbk.", "sector": "Keuangan"},
                ],
            },
            {
                "name": "Bank Swasta Menengah",
                "short_name": "Swasta Menengah",
                "stocks": [
                    {"code": "BNGA", "name": "Bank CIMB Niaga Tbk.", "sector": "Keuangan"},
                    {"code": "PNBN", "name": "Bank Pan Indonesia Tbk. (Panin)", "sector": "Keuangan"},
                    {"code": "NISP", "name": "Bank OCBC NISP Tbk.", "sector": "Keuangan"},
                    {"code": "BJTM", "name": "Bank Pembangunan Daerah Jawa Timur Tbk.", "sector": "Keuangan"},
                    {"code": "BJBR", "name": "Bank Pembangunan Daerah Jawa Barat Tbk.", "sector": "Keuangan"},
                ],
            },
            {
                "name": "Bank Digital",
                "short_name": "Bank Digital",
                "stocks": [
                    {"code": "ARTO", "name": "Bank Jago Tbk.", "sector": "Keuangan"},
                    {"code": "BBHI", "name": "Allo Bank Indonesia Tbk.", "sector": "Keuangan"},
                    {"code": "BBYB", "name": "Bank Neo Commerce Tbk.", "sector": "Keuangan"},
                    {"code": "AGRO", "name": "Bank Raya Indonesia Tbk.", "sector": "Keuangan"},
                    {"code": "BANK", "name": "Bank Aladin Syariah Tbk.", "sector": "Keuangan"},
                    {"code": "BINA", "name": "Bank Ina Perdana Tbk.", "sector": "Keuangan"},
                ],
            },
        ],
    },
    {
        "id": "tambang",
        "title": "Saham Tambang",
        "icon": "⛏️",
        "description": "Komoditas energi batu bara, nikel, dan emas unggulan",
        "groups": [
            {
                "name": "Batu Bara",
                "short_name": "Batu Bara",
                "stocks": [
                    {"code": "ADRO", "name": "Alamtri Resources Indonesia Tbk.", "sector": "Pertambangan"},
                    {"code": "ADMR", "name": "Alamtri Minerals Indonesia Tbk.", "sector": "Pertambangan"},
                    {"code": "AADI", "name": "Adaro Andalan Indonesia Tbk.", "sector": "Pertambangan"},
                    {"code": "PTBA", "name": "Bukit Asam Tbk. (BUMN/MIND ID)", "sector": "Pertambangan"},
                    {"code": "ITMG", "name": "Indo Tambangraya Megah Tbk.", "sector": "Pertambangan"},
                    {"code": "HRUM", "name": "Harum Energy Tbk.", "sector": "Pertambangan"},
                    {"code": "INDY", "name": "Indika Energy Tbk.", "sector": "Pertambangan"},
                    {"code": "BSSR", "name": "Baramukti Suksessarana Tbk.", "sector": "Pertambangan"},
                ],
            },
            {
                "name": "Emas & Nikel",
                "short_name": "Emas & Nikel",
                "stocks": [
                    {"code": "ANTM", "name": "Aneka Tambang Tbk. (BUMN/MIND ID)", "sector": "Pertambangan"},
                    {"code": "INCO", "name": "Vale Indonesia Tbk.", "sector": "Pertambangan"},
                ],
            },
        ],
    },
    {
        "id": "perkapalan",
        "title": "Saham Perkapalan/Pelayaran",
        "icon": "🚢",
        "description": "Emiten logistik maritim, tanker migas, kontainer, dan pelayaran lepas pantai",
        "groups": [
            {
                "name": "Perkapalan & Pelayaran",
                "short_name": "Shipping & Logistics",
                "stocks": [
                    {"code": "SMDR", "name": "Samudera Indonesia Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "TMAS", "name": "Temas Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "BULL", "name": "Buana Lintas Lautan Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "HUMI", "name": "Humpuss Maritim Internasional Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "SOCI", "name": "Soechi Lines Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "LEAD", "name": "Logindo Samudramakmur Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "NELY", "name": "Pelayaran Nelly Dwi Putri Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "ELPI", "name": "Pelayaran Nasional Ekalya Purnamasari Tbk.", "sector": "Transportasi & Logistik"},
                    {"code": "WINS", "name": "Wintermar Offshore Marine Tbk.", "sector": "Transportasi & Logistik"},
                ],
            },
        ],
    },
    {
        "id": "kesehatan",
        "title": "Saham Kesehatan",
        "icon": "🏥",
        "description": "Jaringan rumah sakit terkemuka dan industri farmasi nasional",
        "groups": [
            {
                "name": "Rumah Sakit",
                "short_name": "Rumah Sakit",
                "stocks": [
                    {"code": "MIKA", "name": "Mitra Keluarga Karyasehat Tbk.", "sector": "Kesehatan"},
                    {"code": "SILO", "name": "Siloam International Hospitals Tbk.", "sector": "Kesehatan"},
                    {"code": "HEAL", "name": "Medikaloka Hermina Tbk.", "sector": "Kesehatan"},
                    {"code": "SRAJ", "name": "Sejahteraraya Anugrahjaya Tbk. (Mayapada Hospital)", "sector": "Kesehatan"},
                ],
            },
            {
                "name": "Farmasi",
                "short_name": "Farmasi",
                "stocks": [
                    {"code": "KLBF", "name": "Kalbe Farma Tbk.", "sector": "Kesehatan"},
                    {"code": "SIDO", "name": "Industri Jamu dan Farmasi Sido Muncul Tbk.", "sector": "Barang Konsumsi / Farmasi"},
                ],
            },
        ],
    },
]


def get_all_watchlist_stocks() -> dict[str, dict]:
    """Return dictionary of all unique stocks in the curated watchlist."""
    stocks: dict[str, dict] = {}
    for cat in CURATED_WATCHLIST:
        for grp in cat["groups"]:
            for item in grp["stocks"]:
                code = item["code"]
                if code not in stocks:
                    stocks[code] = {
                        "name": item["name"],
                        "sector": item["sector"],
                    }
    return stocks
