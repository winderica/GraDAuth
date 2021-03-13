import { ThemeProvider } from '@material-ui/core';
import React, { StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { theme, useStyles } from '../styles/global';

import { Dashboard } from './Dashboard';
import { Signup } from './Signup';

export const App = () => {
    useStyles();
    return (
        <StrictMode>
            <ThemeProvider theme={theme}>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<Signup />} />
                        <Route path='/dashboard' element={<Dashboard />} />
                    </Routes>
                </BrowserRouter>
            </ThemeProvider>
        </StrictMode>
    );
};
