import pandas as pd

df = pd.read_csv('CleanedFishPrice.csv')

fish_kinds = ["Tuna fish", "Horse mackerel", "Sardines",
              "Bonito", "Salmon", "Mackerel", "Saury",
              "Sea bream", "Yellowtail", "Cuttlefish",
              "Octopus", "Prawns", "Short-necked clams",
              "Oysters", "Scallops"]
areas = ["Ku-area of Tokyo"]

small_df = df.loc[df['Items'].isin(fish_kinds) & df['Area'].isin(areas)].copy()
small_df["Area"] = small_df["Area"].astype("str").str.strip()
small_df["Items"] = small_df["Items"].astype("str").str.strip()
small_df["Time"] = small_df["Time"].astype("int")
small_df["Change(%)"] = small_df["Change(%)"].astype("float")

# print(small_df.head())
# print(small_df.info())
# print(small_df['Items'].unique(), len(small_df['Items'].unique()))
# print(small_df['Area'].unique(), len(small_df['Area'].unique()))

price_df = pd.read_csv('ConsumerPrice.csv', skiprows=1, names=["Fish", "Price"])
price_df["Fish"] = price_df["Fish"].astype("str").str.strip()
price_df["Price"] = price_df["Price"].astype("int")

# print(price_df.head())
# print(price_df.info())

# print(price_df["Fish"].unique() == small_df['Items'].unique())

prices_by_year = pd.DataFrame()
prices_by_year['Year'] = range(1979, 2024)

for year in range(2023, 1978, -1):
    if year == 2023:
        for fish in fish_kinds:
            change_previous_year = 1 + (small_df.loc[(small_df['Time'] == year+1) & (small_df['Items'] == fish), 'Change(%)'].values[0] / 100)
            prices_by_year.loc[prices_by_year['Year'] == year, fish] = price_df.loc[price_df['Fish'] == fish, 'Price'].values[0] / change_previous_year
            # print(f"Year: {year}, Fish: {fish}, Price: {prices_by_year.loc[prices_by_year['Year'] == year, fish].values[0]:.2f}")
    else:
        for fish in fish_kinds:
            change_previous_year = 1 + (small_df.loc[(small_df['Time'] == year+1) & (small_df['Items'] == fish), 'Change(%)'].values[0] / 100)
            prices_by_year.loc[prices_by_year['Year'] == year, fish] = prices_by_year.loc[prices_by_year['Year'] == year+1, fish].values[0] / change_previous_year
            # print(f"Year: {year}, Fish: {fish}, Price: {prices_by_year.loc[prices_by_year['Year'] == year, fish].values[0]:.2f}")
prices_by_year = prices_by_year.round(0)
print(prices_by_year)
prices_by_year.to_csv('EstimatedFishPricesByYear.csv', index=False)