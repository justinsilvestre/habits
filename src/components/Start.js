import React, { Component, Fragment } from 'react'
import { StyleSheet, Text, View, TextInput, Button } from 'react-native'

class Start extends Component {
  state = {
    name: '',
    submitted: false,
  }

  handleChangeText = text => this.setState({ name: text })

  handleButtonPress = () => this.setState({ submitted: true })

  render() {
    const { submitted } = this.state
    return (
      <View>
        {!submitted
          ? (
            <Fragment>
              <Text>
                Hi! What&apos;s your name?
              </Text>
              <TextInput onChangeText={this.handleChangeText} />
              <Button onPress={this.handleButtonPress} title="Submit" />
            </Fragment>
          )
          : <Text>Hi, {this.state.name}!</Text>
        }
      </View>
    )
  }
}

export default Start
