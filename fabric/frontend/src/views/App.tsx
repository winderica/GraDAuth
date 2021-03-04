import { CssBaseline, ThemeProvider } from '@material-ui/core';
import { SnackbarProvider } from 'notistack';
import React, { FC, StrictMode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Frame } from '../components/Frame';
import { AliceProvider } from '../providers/alice';
import { theme, useStyles } from '../styles/global';

import { Auth } from './Auth';
import { Data } from './Data';
import { Debug } from './Debug';
import { Home } from './Home';
import { Register } from './Register';

export const App: FC = () => {
    useStyles();
    return (
        <StrictMode>
            <CssBaseline>
                <ThemeProvider theme={theme}>
                    <SnackbarProvider maxSnack={5}>
                        <BrowserRouter>
                            <Frame>
                                <AliceProvider>
                                    <Routes>
                                        <Route path='/' element={<Home />} />
                                        <Route path='/data' element={<Data/>} />
                                        <Route path='/auth' element={<Auth />} />
                                        <Route path='/register' element={<Register />} />
                                        <Route path='/debug' element={<Debug />} />
                                    </Routes>
                                </AliceProvider>
                            </Frame>
                        </BrowserRouter>
                    </SnackbarProvider>
                </ThemeProvider>
            </CssBaseline>
        </StrictMode>
    );
};
