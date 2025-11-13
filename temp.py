import pandas as pd

df = pd.read_csv('CleanedFishPrice.csv')

fishes = df['Items'].unique()
print(fishes)
print(len(fishes))