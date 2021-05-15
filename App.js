import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, TextInput, Image, TouchableOpacity } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* SmsListener.addListener(message => {
  console.info(message)
}) */

async function getPermission() {
  try {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: "(...)",
        message: "Why you're asking for..."
      }
    );
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS, {
      title: 'Receive SMS',
      message: 'Need access to receive sms, to verify OTP'
    }
    );
  } catch (err) {}
}

const storeData = async (value) => {
  try {
    await AsyncStorage.setItem('@storage_Key', value)
    alert(`URL saved ${value}`)
  } catch (e) {
    // saving error
    console.log("ERROR IN STORING DATA")
    console.log(err)
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


export default function App() {
  const [hookUrl, setHookUrl] = useState('')

  async function listenSms() {
    const resp = await getPermission();
    const requestUrl = await getData()
    console.log(resp);
    const listenerSub = SmsListener.addListener(message => {
      console.log(message);

      if(message && message.originatingAddress === "AX-NHPSMS") {
        const OtpMessageNumbers = (message.body.match(/\d+/g) || []).map(n => parseInt(n))
        const otpNumber = OtpMessageNumbers && OtpMessageNumbers.length > 0 && OtpMessageNumbers[0]
        console.log("OTP FOUND")
        console.log(otpNumber)
        console.log(requestUrl)
        console.log(`${requestUrl}/?source=cowin&otp=${otpNumber}`)
        otpNumber && fetch(`${requestUrl}/?source=cowin&otp=${otpNumber}`)
      }

      // fetch('https://young-sloth-54.loca.lt/hook', {
      //   method: 'POST',
      //   /* headers: {
      //     Accept: 'application/json',
      //     'Content-Type': 'application/json'
      //   }, */
      //   body: JSON.stringify(message)
      // });
      
    });
    return listenerSub
  }

  useEffect(() => {
    let listenerSub = null
    const setupSmsListener = async () => {
      listenerSub = await listenSms()
    }
    setupSmsListener()
    return () => {
      listenerSub.remove()
    }
  },[])

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
