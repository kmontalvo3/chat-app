<template>
  <div class="message" v-if="show">
    <span v-if="!sender">{{ name }}</span>
    <div class="flex" :class="sender ? 'flex-row-reverse' : ''">
      <Avatar class="mt-1" :src="photoUrl" />
      <div class="text w-3/4" :class="sender ? 'bg-green-800' : 'bg-gray-700'">
        <slot />
      </div>
      <div>
        <button @click="upVote">{{ likes }}</button>
      </div>
      <div>
        <button @click="downVote">{{ likes }}</button>
      </div>
    </div>
    <span id="date">{{ date }}</span>
  </div>
</template>

<script>
import Avatar from './Avatar.vue'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import { useChat } from '@/firebase'
const { updateTTL } = useChat()

export default {
  components: { Avatar },
  props: {
    name: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    sender: { type: Boolean, default: false },
    date: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    show: { type: Boolean, default: true }
  },
  setup(props) {
    const upVote = () => {
      updateTTL(props.date)
    }
    const downVote = () => {
      updateTTL(props.date)
    }

    return { upVote, downVote }
  }
}
</script>
