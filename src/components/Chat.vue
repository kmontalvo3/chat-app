<template>
  <div class="container-sm mt-20">
    <div class="mx-5">
      <Message
        v-for="{
          id,
          text,
          userPhotoURL,
          userName,
          userId,
          date,
          likes
        } in messages"
        :key="id"
        :name="userName"
        :photo-url="userPhotoURL"
        :sender="userId === user?.uid"
        :date="date"
        :likes="likes"
      >
        {{ text }}
      </Message>
    </div>
  </div>

  <div ref="bottom" class="mt-20" />

  <div class="bottom">
    <div class="container-sm">
      <form v-if="isLogin" @submit.prevent="send">
        <input v-model="message" placeholder="Message" required />
        <button type="submit">
          <SendIcon />
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { useAuth, useChat } from '@/firebase'

import SendIcon from './SendIcon.vue'
import Message from './Message.vue'
import CryptoJS from 'crypto-js'

export default {
  data() {
    return {
      polling: null
    }
  },
  components: { Message, SendIcon },
  setup() {
    const { user, isLogin } = useAuth()
    const { messages, sendMessage, /*checkMessage*/ deleteMessage } = useChat()
    const bottom = ref(null)
    //var polling = null
    watch(
      messages,
      () => {
        nextTick(() => {
          bottom.value?.scrollIntoView({ behavior: 'smooth' })
        })
      },
      { deep: true }
    )

    const message = ref('')
    const send = () => {
      var cipherText = CryptoJS.AES.encrypt(
        message.value,
        'secretkey123'
      ).toString()
      console.log(cipherText)
      var date = Date()
      sendMessage(message.value, date)
      var bytes = CryptoJS.AES.decrypt(cipherText, 'secretkey123')
      var originalText = bytes.toString(CryptoJS.enc.Utf8)
      console.log(originalText) // 'my message'
      message.value = ''
    }
    function pollMessages() {
      this.polling = setInterval(() => {
        messages.value.forEach(element => {
          console.log(element.TTL)
          var date = element.id
          var timeOfMessage = new Date(date).getTime()
          //console.log(timeOfMessage)
          var timeNow = new Date().getTime()
          if (timeOfMessage + element.TTL * 1000 <= timeNow) {
            deleteMessage(date)
          }
        })
      }, 1000)
    }

    return { user, isLogin, messages, bottom, message, send, pollMessages }
  },
  created() {
    this.pollMessages()
  },
  unmounted() {
    clearInterval(this.polling)
  }
}
</script>
