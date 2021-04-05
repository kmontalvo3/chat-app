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
const messagesQuery = messagesCollection.orderBy('createdAt', 'desc').limit(100)
const filter = new Filter()

export function useChat() {
  const messages = ref([])
  const unsubscribe = messagesQuery.onSnapshot(snapshot => {
    messages.value = snapshot.docs
      .map(doc => ({ id: doc.id, text: 'hello', ...doc.data() }))
      .reverse()
    messages.value.forEach(element => {
      element.text = decryptAES(element.text, element.iv)
    })
  })
  onUnmounted(unsubscribe)

  function decryptAES(text, iv) {
    return CryptoJS.AES.decrypt(text, mem[iv], { iv: iv }).toString(
      CryptoJS.enc.Utf8
    )
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
      TTL: 10,
      likes: 0,
      iv: iv
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
  function deleteMessage(date, iv) {
    messagesCollection
      .doc(date)
      .delete()
      .then(() => {
        //console.log('Document successfully deleted!')
        delete mem[iv]
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
    mem
  }
}
