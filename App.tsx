import React from 'react';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import store from './app/redux/store';
import AppRoot from './app/App';

const App = (): React.JSX.Element => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppRoot />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
