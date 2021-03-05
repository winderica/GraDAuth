import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React, { FC, StrictMode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Frame } from '../components/Frame';
import { AliceProvider } from '../providers/alice';
import { theme, useStyles } from '../styles/global';

import { Auth } from './Auth';
import { Data } from './Data';
import { Home } from './Home';

export const App: FC = () => {
    useStyles();
    return (
        <StrictMode>
            <CssBaseline>
                <ThemeProvider theme={theme}>
                    <SnackbarProvider maxSnack={5}>
                        <HashRouter>
                            <Frame>
                                <AliceProvider>
                                    <Routes>
                                        <Route path='/' element={<Home />} />
                                        <Route path='/data' element={<Data />} />
                                        <Route path='/auth' element={<Auth />} />
                                        <Route element={<Navigate to='/' />} />
                                    </Routes>
                                </AliceProvider>
                            </Frame>
                        </HashRouter>
                    </SnackbarProvider>
                </ThemeProvider>
            </CssBaseline>
        </StrictMode>
    );
};
