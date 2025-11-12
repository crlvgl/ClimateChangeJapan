import pandas as pd
from matplotlib import pyplot as plt

df = pd.read_csv('FishPrice.csv', skiprows=10)
df = df.drop(columns=["Area(2020-base) Auxiliary Code",
                      "Time Auxiliary Code",
                      "Items(2020-base) Auxiliary Code",
                      "/Tabulated variable"])

# print(df.head())
# df.info()
areas = df['Area(2020-base)'].unique()
items = df['Items(2020-base)'].unique()
time = df['Time'].unique()
# print(f"Areas: {areas}, count: {len(areas)}")
# print(f"Items: {items}, count: {len(items)}")
# print(f"Time: {time}", f"count: {len(time)}")

df = df.rename(columns={
    "Area(2020-base)": "Area",
    "Items(2020-base)": "Items",
    "Change from the previous period (year, fiscal year, or month)[%]": "Change(%)"})

cleaned_df = df[["Area", "Items", "Time", "Change(%)"]].copy().dropna()

cleaned_df["Area"] = cleaned_df["Area"].astype("str")
cleaned_df["Items"] = cleaned_df["Items"].astype("str")
cleaned_df["Time"] = cleaned_df["Time"].astype("int")

# Try to convert "Change(%)" to numeric, cleaning strings first
col = cleaned_df["Change(%)"].astype(str).str.strip()
col = col.str.replace('%', '', regex=False)
col = col.str.replace(',', '', regex=False)
col = col.str.replace(r"[^0-9.\-]", '', regex=True)
cleaned_df["Change(%)"] = pd.to_numeric(col, errors='coerce')

# num_non_convertible = cleaned_df["Change(%)"].isna().sum()
# print(f"Non-convertible 'Change(%)' entries coerced to NaN: {num_non_convertible}")

# cleaned_df = cleaned_df.dropna(subset=["Change(%)"])

cleaned_df.info()
print(cleaned_df.head())

# nan_indexes = cleaned_df[cleaned_df["Change(%)"].isna()].index
# for idx in nan_indexes:
#     print(f"NaN at index: {idx}, row data original: {df.loc[idx, "Change(%)"]}, cleaned: {cleaned_df.iloc[idx].to_dict()}")

cleaned_df.to_csv('CleanedFishPrice.csv', index=False)