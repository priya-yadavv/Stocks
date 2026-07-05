# Stock Portfolio Tracker (Python Implementation)
# Goal: Calculate total investment based on manually defined stock prices.

# Hardcoded dictionary defining stock prices
prices = {
    "AAPL": 180.0,
    "TSLA": 250.0,
    "MSFT": 420.0,
    "GOOGL": 170.0,
    "NVDA": 130.0,
    "AMZN": 185.0
}

portfolio = {}

print("=========================================")
print("   PYTHON STOCK PORTFOLIO TRACKER        ")
print("=========================================")
print("Available Stock Prices in Dictionary:")
for sym, price in prices.items():
    print(f"  - {sym}: ${price:.2f}")
print("=========================================\n")

while True:
    symbol = input("Enter stock symbol (or 'done' to calculate): ").strip().upper()
    if symbol == 'DONE':
        break
    
    if symbol not in prices:
        print(f"❌ Unknown symbol '{symbol}'. Symbol must be in the price dictionary.")
        print(f"👉 Available symbols: {', '.join(prices.keys())}")
        continue
        
    qty_str = input(f"Enter quantity for {symbol}: ").strip()
    try:
        qty = float(qty_str)
        if qty <= 0:
            print("❌ Quantity must be a positive number.")
            continue
        # Add to existing or initialize
        portfolio[symbol] = portfolio.get(symbol, 0.0) + qty
        print(f"✅ Added {qty} shares of {symbol} to portfolio.")
    except ValueError:
        print("❌ Invalid quantity. Please enter a valid decimal number.")

print("\n=========================================")
print("          PORTFOLIO SUMMARY              ")
print("=========================================")

total_value = 0.0
if not portfolio:
    print("Your portfolio is currently empty!")
else:
    for symbol, qty in portfolio.items():
        price = prices[symbol]
        value = qty * price
        total_value += value
        print(f"📈 {symbol:5} | {qty:8.2f} shares @ ${price:6.2f} = ${value:10.2f}")

print("-----------------------------------------")
print(f"💰 Total Portfolio Value: ${total_value:,.2f}")
print("=========================================\n")

# File handling (optional)
save = input("Would you like to save this summary to 'portfolio.txt'? (y/n): ").strip().lower()
if save == 'y' or save == 'yes':
    filename = "portfolio.txt"
    with open(filename, "w") as f:
        f.write("=========================================\n")
        f.write("          PORTFOLIO SUMMARY              \n")
        f.write("=========================================\n")
        for symbol, qty in portfolio.items():
            price = prices[symbol]
            value = qty * price
            f.write(f"{symbol}: {qty} shares @ ${price} = ${value:.2f}\n")
        f.write("-----------------------------------------\n")
        f.write(f"Total Portfolio Value: ${total_value:.2f}\n")
        f.write("=========================================\n")
    print(f"🎉 Successfully saved portfolio to '{filename}'!")
else:
    print("Skipped saving portfolio to file.")

print("\nScript completed. Have a nice day!")
