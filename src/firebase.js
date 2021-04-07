import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

import Filter from 'bad-words'
import { ref, onUnmounted, computed } from 'vue'

firebase.initializeApp({
  apiKey: 'AIzaSyCMa03BrETF3sPdrAuT0dBeU5z0ApRi1R0',
  authDomain: 'chat-19783.firebaseapp.com',
  databaseURL: 'https://chat-19783-default-rtdb.firebaseio.com',
  projectId: 'chat-19783',
  storageBucket: 'chat-19783.appspot.com',
  messagingSenderId: '1002877485013',
  appId: '1:1002877485013:web:738ac7902c33b5114b475c',
  measurementId: 'G-3BKQQX5ESC'
})

const auth = firebase.auth()
//var publicKey = null
export function useAuth() {
  const user = ref(null)
  const unsubscribe = auth.onAuthStateChanged(_user => (user.value = _user))
  onUnmounted(unsubscribe)
  const isLogin = computed(() => user.value !== null)
  const signIn = async () => {
    const googleProvider = new firebase.auth.GoogleAuthProvider()
    await auth.signInWithPopup(googleProvider)
  }
  const signOut = () => auth.signOut()
  return { user, isLogin, signIn, signOut }
}

const firestore = firebase.firestore()
const messagesCollection = firestore.collection('messages')
const systemCollection = firestore.collection('system')
const messagesQuery = messagesCollection.orderBy('createdAt', 'desc').limit(100)
const filter = new Filter()
export async function encryptRSA(text) {
  const doc = await systemCollection.doc('Public Key').get()
  if (doc.exists) {
    const publicKey = {"kty":"RSA",
    "n": "0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx\
4cbbfAAtVT86zwu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMs\
tn64tZ_2W-5JsGY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2\
QvzqY368QQMicAtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbI\
SD08qNLyrdkt-bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqb\
w0Ls1jF44-csFCur-kEgU8awapJzKnqDKgw",
    "e":"AQAB",
    "alg":"RS256",
    "kid":"2011-04-29"}
    
  
    const publicKeyImport = await crypto.subtle.importKey(
      'jwk',
      publicKey,
      'RSA-OAEP',
      true,
      'encrypt'
    )
    console.log(publicKeyImport)
    console.log(text)
  } else {
    console.log('private key doc does not exist!')
  }
}
export async function setupKeys() {
  try {
    //store private key in "secure tamper-proof database" (firebase collection)
    const { publicKey, privateKey } = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
    const exportedPublicKey = await exportCryptoKey(publicKey)
    const exportedPrivateKey = await exportCryptoKey(privateKey)
    systemCollection.doc('Public Key').set({
      public_key: exportedPublicKey
    })
    systemCollection.doc('Private Key').set({
      private_key: exportedPrivateKey
    })
  } catch (err) {
    console.log(err)
  }
}

/*
Export the given key and write it into the "exported-key" space.
*/
async function exportCryptoKey(key) {
  const exported = await crypto.subtle.exportKey('jwk', key)
  return exported
}

export function useChat() {
  const messages = ref([])
  const unsubscribe = messagesQuery.onSnapshot(snapshot => {
    messages.value = snapshot.docs
      .map(doc => ({ id: doc.id, text: 'hello', ...doc.data() }))
      .reverse()
    messages.value.forEach(element => {
      element.text = decryptRSA(element.text)
    })
  })

  onUnmounted(unsubscribe)

  function decryptRSA(text) {
    systemCollection
      .doc('Private Key')
      .get()
      .then(doc => {
        if (doc.exists) {
          console.log(doc.data().private_key)
          crypto.subtle
            .importKey(
              'jwk',
              doc.data().private_key,
              'RSA-OAEP',
              true,
              'decrypt'
            )
            .then(privateKey => {
              crypto.subtle
                .decrypt('RSA-OAEP', privateKey, text)
                .then(result => {
                  console.log(result)
                  return result
                })
            })
        } else {
          console.log('private key doc does not exist!')
        }
      })
  }
  const { user, isLogin } = useAuth()
  const sendMessage = (text, date) => {
    if (!isLogin.value) return
    const { photoURL, uid, displayName } = user.value
    messagesCollection.doc(date).set({
      date: date,
      userName: displayName,
      userId: uid,
      userPhotoURL: photoURL,
      text: filter.clean(text),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      TTL: 30,
      likes: 0
    })
  }

  const updateTTL = date => {
    var mesRef = messagesCollection.doc(date)
    var newTTL
    var newLikes
    if (!isLogin.value) return
    mesRef
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log('Document data:', doc.data().TTL)
          newTTL = doc.data().TTL + 1
          newLikes = doc.data().likes + 1
          mesRef.update({
            TTL: newTTL,
            likes: newLikes
          })
        } else {
          // doc.data() will be undefined in this case
          console.log('No such document!')
        }
      })
      .catch(error => {
        console.log('Error getting document:', error)
      })
  }
  function deleteMessage(date) {
    messagesCollection
      .doc(date)
      .delete()
      .then(() => {
        console.log('Document successfully deleted!')
      })
      .catch(error => {
        console.error('Error removing document: ', error)
      })
  }

  return {
    messages,
    sendMessage,
    updateTTL,
    deleteMessage
  }
}
