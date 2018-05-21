import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Start from './src/components/Start'

export default class App extends React.Component {
  constructor(props) {
    if (typeof global.self === 'undefined') {
      global.self = global
    }
    super(props)
  }

  render() {
    return (
      <View style={styles.container}>
        <Start />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
