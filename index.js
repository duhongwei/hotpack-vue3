import { join, dirname } from 'path'
import { toFiles } from './lib/index.js'
import { renderToString } from '@vue/server-renderer'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function isVue(key) {

  return /\.vue$/.test(key)
}

export default async function ({ debug }) {

  const { util: { isHtml, replace, getImportUrl } } = this
  this.config.webPath.push({
    test: isVue,
    resolve: function ({ path }) {

      return `${path}.js`
    }
  })

  this.on('afterKey', async function () {
    let prePath = dirname(require.resolve('vue'))
    if (!prePath) {
      throw new Error(`please run "npm install vue"`)
    }
    let path = ''
    if (this.isDev()) {
      path = join(prePath, 'dist/vue.global.js')
    }
    else {
      path = join(prePath, 'dist/vue.global.prod.js')
    }
    let content = await this.fs.readFile(path)
    content = `
    ${content}
    window.Vue=Vue;
    export default Vue;
    `
    this.addFile({
      meta: { transformed: true,minified:true },
      key: 'node/vue.js',
      content
    })
    prePath = null

    prePath = dirname(require.resolve('vuex'))
    if (prePath) {
      path = join(prePath, 'vuex.global.js');

      content = await this.fs.readFile(path)
      content = `
    ${content}
    export default Vuex;
    `
      this.addFile({
        meta: { transformed: true,minified:true },
        key: 'node/vuex.js',
        content
      })
      prePath = null
    }
    prePath = dirname(require.resolve('vue-router'))
    if (prePath) {
      path = join(prePath, 'vue-router.global.js');

      content = await this.fs.readFile(path)
      content = `
  ${content}
    export default VueRouter;
    `
      this.addFile({
        meta: { transformed: true,minified:true },
        key: 'node/vue-router.js',
        content
      })
    }
  })
  this.on('afterRead', async function (files) {
    for (let file of files) {
      if (!isVue(file.path)) continue
      debug(`toFiles ${file.path}`)

      file.del = true

      toFiles(file).forEach(file => { this.addFile(file) })
    }
    this.del()
  })
  //预编译
  if (this.config.render.enable) {

    this.on('afterParseSsr', async (files) => {
      const that = this

      for (let file of files) {
        if (!isHtml(file.key)) continue

        file.content = await replace(file.content, /<div.*?\s+pre-ssr(>|\s+?.*?)<\/div>/, async (match) => {
          let m = match.match(/\s*id=['"]?([^\s'"]+)['"]?/)
          if (!m) {
            throw new Error(`${file.key} pre-ssr has no id`)
          }
          let id = m[1]

          let path = that.ssr.get(file.key)

          if (!path) {
            throw new Error(`${file.key} has not render function`, true)
          }
          let { default: controller } = await import(getImportUrl(path))

          let { app } = await controller()

          let s = await renderToString(app)

          return `<div id='${id}'>${s}</div>`
        })
      }
    })
  }
}
