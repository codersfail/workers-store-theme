import Vue from 'vue'
import middleware from './middleware'
import { editor } from './swell-editor-utils'

export default async (context, inject) => {
  const useEditorSettings = '<%= options.useEditorSettings %>' === 'true'

  if (window && useEditorSettings) {
    // Initialize data sync plugin
    Vue.use(SyncPlugin)

    // Flag editor connected immediately
    editor.processMessage({ data: { type: 'editor.connected' } }, context)

    // Listen for messages and pass to event bus
    window.addEventListener('message', event => editor.processMessage(event, context), false)

    // Tell the editor we exist
    editor.sendMessage({
      type: 'route.changed',
      details: {
        location: window.location.pathname
      }
    })

    // Listen for unload to tell the editor when we're gone
    window.addEventListener(
      'unload',
      event =>
        editor.sendMessage({
          type: 'route.changed',
          details: {
            location: ''
          }
        }),
      false
    )
  }

  // Add editor to Nuxt context as $swellEditor
  inject('swellEditor', editor)
}

// Nuxt middleware for updating the editor when the route is changed
middleware.editorFrame = ({ route }) => {
  // Tell editor what route we're on now
  editor.sendMessage({
    type: 'route.changed',
    details: {
      location: route.fullPath
    }
  })
}

// Vue plugin for watching editor updates and triggering data refetch
const SyncPlugin = {
  install: Vue => {
    Vue.mixin({
      mounted() {
        editor.enableFetchListener(this)
      },

      activated() {
        editor.enableFetchListener(this)
      },

      destroyed() {
        editor.disableFetchListener(this)
      },

      deactivated() {
        editor.disableFetchListener(this)
      }
    })
  }
}
