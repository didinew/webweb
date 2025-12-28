import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => {
    let saved = {}
    try { saved = JSON.parse(localStorage.getItem('user') || '{}') } catch {}
    return { address: saved.address || '', token: saved.token || '' }
  },
  actions: {
    login(address, token) {
      this.address = address
      this.token = token
      try { localStorage.setItem('user', JSON.stringify({ address, token })) } catch {}
    },
    logout() {
      this.address = ''
      this.token = ''
      try { localStorage.removeItem('user') } catch {}
    }
  }
})