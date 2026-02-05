import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AuthKind = 'LDAP' | 'LOCAL'

export interface Tag {
  text: string
}

export interface AuthEntry {
  id: string
  tags: Tag[]
  tagsInput: string
  authType: '' | AuthKind
  username: string
  secret: string | null
}

const LS_KEY = 'auth_entries'

export const useAuthStore = defineStore('authStore', () => {
  const committed = ref<AuthEntry[]>(restore())
  const draft = ref<AuthEntry[]>(clone(committed.value))

  const append = () => {
    draft.value.push(buildEmpty())
  }

  const drop = (id: string) => {
    draft.value = draft.value.filter((e) => e.id !== id)
  }

  const patch = (
    id: string,
    data: Partial<Pick<AuthEntry, 'tagsInput' | 'authType' | 'username' | 'secret'>>,
  ) => {
    const entry = draft.value.find((e) => e.id === id)
    if (!entry) return

    if (data.tagsInput !== undefined) {
      entry.tagsInput = data.tagsInput
      entry.tags = splitTags(data.tagsInput)
    }

    if (data.authType !== undefined) {
      entry.authType = data.authType
      if (data.authType === 'LDAP') {
        entry.secret = null
      }
    }

    if (data.username !== undefined) {
      entry.username = data.username
    }

    if (data.secret !== undefined && entry.authType === 'LOCAL') {
      entry.secret = data.secret
    }
  }

  const commit = () => {
    committed.value = clone(draft.value)
    localStorage.setItem(LS_KEY, JSON.stringify(committed.value))
  }

  return {
    list: draft,
    append,
    drop,
    patch,
    commit,
  }
})

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

function buildEmpty(): AuthEntry {
  return {
    id: crypto.randomUUID(),
    tags: [],
    tagsInput: '',
    authType: '',
    username: '',
    secret: null,
  }
}

function splitTags(source: string): Tag[] {
  return source
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

function restore(): AuthEntry[] {
  try {
    const data = localStorage.getItem(LS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}
