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
const messagesQuery = messagesCollection.orderBy('createdAt', 'desc').limit(100)
const filter = new Filter()

export function useChat() {
  const messages = ref([])
  const unsubscribe = messagesQuery.onSnapshot(snapshot => {
    messages.value = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .reverse()
  })
  onUnmounted(unsubscribe)

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
      TTL: 10,
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
          console.log('Document data:', doc.data().TTL)
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

  const deleteMessage = date => {
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

  const checkMessage = date => {
    const mesRef = messagesCollection.doc(date)
    if (!isLogin.value) return
    mesRef
      .get()
      .then(doc => {
        if (doc.exists) {
          var timeOfMessage = new Date(date).getTime()
          //console.log(timeOfMessage)
          var timeNow = new Date().getTime()
          if (timeOfMessage + doc.data().TTL * 1000 <= timeNow) {
            deleteMessage(date)
            return '1'
          }
          //if (doc.data().TTL + date.serverTimestamp)
        } else {
          // doc.data() will be undefined in this case
          console.log('No such document!')
          return 0
        }
      })
      .catch(error => {
        console.log('Error getting document:', error)
      })
  }

  return { messages, sendMessage, updateTTL, deleteMessage, checkMessage }
}
