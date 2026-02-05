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
            @change="onBlur(item.id, 'authType', item.authType)"
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

  if (!errors[id]) {
    errors[id] = {}
  }

  switch (field) {
    case 'authType':
      errors[id].authType = item.authType ? '' : 'Тип обязателен'
      break

    case 'username':
      errors[id].username = item.username.trim() ? '' : 'Логин обязателен'
      break

    case 'secret':
      errors[id].secret = item.authType === 'LOCAL' && !item.secret ? 'Пароль обязателен' : ''
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
