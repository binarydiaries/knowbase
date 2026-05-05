import * as amplitude from '@amplitude/unified'

const API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY as string

amplitude.initAll(API_KEY, {
  analytics: {
    autocapture: true,
  },
})

export default amplitude
