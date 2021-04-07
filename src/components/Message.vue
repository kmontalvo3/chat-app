<template>
  <div class="message" v-if="show">
    <span v-if="!sender">{{ name }}</span>
    <div class="flex" :class="sender ? 'flex-row-reverse' : ''">
      <Avatar class="mt-1 flex" :src="photoUrl" />
      <div class="text w-3/4" :class="sender ? 'bg-green-800' : 'bg-gray-700'">
        <slot />
      </div>
      <div></div>
    </div>
    <div class="text w-3/4">
      {{ upvotes }}
      <fa icon="arrow-up" style="color:green" @click="upVote" />

      {{ downvotes }}
      <fa icon="arrow-down" style="color:red" @click="downVote" />

      <span v-if="downvotes < 2 * upvotes">
        <fa icon="fire" style="color:orange"></fa>
      </span>
      <span v-if="downvotes > 2 * upvotes">
        <fa icon="snowflake" style="color:blue"></fa>
      </span>
    </div>
    <span id="date"></span>
  </div>
</template>

<script>
import Avatar from './Avatar.vue'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'
import { useChat } from '@/firebase'
const { updateTTL, downdateTTL } = useChat()
export default {
  components: { Avatar },
  props: {
    name: { type: String, default: '' },
    photoUrl: { type: String, default: '' },
    sender: { type: Boolean, default: false },
    date: { type: String, default: '' },
    upvotes: { type: Number, default: 0 },
    show: { type: Boolean, default: true },
    downvotes: { type: Number, default: 0 }
  },
  setup(props) {
    const upVote = () => {
      updateTTL(props.date)
    }
    const downVote = () => {
      downdateTTL(props.date)
    }

    return { upVote, downVote }
  }
}
</script>
