import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'

import Filter from 'bad-words'
import { ref, onUnmounted, computed } from 'vue'
import CryptoJS from 'crypto-js'


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
const mem = new Object()

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
  return { user, isLogin, signIn, signOut, mem }
}

const firestore = firebase.firestore()
const messagesCollection = firestore.collection('messages')
const keyCollection = firestore.collection('keys')
const messagesQuery = messagesCollection.orderBy('createdAt', 'desc').limit(100)
const filter = new Filter()

export function encryptAES(text, iv) {
  var key = CryptoJS.lib.WordArray.random(16).toString() //generate random AES key for each message
  keyCollection.doc(iv).set({
    key: key
  })
  //mem[iv] = key // store iv and key pair in "memory" on the system
  //console.log(mem)
  return CryptoJS.AES.encrypt(text, key, { iv: iv }).toString()
}

export function keySnapshot() {
  const unsubscribe = keyCollection.onSnapshot(snapshot => {
    snapshot.docs.forEach(doc => {
      mem[doc.id] = doc.data().key
    })
    //console.log(mem)
  })

  onUnmounted(unsubscribe)
}

export function useChat() {
  const messages = ref([])
  const unsubscribe = messagesQuery.onSnapshot(snapshot => {
    messages.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .reverse()
    messages.value.forEach(element => {
      //console.log(element)
      decryptAES(element).then(text => {
        element.text = text
        element.show = true
      })
    })
  })
  onUnmounted(unsubscribe)

  async function decryptAES(element) {
    element.show = false
    return CryptoJS.AES.decrypt(element.text, mem[element.iv], {
      iv: element.iv
    }).toString(CryptoJS.enc.Utf8)
  }

  const { user, isLogin } = useAuth()
  const sendMessage = (text, date, iv) => {
    if (!isLogin.value) return
    const { photoURL, uid, displayName } = user.value
    messagesCollection.doc(date).set({
      date: date,
      userName: displayName,
      userId: uid,
      userPhotoURL: photoURL,
      text: filter.clean(text),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      TTL: 15,
      upvotes: 0,
      iv: iv,
      show: false,
      downvotes: 0
    })
  }

  const updateTTL = date => {
    var mesRef = messagesCollection.doc(date)
    var newTTL
    var newupvotes
    if (!isLogin.value) return
    mesRef
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log('Document data:', doc.data().TTL)
          newTTL = doc.data().TTL + 5
          newupvotes = doc.data().upvotes + 1
          mesRef.update({
            TTL: newTTL,
            upvotes: newupvotes
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

  const downdateTTL = date => {
    var mesRef = messagesCollection.doc(date)
    var newTTL
    var newdownvotes
    if (!isLogin.value) return
    mesRef
      .get()
      .then(doc => {
        if (doc.exists) {
          //console.log('Document data:', doc.data().TTL)
          newTTL = doc.data().TTL - 1
          newdownvotes = doc.data().downvotes + 1
          mesRef.update({
            TTL: newTTL,
            downvotes: newdownvotes
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

  function deleteMessage(date, iv) {
    messagesCollection
      .doc(date)
      .delete()
      .then(() => {
        //console.log('Document successfully deleted!')
        keyCollection.doc(iv).delete()
      })
      .catch(error => {
        console.error('Error removing document: ', error)
      })
  }

  return {
    messages,
    sendMessage,
    updateTTL,
    deleteMessage,
    mem,
    downdateTTL
  }
}
