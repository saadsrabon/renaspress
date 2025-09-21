"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { WORDPRESS_CONFIG, getWordPressUrl } from "./wordpress-config"

interface User {
  id: number
  username: string
  email: string
  display_name?: string
  roles?: string[]
  capabilities?: {
    can_upload_files?: boolean
    can_edit_posts?: boolean
    can_publish_posts?: boolean
    can_delete_posts?: boolean
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user and token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("renas_token");
    const storedUser = localStorage.getItem("renas_user");
  
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("renas_user"); // clean invalid data
      }
    }
  
    if (storedToken) setToken(storedToken);
    setLoading(false);
  }, []);
  

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
  
    try {
      // Call the JWT plugin REST endpoint
      const response = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.JWT_TOKEN), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameOrEmail, // WordPress allows username or email
          password: password,
        }),
      });
  
      const data = await response.json();
  
      if (data.token) {
        // Fetch user details using custom endpoint with enhanced capabilities
        const userResponse = await fetch(getWordPressUrl(WORDPRESS_CONFIG.ENDPOINTS.USER_INFO), {
          headers: {
            "Authorization": `Bearer ${data.token}`,
          },
        });
  
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Save user and token locally
          const user: User = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            display_name: userData.display_name,
            roles: userData.roles,
            capabilities: userData.capabilities
          };
          
          setUser(user);
          setToken(data.token);
    
          localStorage.setItem("renas_token", data.token);
          localStorage.setItem("renas_user", JSON.stringify(user));
    
          return { success: true };
        } else {
          // Fallback to standard WordPress user endpoint
          const fallbackResponse = await fetch(getWordPressUrl(`${WORDPRESS_CONFIG.ENDPOINTS.USERS}/me`), {
            headers: {
              "Authorization": `Bearer ${data.token}`,
            },
          });
          
          if (fallbackResponse.ok) {
            const userData = await fallbackResponse.json();
            
            const user: User = {
              id: userData.id,
              username: userData.username,
              email: userData.email,
              display_name: userData.name || userData.display_name,
              roles: userData.roles || ['subscriber']
            };
            
            setUser(user);
            setToken(data.token);
      
            localStorage.setItem("renas_token", data.token);
            localStorage.setItem("renas_user", JSON.stringify(user));
      
            return { success: true };
          }
        }
        
        return { success: false, error: "Failed to fetch user details" };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error" };
    } finally {
      setLoading(false);
    }
  };
  

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    setLoading(true)
    try {
      const res = await fetch("https://renaspress.com/wp-json/react/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password, display_name: name }),
      })

      const data = await res.json()

      if (data.success && data.user) {
        setUser(data.user)

        if (data.token) {
          // Token returned from WP
          setToken(data.token)
          localStorage.setItem("renas_token", data.token)
          localStorage.setItem("renas_user", JSON.stringify(data.user))
        } else {
          // No token, try auto-login
          const loginRes = await login(email, password)
          if (!loginRes.success) {
            localStorage.setItem("renas_user", JSON.stringify(data.user))
            return { success: true, error: "User created, but auto-login failed" }
          }
        }

        return { success: true }
      } else {
        return { success: false, error: data.message || data.error || "Registration failed" }
      }
    } catch (err) {
      console.error("Registration error:", err)
      return { success: false, error: "Network error" }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem("renas_token")
      localStorage.removeItem("renas_user")
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
