/* elint-disable */
import axios from 'axios'
import { showAlert } from './alerts'

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password'
      ? 'http://127.0.0.1:8000/api/v1/users/update-my-password'
      : 'http://127.0.0.1:8000/api/v1/users/update-me'

    const res = await axios({
      method: 'PATCH',
      url,
      data
    })

    res.data.status && showAlert('success', `${type.toUpperCase()} updated successfully!`)

  } catch (err) {
    showAlert('error', err.response.data.message)
  }
}