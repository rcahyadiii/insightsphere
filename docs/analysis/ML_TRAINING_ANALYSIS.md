# 📊 Analisis Hasil Training Model AI

**Tanggal**: 18 April 2026
**Model**: XGBoost Tweedie Multi-Horizon (7/14/21/28 hari)
**Dataset**: Corporación Favorita (Kaggle) - 500,000 sample dari 3M total rows
**Training Time**: 14.7 detik (sangat cepat)

---

## 🎯 Ringkasan Hasil

| Metrik | H+7 | H+14 | H+21 | H+28 | Penilaian |
|--------|-----|------|------|------|-----------|
| **MAE** | 59.04 | 61.47 | 66.37 | 70.38 | ✅ Baik |
| **RMSE** | 235.33 | 239.65 | 252.78 | 263.40 | ⚠️ Ada outlier |
| **R²** | **0.9658** | **0.9649** | **0.9613** | **0.9583** | 🎉 Sangat Baik |
| **WAPE** | **12.06%** | **12.50%** | **13.44%** | **14.22%** | ✅ Baik (target <20%) |
| **Bias** | -55.79 | -58.12 | -60.31 | -63.09 | ⚠️ Under-predict |
| **P95 Error** | 316.43 | 339.71 | 368.81 | 390.78 | ✅ Untuk safety stock |

**🏆 Model Terbaik: H+7** dengan WAPE 12.06% dan R² 0.9658

---

## 📈 Penjelasan Detail Setiap Metrik

### 1. R² (Coefficient of Determination): **0.9583 - 0.9658** 🎉

**Arti**: Persentase variasi penjualan yang bisa dijelaskan oleh model.
- **Range**: -∞ sampai 1.0 (semakin dekat 1 = semakin baik)
- **Hasil kita**: Model menjelaskan **95.83% - 96.58%** variasi data

**Benchmark Industri Retail Demand Forecasting:**
| R² | Kategori |
|---|---|
| > 0.95 | **Excellent** ← Kita di sini |
| 0.85 - 0.95 | Good |
| 0.70 - 0.85 | Acceptable |
| < 0.70 | Poor |

**Kesimpulan**: 🎉 **SANGAT BAIK**. Model menangkap pola penjualan hampir sempurna.

---

### 2. WAPE (Weighted Absolute Percentage Error): **12.06% - 14.22%** ✅

**Arti**: Rata-rata persentase error dari total penjualan.
- Lebih baik dari MAPE karena tidak bias ke item low-volume
- **Formula**: `Σ|actual - predicted| / Σ|actual|`

**Benchmark Industri:**
| WAPE | Kategori |
|---|---|
| < 10% | Excellent (jarang tercapai) |
| 10% - 20% | **Good** ← Kita di sini |
| 20% - 30% | Acceptable |
| > 30% | Poor |

**Contoh Praktis:**
- Kalau toko jual 1000 unit/minggu, error kita ±120 unit (12%)
- Untuk keputusan restock dengan safety buffer, ini **production-ready**

**Kesimpulan**: ✅ **BAIK**. Siap untuk deployment.

---

### 3. MAE (Mean Absolute Error): **59 - 70 unit** ✅

**Arti**: Rata-rata selisih mutlak antara prediksi dan aktual.
- **Satuan**: Unit produk
- Interpretasi: H+7 prediksi meleset rata-rata 59 unit

**Kontekstualisasi:**
- Toko Corporación Favorita rata-rata jual ratusan unit/family/hari
- Error 59 unit = relatif kecil
- Konsisten dengan WAPE 12%

**Kesimpulan**: ✅ **BAIK**. Error actionable untuk ops.

---

### 4. RMSE (Root Mean Squared Error): **235 - 263** ⚠️

**Arti**: Akar dari rata-rata kuadrat error. Menghukum error besar lebih berat.
- **RMSE > MAE** selalu, tapi rasio-nya penting
- **Rasio RMSE/MAE kita = ~4x** (normal: 1.2-2x)

**Diagnosis Rasio Tinggi:**
- Ada **outlier signifikan** — beberapa hari/produk dengan error ekstrem (>1000 unit)
- Kemungkinan: hari promosi besar, event khusus, produk viral
- Model belum menangkap sempurna lonjakan tak terduga

**Kesimpulan**: ⚠️ **Perlu Perhatian**. Tidak fatal karena safety stock mechanism sudah ada.

---

### 5. Bias: **-55 sampai -63 (NEGATIF)** ⚠️

**Arti**: Rata-rata `(prediksi - aktual)`. Idealnya mendekati 0.
- **Negatif** → Model **UNDER-PREDICT** (prediksi selalu lebih rendah dari kenyataan)
- **Magnitude**: ~55-63 unit konsisten under-predict

**Implikasi Bisnis:**
- 🚨 **Risiko OUT-OF-STOCK** kalau restock pure berdasarkan prediksi mentah
- **Sudah Di-mitigasi**: kode pakai `safety_stock_quantile=0.85` yang tambah buffer dari P85 under-forecast error per segment

**Mitigasi Multi-Layer:**
1. **Segment-level buffer** (store × family) — paling granular
2. **Family-level buffer** — fallback
3. **Global buffer** — worst case
4. Buffer dihitung dari P85 distribusi under-forecast error pada validation set

**Kesimpulan**: ⚠️ **Under-predict systematic, tapi sudah dikompensasi safety buffer.**

---

### 6. P95 Error: **316 - 391 unit** ✅

**Arti**: 95% prediksi errornya di bawah angka ini.
- 5% worst-case punya error > 316 unit (H+7)
- Digunakan untuk menghitung safety stock buffer

**Kesimpulan**: ✅ Parameter konservatif untuk inventory planning.

---

## 📉 Tren Antar Horizon

```
Horizon    WAPE      R²       MAE
H+7  →     12.06%    0.9658   59.04  ← Terbaik
H+14 →     12.50%    0.9649   61.47
H+21 →     13.44%    0.9613   66.37
H+28 →     14.22%    0.9583   70.38  ← Terburuk
```

**Pola yang Terlihat:**
- ✅ Degradasi akurasi seiring horizon membesar → **NORMAL & EXPECTED**
- ✅ Prediksi 28 hari ke depan pasti lebih sulit daripada 7 hari
- ✅ R² masih >95% bahkan di H+28 → model robust

---

## 🎯 Penilaian Keseluruhan: **BAIK** ✅

### ✅ Kekuatan Model
1. **R² 96%+** di semua horizon — excellent level
2. **WAPE <15%** — production-ready accuracy
3. **Safety stock mechanism** — mengompensasi bias negatif
4. **Zero data leakage**:
   - Chronological train/test split (bukan random)
   - Outlier clipping dari train set saja
   - Oil price forward-fill only (tidak leak masa depan)
5. **Multi-horizon coverage** — fleksibel untuk berbagai use case ops
6. **Training super cepat** — 14.7 detik untuk 500K rows × 4 model
7. **SHAP explainability** — ada untuk H+7 (interpretasi per prediksi)

### ⚠️ Area yang Bisa Ditingkatkan

| Issue | Severity | Rekomendasi |
|-------|----------|-------------|
| **Bias negatif konsisten** | 🟡 Medium | Tambah constant shift +55 atau retune Tweedie variance power |
| **RMSE/MAE rasio tinggi** | 🟡 Medium | Outlier detection pre-processing atau Huber loss |
| **No hyperparameter tuning** | 🟢 Low | Pakai Optuna untuk cari best `max_depth`, `lr`, `n_estimators` per horizon |
| **Sample 500K dari 3M** | 🟢 Low | Train dengan full dataset (estimasi 2-3 menit) |
| **Fixed train/test ratio 80/20** | 🟢 Low | Time-series CV (5 folds) untuk evaluasi lebih robust |

---

## 🚀 Rekomendasi Kapan Deploy?

### ✅ **SIAP DEPLOY** kalau:
- Use case: demand forecasting untuk restock bulanan/mingguan
- Tolerance error: ±15% dari aktual
- Sudah pakai safety stock mechanism
- Monitoring drift dengan `AIModelMetric` table

### 🛑 **JANGAN DEPLOY** kalau:
- Use case: real-time restock otomatis tanpa human review
- Zero-inventory target (out-of-stock = bencana)
- Produk dengan lifecycle pendek (<30 hari)

### 📌 Kondisi Production di InsightSphere
Kode sudah menangani ini dengan baik:
- Admin/cashier punya UI untuk review prediksi sebelum action
- Ada `reasoning_text` dari SHAP untuk transparansi
- `recommend_stock()` bukan `force_stock()` — final decision di user

**Verdict: MODEL LAYAK PRODUCTION untuk current use case.** 🚀

---

## 📦 Model Artifacts Tersimpan

Lokasi: `backend/domains/intelligence/artifacts/`

```
encoder.joblib        (TargetEncoder untuk categorical)
explainer_7d.joblib   (SHAP TreeExplainer untuk H+7)
model_7d.joblib       (XGBoost Tweedie H+7) ← Best
model_14d.joblib
model_21d.joblib
model_28d.joblib
```

**Total size**: ~5-10 MB (efisien untuk deploy)

---

## 🧪 Eksperimen Tambahan (Opsional)

Kalau mau improve model lebih jauh:

```bash
# 1. Full dataset training (3M rows)
$env:STOCK_TRAINING_LIMIT="0"
python backend/local_training.py

# 2. Adjust safety quantile (lebih aggressive buffer)
$env:STOCK_SAFETY_STOCK_QUANTILE="0.95"

# 3. Hyperparameter tuning dengan Optuna
# (perlu implement custom script)
```

---

## 📚 Glossary Teknis

| Istilah | Singkatan | Penjelasan |
|---------|-----------|------------|
| **MAE** | Mean Absolute Error | Rata-rata error mutlak |
| **RMSE** | Root Mean Squared Error | Akar rata-rata error kuadrat (penalti outlier) |
| **R²** | R-Squared | Persentase variasi yang dijelaskan model |
| **WAPE** | Weighted Absolute Percentage Error | MAPE versi robust (tidak bias ke low-volume) |
| **Bias** | Forecast Bias | Rata-rata (prediksi - aktual). Ideal = 0 |
| **P95** | 95th Percentile | Nilai di mana 95% data di bawahnya |
| **SHAP** | Shapley Additive exPlanations | Framework explainability untuk ML |
| **Tweedie** | Tweedie Distribution | Distribusi probabilitas cocok untuk retail (banyak zero sales) |
