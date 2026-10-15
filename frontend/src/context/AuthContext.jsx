import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [token, setToken] = useState(authService.getToken());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const freshUser = await authService.getMe();
                    setUser(freshUser);
                } catch (err) {
                    console.warn("Session verification warning:", err.message);
                    // Only log out if the backend explicitly rejected the token as invalid or expired (401 or 403)
                    // Never log out on network timeouts (e.g. Render spin-up) or transient 5xx errors
                    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                        console.warn("Session expired or invalid: logging out");
                        authService.logout();
                        setUser(null);
                        setToken(null);
                    } else {
                        // Preserves existing local session when backend is spinning up
                        const cachedUser = authService.getCurrentUser();
                        if (cachedUser) {
                            setUser(cachedUser);
                        }
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (credentials) => {
        const res = await authService.login(credentials);
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const register = async (userData) => {
        const res = await authService.register(userData);
        setUser(res.user);
        setToken(res.token);
        return res;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setToken(null);
    };

    const updateProfile = async (profileData) => {
        const res = await authService.updateProfile(profileData);
        setUser(res.user);
        if (res.token) setToken(res.token);
        return res;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role: user?.role || null,
                isAuthenticated: !!token && !!user,
                loading,
                login,
                register,
                logout,
                updateProfile
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
