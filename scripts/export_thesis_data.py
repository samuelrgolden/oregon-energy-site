"""Export thesis-model data for the scrollytelling landing page.

Reproduces the production spec from `Combined Data/Multi_City_Figure_Prep.ipynb`
(hybrid OLS + XGBoost, chronological 80/20 split, five climate stations) and
writes chart-ready JSON into src/data/. The model code below is copied verbatim
from the notebook so the site's numbers are the thesis's numbers.

Run time ~2-3 minutes (the PACW xlsx is 63 MB). Rerun only when the thesis
data or spec changes.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT.parent / "Combined Data"
OUT = ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)


# =====================================================================
# Verbatim from Multi_City_Figure_Prep.ipynb (cells 1-8)
# =====================================================================
def wet_bulb_temp(T_f, Td_f):
    """Approximate wet-bulb temperature using Stull (2011). °F in/out."""
    T = (T_f - 32) * 5 / 9
    Td = (Td_f - 32) * 5 / 9
    RH = 100 * np.exp((17.625 * Td) / (243.04 + Td) - (17.625 * T) / (243.04 + T))
    Tw = (
        T * np.arctan(0.151977 * np.sqrt(RH + 8.313659))
        + np.arctan(T + RH)
        - np.arctan(RH - 1.676331)
        + 0.00391838 * RH ** 1.5 * np.arctan(0.023101 * RH)
        - 4.686035
    )
    return Tw * 9 / 5 + 32


print("Loading PACW xlsx (slow)...")
pacw = pd.read_excel(DATA_DIR / "PACW-Copy1.xlsx")
pacw["datetime"] = pd.to_datetime(pacw["Local time"])
pacw = pacw.dropna(subset=["datetime"]).set_index("datetime").sort_index()

keep2 = [
    "Demand", "Net generation", "Total interchange", "Consumed Electricity",
    "CO2 Emissions Consumed",
]
daily_pacw = pacw[keep2].resample("D").mean() * 24
for bad in ["2016-11-16", "2016-11-17", "2016-03-02", "2016-11-15", "2016-01-10", "2016-10-13"]:
    daily_pacw = daily_pacw.drop(bad)
daily_pacw = daily_pacw.sort_index()

daily_pacw.loc[daily_pacw["Demand"] >= 100000, "Demand"] = np.nan
min_val = daily_pacw["Demand"].min()
daily_pacw.loc[daily_pacw["Demand"] == min_val, "Demand"] = np.nan
daily_pacw["Demand"] = daily_pacw["Demand"].interpolate(method="linear", limit_direction="both")

PRISM_FILES = {
    "Albany": "PRISMalbany_ppt_tmin_tmean_tmax_tdmean_vpdmin_vpdmax_Likely_to_change_4km_19810101_20260101_44.6282_-123.0903.csv",
    "Eugene": "PRISM eugene data44-Copy1.0408_-123.0870.csv",
    "Bend": "PRISM Bend data44-Copy1.0465_-121.3274.csv",
    "Portland": "PRISM Portland data5-Copy1.5030_-122.6730.csv",
    "Medford": "PRISMmedford_ppt_tmin_tmean_tmax_tdmean_vpdmin_vpdmax_Likely_to_change_4km_19810101_20260101_42.3225_-122.8820.csv",
}


def build_merged_city(prism_path):
    weather = pd.read_csv(DATA_DIR / prism_path, skiprows=10, parse_dates=["Date"])
    weather["Date"] = pd.to_datetime(weather["Date"])
    weather = weather.set_index("Date").sort_index()
    weather.index = weather.index.normalize()

    pacw_local = daily_pacw.copy()
    pacw_local.index = pd.to_datetime(pacw_local.index).normalize()

    merged = pacw_local.join(weather, how="left")
    merged = merged.loc["2015-07-01":merged.index.max()]

    merged["day_of_week"] = merged.index.dayofweek
    merged["month"] = merged.index.month
    merged["weekend"] = (merged["day_of_week"] >= 5).astype(int)
    merged["temp_squared"] = merged["tmean (degrees F)"] ** 2
    merged["CDD"] = np.maximum(0, merged["tmean (degrees F)"] - 58)
    merged["HDD"] = np.maximum(0, 58 - merged["tmean (degrees F)"])
    merged["post_july_2022"] = (merged.index >= "2022-07-07").astype(int)
    merged["wet_bulb_F"] = wet_bulb_temp(
        merged["tmean (degrees F)"], merged["tdmean (degrees F)"]
    )
    return merged


def fit_city(merged_df):
    temp_vars = ["tmean (degrees F)", "temp_squared", "CDD", "HDD"]
    resid_vars = [
        "tmax (degrees F)", "tmin (degrees F)", "wet_bulb_F",
        "ppt (inches)", "day_of_week", "month", "weekend",
        "post_july_2022", "tdmean (degrees F)",
    ]
    co2_ols_vars = [
        "Demand", "tmean (degrees F)", "temp_squared", "CDD", "HDD",
        "post_july_2022",
    ]
    co2_resid_vars = [
        "tmax (degrees F)", "tmin (degrees F)", "wet_bulb_F",
        "ppt (inches)", "day_of_week", "month", "weekend",
        "tdmean (degrees F)",
    ]

    from sklearn.metrics import r2_score, mean_squared_error

    all_needed = ["Demand"] + temp_vars + resid_vars
    hybrid_df = merged_df[all_needed].copy().dropna().sort_index()
    X_full = hybrid_df.drop(columns=["Demand"])
    y_full = hybrid_df["Demand"]
    split_idx = int(len(X_full) * 0.8)
    X_train, X_test = X_full.iloc[:split_idx], X_full.iloc[split_idx:]
    y_train, y_test = y_full.iloc[:split_idx], y_full.iloc[split_idx:]

    X_train_temp = sm.add_constant(X_train[temp_vars], has_constant="add")
    X_test_temp = sm.add_constant(X_test[temp_vars], has_constant="add")
    temp_model_t = sm.OLS(y_train, X_train_temp).fit()
    train_temp_pred = temp_model_t.predict(X_train_temp)
    test_temp_pred = temp_model_t.predict(X_test_temp)
    train_resid = y_train - train_temp_pred

    xgb_resid_t = XGBRegressor(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
    )
    xgb_resid_t.fit(X_train[resid_vars], train_resid)
    xgb_demand_test = test_temp_pred + xgb_resid_t.predict(X_test[resid_vars])
    demand_test_r2 = r2_score(y_test, xgb_demand_test)

    co2_needed = ["CO2 Emissions Consumed"] + co2_ols_vars + co2_resid_vars
    co2_df = merged_df[co2_needed].copy().dropna().sort_index()
    X_co2 = co2_df.drop(columns=["CO2 Emissions Consumed"])
    y_co2 = co2_df["CO2 Emissions Consumed"]
    split_co2 = int(len(X_co2) * 0.8)
    X_co2_tr, X_co2_te = X_co2.iloc[:split_co2], X_co2.iloc[split_co2:]
    y_co2_tr, y_co2_te = y_co2.iloc[:split_co2], y_co2.iloc[split_co2:]

    X_co2_tr_ols = sm.add_constant(X_co2_tr[co2_ols_vars], has_constant="add")
    X_co2_te_ols = sm.add_constant(X_co2_te[co2_ols_vars], has_constant="add")
    co2_ols = sm.OLS(y_co2_tr, X_co2_tr_ols).fit()
    tr_co2_ols_raw = co2_ols.predict(X_co2_tr_ols)
    te_co2_ols_raw = co2_ols.predict(X_co2_te_ols)
    tr_co2_resid = y_co2_tr - tr_co2_ols_raw

    xgb_co2 = XGBRegressor(
        n_estimators=300, learning_rate=0.05, max_depth=4,
        subsample=0.8, colsample_bytree=0.8, random_state=42,
    )
    xgb_co2.fit(X_co2_tr[co2_resid_vars], tr_co2_resid)
    xgb_co2_te = np.maximum(te_co2_ols_raw + xgb_co2.predict(X_co2_te[co2_resid_vars]), 0)
    co2_test_r2 = r2_score(y_co2_te, xgb_co2_te)

    return {
        "merged_df": merged_df, "hybrid_df": hybrid_df, "co2_df": co2_df,
        "temp_model": temp_model_t, "xgb_resid": xgb_resid_t,
        "co2_ols": co2_ols, "xgb_co2": xgb_co2,
        "temp_vars": temp_vars, "resid_vars": resid_vars,
        "co2_ols_vars": co2_ols_vars, "co2_resid_vars": co2_resid_vars,
        "demand_test_r2": demand_test_r2, "co2_test_r2": co2_test_r2,
    }


def run_warming_scenario(cd, base_df, temp_increase_f):
    s = base_df.copy()
    s["tmean (degrees F)"] += temp_increase_f
    s["tmax (degrees F)"] += temp_increase_f
    s["tmin (degrees F)"] += temp_increase_f
    s["tdmean (degrees F)"] += temp_increase_f
    s["wet_bulb_F"] = wet_bulb_temp(s["tmean (degrees F)"], s["tdmean (degrees F)"])
    s["temp_squared"] = s["tmean (degrees F)"] ** 2
    s["CDD"] = np.maximum(0, s["tmean (degrees F)"] - 58)
    s["HDD"] = np.maximum(0, 58 - s["tmean (degrees F)"])

    d_X = sm.add_constant(s[cd["temp_vars"]], has_constant="add")
    demand_pred = cd["temp_model"].predict(d_X) + cd["xgb_resid"].predict(s[cd["resid_vars"]])
    s["Demand"] = demand_pred

    t_X = sm.add_constant(s[cd["co2_ols_vars"]], has_constant="add")
    co2_pred = np.maximum(
        cd["co2_ols"].predict(t_X) + cd["xgb_co2"].predict(s[cd["co2_resid_vars"]]), 0
    )
    return demand_pred, co2_pred


# =====================================================================
# Fit all five cities
# =====================================================================
CITIES = ["Albany", "Eugene", "Bend", "Portland", "Medford"]
city_data = {}
for city in CITIES:
    merged = build_merged_city(PRISM_FILES[city])
    city_data[city] = fit_city(merged)
    cd = city_data[city]
    print(f"{city:<10} demand test R2={cd['demand_test_r2']:.3f}  co2 test R2={cd['co2_test_r2']:.3f}")

# =====================================================================
# Export 1 — warming scenario sweep (the slider data)
# =====================================================================
warming_levels = np.arange(0, 15.5, 0.5)
scenarios = {"warming": [float(w) for w in warming_levels], "cities": {}}
for city in CITIES:
    cd = city_data[city]
    base = cd["co2_df"][cd["co2_ols_vars"] + cd["co2_resid_vars"]].dropna().copy()
    base["post_july_2022"] = 1
    demand_series, co2_series = [], []
    for w in warming_levels:
        d, c = run_warming_scenario(cd, base, temp_increase_f=w)
        demand_series.append(round(float(d.mean()) / 1000, 2))  # GWh/day
        co2_series.append(round(float(c.mean())))               # mT/day
    scenarios["cities"][city] = {"demand": demand_series, "co2": co2_series}
    dmin_i = int(np.argmin(demand_series))
    cmin_i = int(np.argmin(co2_series))
    d0, c0 = demand_series[0], co2_series[0]
    print(
        f"{city:<10} demand min {demand_series[dmin_i]} GWh/d at +{warming_levels[dmin_i]}°F "
        f"({100*(demand_series[dmin_i]-d0)/d0:+.1f}%) | +15°F {100*(demand_series[-1]-d0)/d0:+.1f}% | "
        f"co2 max drop {100*(co2_series[cmin_i]-c0)/c0:+.1f}% at +{warming_levels[cmin_i]}°F"
    )

# =====================================================================
# Export 2 — Albany U-curve (fitted OLS curve + daily scatter)
# =====================================================================
cd = city_data["Albany"]
p = cd["temp_model"].params
temps = np.arange(20, 101, 1.0)
curve = [
    round(float(
        p["const"]
        + p["tmean (degrees F)"] * t
        + p["temp_squared"] * t * t
        + p["CDD"] * max(0, t - 58)
        + p["HDD"] * max(0, 58 - t)
    ) / 1000, 2)
    for t in temps
]
hy = cd["hybrid_df"]
scatter = [
    [round(float(t), 1), round(float(d) / 1000, 1)]
    for t, d in zip(hy["tmean (degrees F)"], hy["Demand"])
]
ucurve = {
    "temps": [float(t) for t in temps],
    "curveGWh": curve,
    "scatter": scatter[::2],  # decimate 2x: ~1,880 points
    "baseTempF": 58,
}

# =====================================================================
# Export 2b — temperature-band bars (Finding 1): avg demand + day count
# per 5°F band of Albany daily mean temperature, from the same merged
# dataset the models fit on.
# =====================================================================
hy_alb = city_data["Albany"]["hybrid_df"]
tmean_alb = hy_alb["tmean (degrees F)"]
demand_alb = hy_alb["Demand"] / 1000  # GWh/day

edges = list(range(20, 95, 5))
bands = []
for lo_e in edges:
    hi_e = lo_e + 5
    if lo_e == edges[0]:
        mask = tmean_alb < hi_e
    elif lo_e == edges[-1]:
        mask = tmean_alb >= lo_e
    else:
        mask = (tmean_alb >= lo_e) & (tmean_alb < hi_e)
    n = int(mask.sum())
    if n == 0:
        continue
    bands.append({
        "lo": lo_e, "hi": hi_e,
        "avgDemand": round(float(demand_alb[mask].mean()), 1),
        "days": n,
    })

tempbands = {
    "bands": bands,
    "baseTempF": 58,
    "coldDays": int((tmean_alb < 58).sum()),
    "hotDays": int((tmean_alb > 58).sum()),
    "totalDays": int(len(tmean_alb)),
}
print(f"tempbands: {len(bands)} bands, cold {tempbands['coldDays']} vs hot {tempbands['hotDays']}")

# =====================================================================
# Export 2c — day-count migration under warming (Finding 3 rerun):
# for each 0.5°F step of the sweep, how many of the decade's days land
# in each 5°F band once tmean is shifted — cold days becoming hot ones.
# =====================================================================
shift_steps = [round(w * 0.5, 1) for w in range(0, 31)]
band_edges = list(range(20, 95, 5))


def band_counts(series):
    counts = []
    for lo_e in band_edges:
        hi_e = lo_e + 5
        if lo_e == band_edges[0]:
            mask = series < hi_e
        elif lo_e == band_edges[-1]:
            mask = series >= lo_e
        else:
            mask = (series >= lo_e) & (series < hi_e)
        counts.append(int(mask.sum()))
    return counts


bandshift = {
    "bands": [{"lo": lo_e, "hi": lo_e + 5} for lo_e in band_edges],
    "warming": shift_steps,
    "counts": [],
    "coldDays": [],
    "hotDays": [],
    "meanTemp": [],  # mean of the shifted daily-mean distribution, in °F
}
for w in shift_steps:
    shifted = tmean_alb + w
    bandshift["counts"].append(band_counts(shifted))
    bandshift["coldDays"].append(int((shifted < 58).sum()))
    bandshift["hotDays"].append(int((shifted > 58).sum()))
    bandshift["meanTemp"].append(round(float(shifted.mean()), 2))

print(f"bandshift: cold {bandshift['coldDays'][0]}→{bandshift['coldDays'][-1]}, "
      f"hot {bandshift['hotDays'][0]}→{bandshift['hotDays'][-1]} across +15°F")

# =====================================================================
# Export 3 — carbon-lopsided evaluation (Figure 6.2)
# =====================================================================
lopsided = {}
for city in CITIES:
    cdd = city_data[city]
    pp = cdd["co2_ols"].params
    demand_ref = float(cdd["co2_df"]["Demand"].mean())

    def predict_co2(tmean, demand=demand_ref, post=1, pp=pp):
        cddv = max(0, tmean - 58)
        hddv = max(0, 58 - tmean)
        return (pp["const"] + pp["Demand"] * demand + pp["tmean (degrees F)"] * tmean
                + pp["temp_squared"] * tmean ** 2 + pp["CDD"] * cddv + pp["HDD"] * hddv
                + pp["post_july_2022"] * post)

    c38, c58, c78 = predict_co2(38), predict_co2(58), predict_co2(78)
    lopsided[city] = {
        "coldEffect": round(float(c38 - c58)),
        "hotEffect": round(float(c78 - c58)),
        "postCoef": round(float(pp["post_july_2022"])),
    }
    print(f"{city:<10} cold +{lopsided[city]['coldEffect']} hot +{lopsided[city]['hotEffect']} "
          f"postJuly2022 {lopsided[city]['postCoef']}")

# =====================================================================
# Export 4 — hero ridgelines (10 years of smoothed demand)
# =====================================================================
sm_demand = daily_pacw["Demand"].rolling(60, center=True, min_periods=20).mean() / 1000
ridges = []
for year in range(2016, 2026):
    y = sm_demand.loc[f"{year}-01-01":f"{year}-12-31"]
    weekly = y.resample("W").mean().dropna()
    if len(weekly) >= 40:
        ridges.append({"year": year, "values": [round(float(v), 2) for v in weekly]})

# =====================================================================
# Export 5 — headline stats for copy
# =====================================================================
alb = scenarios["cities"]["Albany"]
d0 = alb["demand"][0]
dmin_i = int(np.argmin(alb["demand"]))
c0 = alb["co2"][0]
cmin_i = int(np.argmin(alb["co2"]))
post_coefs = [lopsided[c]["postCoef"] for c in CITIES]
max_climate_drop = max(
    c0_ - min(s["co2"]) for c0_, s in
    [(scenarios["cities"][c]["co2"][0], scenarios["cities"][c]) for c in CITIES]
)
thesis_stats = {
    "albany": {
        "demandTestR2": round(cd["demand_test_r2"], 3) if (cd := city_data["Albany"]) else None,
        "co2TestR2": round(city_data["Albany"]["co2_test_r2"], 3),
        "demandMinAtF": float(warming_levels[dmin_i]),
        "demandMinPct": round(100 * (alb["demand"][dmin_i] - d0) / d0, 1),
        "demandAt15Pct": round(100 * (alb["demand"][-1] - d0) / d0, 1),
        "co2MaxDropPct": round(100 * (alb["co2"][cmin_i] - c0) / c0, 1),
        "co2MaxDropAtF": float(warming_levels[cmin_i]),
        "co2MaxDropAbs": c0 - alb["co2"][cmin_i],
    },
    "postCoefRange": [min(post_coefs), max(post_coefs)],
    "maxClimateDropAnyCity": int(max_climate_drop),
    "structuralDrop": int(round(-np.mean(post_coefs))),
}

for name, obj in [("scenarios", scenarios), ("ucurve", ucurve),
                  ("tempbands", tempbands), ("bandshift", bandshift),
                  ("lopsided", lopsided), ("ridgeline", {"ridges": ridges}),
                  ("thesisStats", thesis_stats)]:
    path = OUT / f"{name}.json"
    path.write_text(json.dumps(obj, separators=(",", ":")))
    print(f"{path.name}: {path.stat().st_size / 1024:.0f} kB")
