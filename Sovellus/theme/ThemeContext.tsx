import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, ThemeType } from './themes';

type ThemeContextType = {
    theme: typeof lightTheme;
    themeType: ThemeType;
    toggleTheme: () => void;
    isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeType, setThemeType] = useState<ThemeType>("light");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem("theme");
            if (savedTheme === "dark" || savedTheme === "light") {
                setThemeType(savedTheme as ThemeType);
            }
        } catch (error) {
            console.error("Failed to load theme", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        const newTheme: ThemeType = themeType === "light" ? "dark" : "light";
        setThemeType(newTheme);
        await AsyncStorage.setItem("theme", newTheme);
    };

    const theme = themeType === "light" ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider
            value={{ theme, themeType, toggleTheme, isLoading }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};