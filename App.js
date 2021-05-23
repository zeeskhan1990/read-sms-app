import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity, PermissionsAndroid  } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeData = async (value) => {
  try {
    const storingValue = value.replace(/\/+$/, "");
    await AsyncStorage.setItem('@storage_Key', storingValue)
    alert(`URL saved ${storingValue}`)
  } catch (e) {
    // saving error
    console.log("ERROR IN STORING DATA")
    console.log(e)
  }
}

const getData = async () => {
  try {
    const value = await AsyncStorage.getItem('@storage_Key')
    if(value !== null) {
      // value previously stored
      return value
    } else {
      alert('NO saved URL found')
    }
  } catch(e) {
    // error reading value
  }
}

const showData = async () => {
  try {
    const value = await AsyncStorage.getItem('@storage_Key')
    if(value !== null) {
      // value previously stored
      alert(value)
    } else {
      alert('NO saved URL found')
    }
  } catch(e) {
    // error reading value
  }
}

const sendToServer = async (data) => {
  const requestUrl = await getData()
  const message = typeof data !== 'string' ? JSON.stringify(data) : data
  console.log("Sending this to server")
  console.log(message)
  console.log(`${requestUrl}/data`)
  fetch(`${requestUrl}/data`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, 
    body: message
  });
}

async function getPermission() {
  try {
    const permToRead = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "(...)",
        message: "Why you're asking for..."
      }
    );
    const permToReceive = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
      title: 'Receive SMS',
      message: 'Need access to receive sms, to verify OTP'
    }
    );
    return {permToRead, permToReceive}
  } catch (err) {
    alert("Failed to Get Permissions")
    console.log(err)
    sendToServer(err)
  }
}

async function listenSms() {
  const resp = await getPermission();
  console.log("PERMISSION RESPONSE")
  console.log(resp);
  //sendToServer(resp)
  //const requestUrl = await getData()
  const listenerSub = SmsListener.addListener(message => {
    const executor = async (message) => {
      console.log("***** New Message Received ********")
      console.log(message);
      const requestUrl = await getData()
      if(message && message.originatingAddress === "AX-NHPSMS") {
        console.log("OTP FOUND")
        const OtpMessageNumbers = (message.body.match(/\d+/g) || []).map(n => parseInt(n))
        const otpNumber = OtpMessageNumbers && OtpMessageNumbers.length > 0 && OtpMessageNumbers[0]
        console.log(otpNumber)
        console.log(requestUrl)
        console.log(`${requestUrl}/otp?source=cowin&otp=${otpNumber}`)
        otpNumber && fetch(`${requestUrl}/otp?source=cowin&otp=${otpNumber}`)
      } else {
        console.log("NON OTP MESSAGE")
        sendToServer(message)
      }
    }
    executor(message)
  });
  return listenerSub
}

listenSms()


export default function App() {
  const [hookUrl, setHookUrl] = useState('https://razor-webhook.loca.lt')

  return (
    <View style={styles.container}>
      <Image source={{ uri: "https://i.imgur.com/TkIrScD.png" }} style={styles.logo} />
      <Text>Enter the webhook url for sending cowin OTP!</Text>
      <View style={styles.inputContainer}>
        <TextInput onChangeText={setHookUrl} value={hookUrl} style={styles.textbox}/>
        <TouchableOpacity onPress={() => storeData(hookUrl)} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={showData} style={styles.showButton}>
          <Text style={styles.buttonText}>Show</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  textbox: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    width: 200
  },
  logo: {
    width: 305,
    height: 159,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#03a5fc",
    padding: 10,
    borderRadius: 5,
  },
  showButton: {
    marginTop: 10,
    backgroundColor: "#03a5fc",
    padding: 8,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
});
