import Taro from '@tarojs/taro'

import { userLogin, userUploadInfo, userGetInfo } from '../requests/user'
import { TOKEN_KEY } from '../constants/common'
import { getAuthorize } from '../utils/tools'

export default {
  namespace: 'user',

  mixins: ['common'],

  state: {
    memberId: '',
    authorize: true,
    memberInfo: {},
  },

  async setup({ put }) {
    const authorize = await getAuthorize('userInfo')
    if (!authorize) {
      Taro.hideTabBar()
    } else {
      put({ type: 'getInfo' })
    }
    put({ type: 'update', payload: { authorize } })

    try {
      await Taro.checkSession()
      const token = await Taro.getStorage({ key: TOKEN_KEY })
      if (!token) {
        await put({ type: 'login', meta: { noAuth: true } })
        Taro.eventCenter.trigger('login')
      } else {
        Taro.eventCenter.trigger('login')
      }
    } catch (error) {
      await put({ type: 'login', meta: { noAuth: true } })
      Taro.eventCenter.trigger('login')
    }
  },

  effects: {
    async login(action, { put }) {
      const { code } = await Taro.login()
      const { token, memberId } = await userLogin({ code })
      put({ type: 'update', payload: { memberId } })
      await Taro.setStorage({ key: TOKEN_KEY, data: token })
    },
    async uploadInfo(
      {
        payload: { rawData, signature, encryptedData, iv },
      },
      { put },
    ) {
      await userUploadInfo({ rawData, signature, encryptedData, iv })
      put({ type: 'getInfo' })
    },
    async getInfo(action, { put }) {
      const { memberInfo } = await userGetInfo()
      put({ type: 'update', payload: { memberInfo } })
    },
  },
}
