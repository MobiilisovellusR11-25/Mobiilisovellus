export type ThemeType = 'light' | 'dark';

export const lightTheme = {
    backgroundColor: '#FFFFFF',

    surface: '#F9F9F9', // kortit
    input: '#eeeeee',   // input-kentät ja filteri
    primary: '"#E6DDF9', // aktiivinen elementti/painike

    border: '#DDDDDD',
    text: '#000000',
    textSecondary: '#555555',
};

export const darkTheme = {
    backgroundColor: '#121212',

    surface: '#1C1C1E', // kortit
    input: '#383737',  // input-kentät ja filteri
    primary: '#e890ebb2', // aktiivinen elementti/painike

    border: 'rgba(255, 255, 255, 0.12)', // tumman teeman border
    text: '#b3abab',
    textSecondary: '#B0B0B0',
};