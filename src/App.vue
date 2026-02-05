<template>
  <div class="accounts">
    <div @click="clickOutside" class="overlay"></div>
    <header class="header">
      <h2>Учетные записи</h2>
      <el-button type="primary" @click="onAdd">+</el-button>
    </header>

    <el-form class="form">
      <div v-for="item in store.list" :key="item.id" class="row">
        <el-form-item :error="errors[item.id]?.tagsInput">
          <el-input
            placeholder="Метки (через ;)"
            v-model="item.tagsInput"
            @blur="onBlur(item.id, 'tagsInput', item.tagsInput)"
          />
        </el-form-item>

        <el-form-item :error="errors[item.id]?.authType">
          <el-select
            v-model="item.authType"
            placeholder="Тип записи"
            @change="onTypeChange(item.id, item.authType)"
            @visible-change="(visible: boolean) => onSelectClose(item.id, visible)"
          >
            <el-option v-for="opt in options" :key="opt" :label="opt" :value="opt" />
          </el-select>
        </el-form-item>

        <el-form-item :error="errors[item.id]?.username">
          <el-input
            placeholder="Логин"
            v-model="item.username"
            @blur="onBlur(item.id, 'username', item.username)"
          />
        </el-form-item>

        <el-form-item v-if="item.authType === 'LOCAL'" :error="errors[item.id]?.secret">
          <el-input
            placeholder="Пароль"
            type="password"
            v-model="item.secret"
            @blur="onBlur(item.id, 'secret', item.secret ?? '')"
          />
        </el-form-item>

        <el-button type="danger" @click="onRemove(item.id)"> Удалить </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore, type AuthKind } from '@/stores/authStore'

const store = useAuthStore()

const options: AuthKind[] = ['LDAP', 'LOCAL']

type Field = 'tagsInput' | 'authType' | 'username' | 'secret'

type Errors = Record<string, Partial<Record<Field, string>>>

const errors = reactive<Errors>({})

const validateField = (id: string, field: Field) => {
  const item = store.list.find((i) => i.id === id)
  if (!item) return

  if (!errors[id]) errors[id] = {}

  switch (field) {
    case 'tagsInput':
      if (item.tagsInput.length > 50) {
        errors[id].tagsInput = 'Максимум 50 символов'
      } else {
        errors[id].tagsInput = ''
      }
      break

    case 'authType':
      errors[id].authType = item.authType ? '' : 'Тип обязателен'
      break

    case 'username':
      if (!item.username.trim()) {
        errors[id].username = 'Логин обязателен'
      } else if (item.username.length > 100) {
        errors[id].username = 'Максимум 100 символов'
      } else {
        errors[id].username = ''
      }
      break

    case 'secret':
      if (item.authType === 'LOCAL' && !item.secret) {
        errors[id].secret = 'Пароль обязателен'
      } else if (item.secret && item.secret.length > 100) {
        errors[id].secret = 'Максимум 100 символов'
      } else {
        errors[id].secret = ''
      }
      break
  }
}

const validateAll = () => {
  let ok = true

  store.list.forEach((item) => {
    validateField(item.id, 'authType')
    validateField(item.id, 'username')

    if (item.authType === 'LOCAL') {
      validateField(item.id, 'secret')
    }

    const entryErrors = errors[item.id]
    if (entryErrors && Object.values(entryErrors).some(Boolean)) {
      ok = false
    }
  })

  return ok
}

const onBlur = (id: string, field: Field, value: string) => {
  if (field === 'authType') {
    store.patch(id, { authType: value as AuthKind | '' })
  } else {
    store.patch(id, { [field]: value })
  }

  validateField(id, field)
}

const onAdd = () => {
  if (!validateAll()) return
  store.commit()
  store.append()
}

const onRemove = (id: string) => {
  store.drop(id)
  store.commit()
}

const clickOutside = () => {
  if (validateAll()) {
    store.commit()
  }
}

const onSelectClose = (id: string, visible: boolean) => {
  if (!visible) {
    validateField(id, 'authType')
  }
}

const onTypeChange = (id: string, value: AuthKind | '') => {
  store.patch(id, { authType: value })
  validateField(id, 'authType')
}
</script>

<style scoped>
.accounts {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 900px;
}

.header {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.row {
  position: relative;
  z-index: 3;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr auto;
  gap: 8px;
}

.overlay {
  position: fixed;
  background: #ffffff40;
  inset: 0;
}
</style>
