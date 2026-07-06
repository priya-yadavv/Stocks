export interface StockHolding {
  symbol: string;
  quantity: number;
}

export interface StockPriceMap {
  [symbol: string]: number;
}

export interface TerminalLine {
  id: string;
  type: "output" | "error" | "input" | "system";
  text: string;
}

export interface GeneratedFile {
  name: string;
  size: number;
  mtime: string;
}
