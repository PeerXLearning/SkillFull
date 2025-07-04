const API_BASE_URL = import.meta.env.PROD
  ? null // Will use localStorage fallback in production for now
  : "http://localhost:3001/api";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    // If no API_BASE_URL in production, use localStorage fallback
    if (!API_BASE_URL) {
      return this.handleLocalStorageFallback(endpoint, options);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    console.log(`Making API request to: ${url}`, {
      method: config.method || "GET",
      headers: config.headers,
      body: config.body,
    });

    try {
      const response = await fetch(url, config);

      console.log(`API response status: ${response.status}`, response);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        console.error("API error response:", errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("API response data:", result);
      return result;
    } catch (error) {
      console.error("API request failed:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to server. Please check if the backend is running."
        );
      }
      throw error;
    }
  }

  // LocalStorage fallback for production demo
  async handleLocalStorageFallback(endpoint, options = {}) {
    console.log("Using localStorage fallback for:", endpoint);

    if (endpoint === "/requests" && options.method === "POST") {
      // Create request
      const requests = JSON.parse(localStorage.getItem("helpRequests") || "[]");
      const newRequest = {
        id: Date.now(),
        ...JSON.parse(options.body),
        status: "open",
        createdAt: new Date().toISOString(),
      };
      requests.push(newRequest);
      localStorage.setItem("helpRequests", JSON.stringify(requests));
      return newRequest;
    }

    if (endpoint === "/requests" || endpoint.includes("/requests?")) {
      // Get requests
      const requests = JSON.parse(localStorage.getItem("helpRequests") || "[]");
      return requests;
    }

    if (endpoint.includes("/accept")) {
      // Accept request
      return { success: true, message: "Request accepted" };
    }

    // Default fallback
    return { success: true, data: [] };
  }

  // Auth methods
  async loginWithGoogle(userData) {
    const response = await this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  async verifyToken() {
    return this.request("/auth/verify");
  }

  // User methods
  async updateProfile(userData) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  // Request methods
  async createRequest(requestData) {
    return this.request("/requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  async getRequests(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/requests${queryParams ? `?${queryParams}` : ""}`);
  }

  async getRequestById(requestId) {
    return this.request(`/requests/${requestId}`);
  }

  async updateRequest(requestId, updateData) {
    return this.request(`/requests/${requestId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async acceptRequest(requestId) {
    return this.request(`/requests/${requestId}/accept`, {
      method: "POST",
    });
  }

  async completeRequest(requestId) {
    return this.request(`/requests/${requestId}/complete`, {
      method: "POST",
    });
  }

  // Message methods
  async getMessages(requestId) {
    return this.request(`/messages/request/${requestId}`);
  }

  async sendMessage(messageData) {
    return this.request("/messages", {
      method: "POST",
      body: JSON.stringify(messageData),
    });
  }

  async markMessagesAsRead(requestId) {
    return this.request(`/messages/request/${requestId}/read`, {
      method: "PUT",
    });
  }

  // Category methods
  async getCategories() {
    return this.request("/categories");
  }

  // Review methods
  async createReview(reviewData) {
    return this.request("/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  async getReviews(userId) {
    return this.request(`/reviews/user/${userId}`);
  }

  // Notification methods
  async getNotifications() {
    return this.request("/notifications");
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/read-all", {
      method: "PUT",
    });
  }

  logout() {
    this.setToken(null);
  }
}

export default new ApiService();
