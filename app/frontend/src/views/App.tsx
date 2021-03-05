import { ThemeProvider } from '@material-ui/core';
import React, { StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppInfoProvider } from '../providers/appInfo';
import { theme, useStyles } from '../styles/global';

import { Dashboard } from './Dashboard';
import { Signup } from './Signup';

export const App = () => {
    useStyles();
    return (
        <StrictMode>
            <ThemeProvider theme={theme}>
                <AppInfoProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path='/' element={<Signup />} />
                            <Route path='/dashboard' element={<Dashboard />} />
                        </Routes>
                    </BrowserRouter>
                </AppInfoProvider>
            </ThemeProvider>
        </StrictMode>
    );
};
