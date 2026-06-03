import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

export const AppStoreProvider = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
