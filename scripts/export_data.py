"""Export daily_pacw.parquet into precomputed JSON for the static site.

Reads the parquet from the archived Dash app repo and writes small,
chart-ready JSON files into src/data/. Rerun whenever the parquet updates.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
PARQUET = ROOT.parent / "oregon-energy-dashboard" / "daily_pacw.parquet"
OUT = ROOT / "src" / "data"
OUT.mkdir(parents=True, exist_ok=True)

SHIFT = pd.Timestamp("2022-07-07")

df = pd.read_parquet(PARQUET)

# Parquet values are daily means of hourly EIA-930 MWh (= average MW).
# Convert to honest daily totals: GWh/day for energy, tonnes CO2/day.
ENERGY_COLS = ["Demand", "Net generation", "Total interchange",
               "NG: COL", "NG: NG", "NG: WAT", "NG: WND", "NG: SUN",
               "Consumed Electricity"]
df[ENERGY_COLS] = df[ENERGY_COLS] * 24 / 1000
df["CO2 Emissions Consumed"] = df["CO2 Emissions Consumed"] * 24
df["Imports"] = df["Total interchange"].clip(upper=0).mul(-1)

FUEL_COLS = {
    "NG: COL": "coal",
    "NG: NG": "gas",
    "NG: WAT": "hydro",
    "NG: WND": "wind",
    "NG: SUN": "solar",
}


def rnd(s, nd=0):
    return [None if pd.isna(v) else round(float(v), nd) if nd else int(round(v)) for v in s]


# --- Daily long-term trends (one file, column-oriented) ----------------------
daily = {
    "dates": [d.strftime("%Y-%m-%d") for d in df.index],
    "demand": rnd(df["Demand"], 1),
    "netGen": rnd(df["Net generation"], 1),
    "interchange": rnd(df["Total interchange"], 1),
    "co2": rnd(df["CO2 Emissions Consumed"]),
    "imports": rnd(df["Imports"], 1),
}

# 30-day centered rolling means (precomputed so the client stays dumb)
for key, col, nd in [("demandSmooth", "Demand", 1), ("netGenSmooth", "Net generation", 1),
                     ("interchangeSmooth", "Total interchange", 1),
                     ("co2Smooth", "CO2 Emissions Consumed", 0),
                     ("importsSmooth", "Imports", 1)]:
    daily[key] = rnd(df[col].rolling(30, center=True, min_periods=1).mean(), nd)

# --- Monthly fuel mix (means, MWh/day) ---------------------------------------
# EIA-930 fuel-mix reporting begins July 2018; coal reads null (not zero) after
# it left PACW's books in July 2022 — make those explicit zeros.
fuel_df = df[list(FUEL_COLS)].copy()
fuel_df.loc[fuel_df.index >= SHIFT, "NG: COL"] = fuel_df.loc[
    fuel_df.index >= SHIFT, "NG: COL"
].fillna(0)
monthly_fuel = fuel_df.resample("ME").mean()
monthly_fuel = monthly_fuel[monthly_fuel.index >= "2018-07-01"]
fuel = {
    "months": [d.strftime("%Y-%m") for d in monthly_fuel.index],
    **{name: rnd(monthly_fuel[col], 2) for col, name in FUEL_COLS.items()},
}

# --- Monthly emissions --------------------------------------------------------
monthly_co2 = df[["CO2 Emissions Consumed"]].resample("ME").mean()
emissions = {
    "months": [d.strftime("%Y-%m") for d in monthly_co2.index],
    "co2": rnd(monthly_co2["CO2 Emissions Consumed"]),
}

# --- Headline stats -----------------------------------------------------------
pre, post = df[df.index < SHIFT], df[df.index >= SHIFT]

pct_gen = df["Net generation"] / df["Consumed Electricity"] * 100
pct_imp = df["Imports"] / df["Consumed Electricity"] * 100

recent = df[df.index >= df.index.max() - pd.DateOffset(months=12)]
consumed_recent = recent["Consumed Electricity"].sum()

stats = {
    "dataStart": df.index.min().strftime("%Y-%m-%d"),
    "dataEnd": df.index.max().strftime("%Y-%m-%d"),
    "shiftDate": SHIFT.strftime("%Y-%m-%d"),
    # full-decade overview (the Dash app mislabeled post-shift means as the decade)
    "decade": {
        "avgDemand": round(df["Demand"].mean(), 1),
        "avgNetGen": round(df["Net generation"].mean(), 1),
        "avgInterchange": round(df["Total interchange"].mean(), 1),
        "avgCo2": int(df["CO2 Emissions Consumed"].mean()),
    },
    "preShift": {
        "pctGenerated": round(pct_gen[df.index < SHIFT].mean(), 1),
        "pctImported": round(pct_imp[df.index < SHIFT].mean(), 1),
        "avgCo2": int(pre["CO2 Emissions Consumed"].mean()),
        "peakCo2": int(pre["CO2 Emissions Consumed"].max()),
        "avgCoal": round(pre["NG: COL"].mean(), 1),
    },
    "postShift": {
        "pctGenerated": round(pct_gen[df.index >= SHIFT].mean(), 1),
        "pctImported": round(pct_imp[df.index >= SHIFT].mean(), 1),
        "avgCo2": int(post["CO2 Emissions Consumed"].mean()),
        "peakCo2": int(post["CO2 Emissions Consumed"].max()),
        "avgCoal": round(post["NG: COL"].mean(), 1),
    },
    "recent12mo": {
        "hydroShare": round(recent["NG: WAT"].sum() / consumed_recent * 100, 1),
        "windShare": round(recent["NG: WND"].sum() / consumed_recent * 100, 1),
        "solarShare": round(recent["NG: SUN"].sum() / consumed_recent * 100, 1),
        "importsShare": round(recent["Imports"].sum() / consumed_recent * 100, 1),
    },
}
stats["emissionsDrop"] = {
    "absPerDay": stats["preShift"]["avgCo2"] - stats["postShift"]["avgCo2"],
    "pct": round((stats["preShift"]["avgCo2"] - stats["postShift"]["avgCo2"])
                 / stats["preShift"]["avgCo2"] * 100, 1),
}

for name, obj in [("daily", daily), ("fuel", fuel), ("emissions", emissions), ("stats", stats)]:
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(obj, separators=(",", ":")))
    print(f"{p.name}: {p.stat().st_size / 1024:.0f} kB")
