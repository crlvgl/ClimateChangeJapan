import pandas as pd

# df = pd.read_csv('CleanedFishPrice.csv')

# fishes = df['Items'].unique()
# print(fishes)
# print(len(fishes))

df = pd.read_csv('website/data/EstimatedFishPricesByYear.csv', index_col=0)

for year in df.index:
    avg = df.loc[year].median()
    avg = round(avg, 0)
    df.loc[year, "Median"] = avg

print(df)
df.to_csv('website/data/EstimatedFishPricesByYear.csv')