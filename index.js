import { join, dirname, resolve } from 'path'
import { toFiles } from './lib/index.js'
import { renderToString } from '@vue/server-renderer'
import * as Vue from 'vue'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
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
      meta: { transformed: true, minified: true },
      key: 'node/vue.js',
      content
    })

    prePath = dirname(require.resolve('vuex'))

    if (this.isDev()) {
      path = join(prePath, 'vuex.global.js');
    }
    else {
      path = join(prePath, 'vuex.global.prod.js');
    }

    content = await this.fs.readFile(path)
    content = `
    ${content}
    export default Vuex;
    `
    this.addFile({
      meta: { transformed: true, minified: true },
      key: 'node/vuex.js',
      content
    })
    prePath = dirname(require.resolve('vue-router'))
    if (this.isDev()) {
      path = join(prePath, 'vue-router.global.js');
    }
    else {
      path = join(prePath, 'vue-router.global.prod.js');
    }
    content = await this.fs.readFile(path)

    content = `
  ${content}
    export default VueRouter;
    `
    this.addFile({
      meta: { transformed: true, minified: true },
      key: 'node/vue-router.js',
      content
    })

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
  //prerendering
  if (this.config.render.enable) {

    this.on('afterParseSsr', async (files) => {
      const that = this

      for (let file of files) {
        if (!isHtml(file.key)) continue
        let pageData = null;
        file.content = await replace(file.content, /<div.*?\s+pre-ssr.*?><\/div>/g, async (match, key) => {
          
          let path = that.ssr.get(file.key)

          if (!path) {
            throw new Error(`${file.key} has not render function`, true)
          }
          path = resolve(path)
          let { default: controller } = await import(getImportUrl(path))
          let result = await controller()
          pageData = resolve.pageData;

          let m = match.match(/\s*id=['"]?([^\s'"]+)['"]?/)
          if (!m) {
            throw new Error(`${file.key} pre-ssr has no id`)
          }
          let id = m[1]
          let s = await renderToString(result.app).catch(e => {
            console.log(file.key)
            console.error(e)
            process.exit(1)
          })
          return `<div id='${id}'>${s}</div>`
        })
        if (pageData) {
          file.content = file.content.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
            return pageData[key];
          });
        }
      }
    })
  }
}
async function replace(str, regex, asyncFn) {
  const promises = [];
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args);
    promises.push(promise);
  });
  const data = await Promise.all(promises);
  return str.replace(regex, () => data.shift());
}

async function ssr({ content, path, ctx }) {

  content = await replace(content, /<div.+?ssr.*?><\/div>|\{\{\{(\w+)\}\}\}/g, async (holder, key) => {
    let controllerPath = path

    if (!controllerPath) return holder

    let { default: controller } = await import(controllerPath)
    //https://github.com/yahoo/serialize-javascript consider using it to process the state
    let { app, state, pageData } = await controller(ctx)
    pageData = pageData || {}

    if (holder.startsWith('<div')) {
      let m = holder.match(/\s+?id=['"]?(.+?)['"]?\s+?/)
      if (!m) throw 'ssr no id'
      let id = m[1]
      let s = await renderToString(app)
      s = `<div id='${id}'>${s}</div>`
      return `${s}<script>window.__state__=${JSON.stringify(state)};\n//render at: ${new Date().toLocaleString()}</script>`
    }
    else {
      return pageData[key]
    }
  })
  return content
}

export {
  ssr,
  Vue,
  VueRouter,
  Vuex,
  renderToString
}