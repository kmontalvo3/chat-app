import { createApp } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowUp,
  faArrowDown,
  faFire,
  faSnowflake
} from '@fortawesome/free-solid-svg-icons'
import App from './App.vue'
import './main.css'
library.add(faArrowDown)
library.add(faArrowUp)
library.add(faFire)
library.add(faSnowflake)
createApp(App)
  .component('fa', FontAwesomeIcon)
  .mount('#app')
