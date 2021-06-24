import { join, resolve, dirname } from 'path'
import { toFiles } from './lib/index.js'

import { renderToString } from '@vue/server-renderer'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

function isVue(key) {
  return /\.vue$/.test(key)
}
export default async function ({ debug }) {

  const { config: { dist }, util: { isHtml, replace } } = this
  this.addResolveKey({
    test: isVue,
    resolve: function ({ path }) {
      return `${path}.js`
    }
  })

  //其它插件可以在afterSlim中对vue做出处理
  //vue文件只是中间状态，是临时文件，需要删除
  this.on('afterParse', async function (files) {
    this.files = files.filter(item => !isVue(item.key))
  })

  this.on('afterRead', async function () {
    let prePath = dirname(require.resolve('vue'))
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
    this.files.push({
      //无论是dev,还是pro都标识为 min，就是不压缩,不buble
      meta: { isMin: true},
      path,
      content
    })

    prePath = dirname(require.resolve('vuex'))
    path = join(prePath, 'vuex.global.js');

    content = await this.fs.readFile(path)
    content = `
    ${content}
    export default Vuex;
    `
    this.files.push({
      path,
      content
    })

    prePath = dirname(require.resolve('vue-router'))
    path = join(prePath, 'vue-router.global.js');
  
    content = await this.fs.readFile(path)
    content = `
  ${content}
    export default VueRouter;
    `
    this.files.push({
      meta: { isMin: true},
      path,
      content
    })

  })
  this.on('afterRead', async function (files) {
    let addedFiles = []
    for (let file of files) {
      if (!isVue(file.path)) continue
      debug(`toFiles ${file.path}`)
      //不能删除 ，因为后面的postcss css scope还要用到，vue分解出两个文件，但用的scope id是一个。
      //file.del = true
      addedFiles = addedFiles.concat(toFiles(file))
      toFiles(file).forEach(file => this.addFile(file))
    }

  })
  //=====pre ssr 预编译======================
  if (this.config.renderEnabled) {
    this.on('afterRender', async (files) => {
      let ssrConfig = await this.fs.readJson(join(dist, 'ssr.json'))

      for (let file of files) {
        if (!isHtml(file.key)) continue

        file.content = await replace(file.content, /<div.*?\s+pre-ssr(>|\s+?.*?)<\/div>/, async (match) => {
          let m = match.match(/\s*id=['"]?([^\s'"]+)['"]?/)
          if (!m) {
            throw new Error(`${file.key} pre-ssr has no id`)
          }
          let id = m[1]

          let path = ssrConfig[file.key]
          if (!path) {
            console.trace(`${file.key} not found`)
            process.exit(1)
          }
          let { default: controller } = await import(path)

          let { app } = await controller()
     
          let s = await renderToString(app)

          return `<div id='${id}'>${s}</div>`
        })
      }
    })
  }
}
