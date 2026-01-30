import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css' // <--- 必须加上这一行，Tailwind 才会生效！

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')