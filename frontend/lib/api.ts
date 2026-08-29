/**
 * Typed API Client for PorulAxiom Engine
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface User {
  id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  volume: number;
  timestamp: string;
  currency: string;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  current_value: number;
  invested_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  currency: string;
}

export interface PortfolioSummary {
  cash_balance: number;
  invested_value: number;
  current_holdings_value: number;
  net_worth: number;
  total_unrealized_pnl: number;
  total_realized_pnl: number;
  total_pnl: number;
  return_percentage: number;
  currency: string;
  holdings: Holding[];
}

export interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT";
  price: number;
  quantity: number;
  filled_quantity: number;
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  rejection_reason?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  return_percentage: number;
  total_trades: number;
  is_current_user: boolean;
}

export interface Friend {
  friendship_id: string;
  user_id: string;
  username: string;
  email: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  is_external_flow: boolean;
  created_at: string;
}

export interface AdminUserView {
  id: string;
  email: string;
  username: string;
  role: string;
  is_active: boolean;
  cash_balance: number;
  holdings_count: number;
  orders_count: number;
  trades_count: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_username?: string;
  action: string;
  target_user_id?: string;
  target_username?: string;
  details: string;
  created_at: string;
}

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("porulaxiom_token");
    }
    return null;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `Request failed (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {}
      throw new Error(errorDetail);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth Endpoints
  static register(data: { email: string; username: string; password: string }) {
    return this.request<{ access_token: string; role: string; username: string; user_id: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static login(data: { username_or_email: string; password: string }) {
    return this.request<{ access_token: string; role: string; username: string; user_id: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static demoLogin(demoType: "admin" | "trader1" | "trader2") {
    return this.request<{ access_token: string; role: string; username: string; user_id: string }>(`/api/auth/demo-login/${demoType}`, {
      method: "POST",
    });
  }

  static getMe() {
    return this.request<User>("/api/auth/me");
  }

  // Market Endpoints
  static getInstruments() {
    return this.request<Array<{ symbol: string; name: string; exchange: string; sector: string; base_price: number; currency: string }>>("/api/market/instruments");
  }

  static getQuotes() {
    return this.request<Quote[]>("/api/market/quotes");
  }

  static getQuote(symbol: string) {
    return this.request<Quote>(`/api/market/quote/${symbol}`);
  }

  static getCandles(symbol: string, timeframe: "1D" | "1W" | "1M" | "1Y" = "1D") {
    return this.request<Candle[]>(`/api/market/candles/${symbol}?timeframe=${timeframe}`);
  }

  static getOrderBook(symbol: string) {
    return this.request<{ symbol: string; timestamp: string; bids: Array<{ price: number; quantity: number; orders: number }>; asks: Array<{ price: number; quantity: number; orders: number }> }>(`/api/market/orderbook/${symbol}`);
  }

  // Orders
  static placeOrder(order: { symbol: string; side: "BUY" | "SELL"; order_type: "MARKET" | "LIMIT"; quantity: number; price?: number }) {
    return this.request<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  static getOrders(status?: string) {
    const url = status ? `/api/orders?status=${status}` : "/api/orders";
    return this.request<Order[]>(url);
  }

  static cancelOrder(orderId: string) {
    return this.request<Order>(`/api/orders/${orderId}`, {
      method: "DELETE",
    });
  }

  // Portfolio
  static getPortfolioSummary() {
    return this.request<PortfolioSummary>("/api/portfolio/summary");
  }

  static getHoldings() {
    return this.request<Holding[]>("/api/portfolio/holdings");
  }

  // Friends & Leaderboard
  static getFriends() {
    return this.request<Friend[]>("/api/friends");
  }

  static sendFriendRequest(username: string) {
    return this.request<Friend>("/api/friends/request", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  }

  static acceptFriend(friendshipId: string) {
    return this.request<Friend>(`/api/friends/${friendshipId}/accept`, {
      method: "POST",
    });
  }

  static rejectFriend(friendshipId: string) {
    return this.request<void>(`/api/friends/${friendshipId}/reject`, {
      method: "POST",
    });
  }

  static getLeaderboard() {
    return this.request<LeaderboardEntry[]>("/api/friends/leaderboard");
  }

  // Ledger
  static getLedger() {
    return this.request<LedgerEntry[]>("/api/ledger");
  }

  static getAdminAdjustments() {
    return this.request<LedgerEntry[]>("/api/ledger/adjustments");
  }

  // Admin
  static getAdminUsers() {
    return this.request<AdminUserView[]>("/api/admin/users");
  }

  static inspectUserPortfolio(userId: string) {
    return this.request<PortfolioSummary>(`/api/admin/users/${userId}/portfolio`);
  }

  static setAdminUserStatus(userId: string, isActive: boolean) {
    return this.request<{ status: string; user_id: string; is_active: boolean }>(`/api/admin/users/${userId}/status`, {
      method: "POST",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  static resetAdminUserPassword(userId: string, newPassword: string) {
    return this.request<{ status: string; message: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  static adjustCapital(data: { target_user_id: string; amount: number; reason: string }) {
    return this.request<LedgerEntry>("/api/admin/capital-adjust", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static getAuditLogs() {
    return this.request<AuditLog[]>("/api/admin/audit-logs");
  }
}
